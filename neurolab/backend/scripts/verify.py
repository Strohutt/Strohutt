# quick check that the cars actually learn. run with: python -m scripts.verify
import numpy as np
import torch

from app.neural.evolution import evolve
from app.neural.network import Population
from app.simulation.car import CarConfig
from app.simulation.environment import Environment
from app.simulation.track import default_track


def run_generation(env, pop, max_steps):
    env.reset()
    for _ in range(max_steps):
        inputs = env.sense()
        actions = pop.forward(torch.from_numpy(inputs)).numpy()
        env.step(actions)
        if env.all_dead():
            break
    return env.fitness.copy()


def main():
    np.random.seed(0)
    torch.manual_seed(0)

    track = default_track()
    cfg = CarConfig()
    size = 120
    layers = [cfg.n_inputs, 8, 6, cfg.n_outputs]
    pop = Population(size, layers, seed=0)
    env = Environment(track, size, cfg)

    generations = 25
    best_per_gen = []
    for g in range(generations):
        fitness = run_generation(env, pop, max_steps=1200)
        best = float(fitness.max())
        best_per_gen.append(best)
        print(f"gen {g+1:2d}  best={best:8.1f}  mean={fitness.mean():7.1f}")
        pop = evolve(pop, torch.from_numpy(fitness), mutation_rate=0.1, mutation_strength=0.4)

    early = max(best_per_gen[:5])
    late = max(best_per_gen[-5:])
    print(f"\nbest(first 5 gens)={early:.1f}   best(last 5 gens)={late:.1f}")
    assert late > early, "Cars did not improve over generations!"
    assert late >= 100.0, "Cars never passed a single checkpoint!"
    print("ok: fitness went up, the cars learned to drive")


if __name__ == "__main__":
    main()
