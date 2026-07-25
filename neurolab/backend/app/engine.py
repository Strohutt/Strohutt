import asyncio
import time

import numpy as np
import torch

from .neural import brain_io
from .neural.evolution import evolve
from .neural.network import Population
from .simulation.car import CarConfig
from .simulation.environment import Environment
from .simulation.track import Track, default_track
from .state import SimConfig

FRAME_HZ = 30   # streaming rate to the browser, independent of sim speed


class Engine:
    def __init__(self):
        self.cfg = SimConfig()
        self.track = default_track()
        self.car_cfg = CarConfig(sensor_count=self.cfg.sensor_count)
        self.population = self._new_population()
        self.env = Environment(self.track, self.cfg.population, self.car_cfg)
        self.generation = 1
        self.best_fitness = 0.0
        self.history = []
        self.best_genome = None
        self._step_once = False
        self._rebuild = False
        self._clients = set()
        self._duel_labels = []

    def _layer_sizes(self):
        return [self.car_cfg.n_inputs, *self.cfg.hidden, self.car_cfg.n_outputs]

    def _new_population(self):
        return Population(self.cfg.population, self._layer_sizes())

    def rebuild(self):
        self.car_cfg = CarConfig(sensor_count=self.cfg.sensor_count)
        self.population = self._new_population()
        self.env = Environment(self.track, self.cfg.population, self.car_cfg)
        self.generation = 1
        self.best_fitness = 0.0
        self.history = []
        self.cfg.mode = "train"
        self._duel_labels = []

    def add_client(self, ws):
        self._clients.add(ws)

    def remove_client(self, ws):
        self._clients.discard(ws)

    def start_duel(self, brain_ids):
        genomes = []
        labels = []
        for bid in brain_ids:
            rec = brain_io.load_brain(bid)
            if rec:
                genomes.append(rec["genome"])
                labels.append(rec["name"])
        if not genomes:
            return False
        # duel brains have to share the architecture, take it from the first
        layers = genomes[0]["layer_sizes"]
        sensor_count = layers[0] - 1
        self.car_cfg = CarConfig(sensor_count=sensor_count)
        self.population = Population(len(genomes), layers)
        for i, g in enumerate(genomes):
            self.population.set_individual(i, g)
        self.env = Environment(self.track, len(genomes), self.car_cfg)
        self.cfg.mode = "duel"
        self._duel_labels = labels
        return True

    def save_current_best(self, name):
        genome = self.best_genome or self.population.get_individual(self.env.leader_index())
        meta = {
            "generation": self.generation,
            "fitness": round(self.best_fitness, 1),
            "layers": self._layer_sizes(),
        }
        return brain_io.save_brain(name, genome, meta)

    def set_track(self, centerline, width):
        version = self.track.version + 1
        self.track = Track(centerline=centerline, width=float(width), version=version)
        self.env = Environment(self.track, self.cfg.population, self.car_cfg)
        self.generation = 1
        self.best_fitness = 0.0
        self.history = []

    def handle_command(self, msg):
        kind = msg.get("type")
        if kind == "control":
            action = msg.get("action")
            if action == "play":
                self.cfg.paused = False
            elif action == "pause":
                self.cfg.paused = True
            elif action == "step":
                self._step_once = True
            elif action == "reset":
                self._rebuild = True
        elif kind == "params":
            structural = False
            if "population" in msg:
                v = int(msg["population"])
                structural |= v != self.cfg.population
                self.cfg.population = max(2, min(600, v))
            if "hidden" in msg:
                v = [max(1, int(h)) for h in msg["hidden"]][:4]
                structural |= v != self.cfg.hidden
                self.cfg.hidden = v or [8]
            if "sensorCount" in msg:
                v = int(msg["sensorCount"])
                structural |= v != self.cfg.sensor_count
                self.cfg.sensor_count = max(1, min(15, v))
            if "mutationRate" in msg:
                self.cfg.mutation_rate = float(np.clip(msg["mutationRate"], 0.0, 1.0))
            if "mutationStrength" in msg:
                self.cfg.mutation_strength = float(np.clip(msg["mutationStrength"], 0.0, 3.0))
            if "simSpeed" in msg:
                self.cfg.sim_speed = int(np.clip(msg["simSpeed"], 1, 40))
            if structural:
                self._rebuild = True
        elif kind == "track":
            self.set_track(msg["centerline"], msg.get("width", 100.0))
        elif kind == "duel":
            self.start_duel(msg.get("brains", []))
        elif kind == "trainMode":
            self._rebuild = True

    async def run(self):
        frame_dt = 1.0 / FRAME_HZ
        while True:
            t0 = time.perf_counter()
            if self._rebuild:
                self._rebuild = False
                self.rebuild()

            advance = not self.cfg.paused or self._step_once
            self._step_once = False
            if advance:
                steps = self.cfg.sim_speed if not self.cfg.paused else 1
                for _ in range(steps):
                    self._tick()
                    if self.env.all_dead() or self.env.steps >= self.cfg.max_gen_steps:
                        self._end_generation()
                        break

            await self._broadcast()
            elapsed = time.perf_counter() - t0
            await asyncio.sleep(max(0.0, frame_dt - elapsed))

    def _tick(self):
        inputs = self.env.sense()
        x = torch.from_numpy(inputs)
        actions = self.population.forward(x).numpy()
        self.env.step(actions)
        gen_best = float(self.env.fitness.max())
        if gen_best > self.best_fitness:
            self.best_fitness = gen_best

    def _end_generation(self):
        leader = int(np.argmax(self.env.fitness))
        gen_best = float(self.env.fitness[leader])
        mean = float(self.env.fitness.mean())
        diversity = float(self.env.fitness.std())
        self.history.append({
            "gen": self.generation,
            "best": round(gen_best, 1),
            "mean": round(mean, 1),
            "diversity": round(diversity, 1),
        })
        self.history = self.history[-200:]

        if self.cfg.mode == "duel":
            self.env.reset()   # same brains race again
            return

        if gen_best >= self.best_fitness - 1e-6:
            self.best_genome = self.population.get_individual(leader)

        self.population = evolve(
            self.population,
            torch.from_numpy(self.env.fitness),
            self.cfg.mutation_rate,
            self.cfg.mutation_strength,
        )
        self.generation += 1
        self.env.reset()

    def snapshot(self):
        leader = self.env.leader_index()
        return {
            "type": "frame",
            "mode": self.cfg.mode,
            "generation": self.generation,
            "alive": int(self.env.alive.sum()),
            "population": self.env.size,
            "steps": self.env.steps,
            "bestFitness": round(self.best_fitness, 1),
            "leaderFitness": round(float(self.env.fitness[leader]), 1),
            "cars": self.env.cars_snapshot(leader),
            "rays": self.env.leader_rays(leader),
            "brain": self.population.leader_snapshot(leader),
            "history": self.history,
            "duelLabels": self._duel_labels,
            "trackVersion": self.track.version,
            "config": {
                "population": self.cfg.population,
                "hidden": self.cfg.hidden,
                "sensorCount": self.cfg.sensor_count,
                "mutationRate": self.cfg.mutation_rate,
                "mutationStrength": self.cfg.mutation_strength,
                "simSpeed": self.cfg.sim_speed,
                "paused": self.cfg.paused,
                "mode": self.cfg.mode,
            },
        }

    async def _broadcast(self):
        if not self._clients:
            return
        msg = self.snapshot()
        dead = []
        for ws in list(self._clients):
            try:
                await ws.send_json(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove_client(ws)
