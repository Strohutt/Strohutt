import numpy as np

from .car import CarConfig
from .geometry import point_segment_distance, raycast, segments_cross_segment
from .track import Track

IDLE_LIMIT = 180   # kill a car after this many steps without hitting a checkpoint


class Environment:
    # holds every car in numpy arrays and steps them all at once
    def __init__(self, track: Track, size: int, config: CarConfig):
        self.track = track
        self.size = size
        self.cfg = config
        self.sensor_angles = config.sensor_angles()
        self.reset()

    def reset(self):
        n = self.size
        sp = self.track.start_pos
        jitter = (np.random.rand(n, 2).astype(np.float32) - 0.5) * 6.0
        self.pos = np.tile(sp, (n, 1)).astype(np.float32) + jitter
        self.angle = np.full(n, self.track.start_angle, dtype=np.float32)
        self.speed = np.zeros(n, dtype=np.float32)
        self.alive = np.ones(n, dtype=bool)
        self.fitness = np.zeros(n, dtype=np.float32)
        self.checkpoint = np.zeros(n, dtype=np.int64)
        self.distance = np.zeros(n, dtype=np.float32)
        self.idle = np.zeros(n, dtype=np.int64)
        self.steps = 0

    def sense(self):
        # returns network inputs (N, n_inputs): sensor distances + speed
        n = self.size
        s = self.sensor_angles.shape[0]
        abs_ang = self.angle[:, None] + self.sensor_angles[None, :]
        dirs = np.stack([np.cos(abs_ang), np.sin(abs_ang)], axis=2)
        origins = np.repeat(self.pos[:, None, :], s, axis=1)

        dist = raycast(
            origins.reshape(-1, 2),
            dirs.reshape(-1, 2),
            self.track.wall_a,
            self.track.wall_b,
            self.cfg.sensor_range,
        ).reshape(n, s)

        self._last_sensor_dist = dist
        self._last_sensor_dirs = dirs
        norm_dist = dist / self.cfg.sensor_range
        norm_speed = (self.speed / self.cfg.max_speed)[:, None]
        return np.concatenate([norm_dist, norm_speed], axis=1).astype(np.float32)

    def step(self, actions):
        # actions: (N, 2) -> steering [-1,1], throttle [0,1]
        alive = self.alive
        steering = actions[:, 0]
        throttle = actions[:, 1]

        self.speed += throttle * self.cfg.accel - self.cfg.friction
        self.speed = np.clip(self.speed, 0.0, self.cfg.max_speed)
        self.angle += steering * self.cfg.turn_rate * (self.speed / self.cfg.max_speed)

        prev = self.pos.copy()
        vel = np.stack([np.cos(self.angle), np.sin(self.angle)], axis=1) * self.speed[:, None]
        new_pos = self.pos + vel
        self.pos = np.where(alive[:, None], new_pos, self.pos)

        step_dist = np.linalg.norm(self.pos - prev, axis=1)
        self.distance += np.where(alive, step_dist, 0.0)

        # each car only checks its own next checkpoint
        cp = self.checkpoint % self.track.num_checkpoints
        a = self.track.cp_a[cp]
        b = self.track.cp_b[cp]
        crossed = segments_cross_segment(prev, self.pos, a, b) & alive
        self.checkpoint += crossed.astype(np.int64)
        self.fitness += crossed.astype(np.float32) * 100.0
        self.idle = np.where(crossed, 0, self.idle + alive.astype(np.int64))

        # tiny reward for moving so early random cars get some gradient to climb
        self.fitness += np.where(alive, step_dist * 0.05, 0.0).astype(np.float32)

        wall_dist = point_segment_distance(self.pos, self.track.wall_a, self.track.wall_b)
        hit = (wall_dist < self.cfg.radius) & alive
        stuck = (self.idle > IDLE_LIMIT) & alive
        self.alive = alive & ~hit & ~stuck

        self.steps += 1

    def all_dead(self):
        return not bool(self.alive.any())

    def leader_index(self):
        if self.alive.any():
            masked = np.where(self.alive, self.fitness, -np.inf)
            return int(np.argmax(masked))
        return int(np.argmax(self.fitness))

    def cars_snapshot(self, leader):
        out = []
        for i in range(self.size):
            out.append({
                "x": round(float(self.pos[i, 0]), 1),
                "y": round(float(self.pos[i, 1]), 1),
                "a": round(float(self.angle[i]), 3),
                "alive": bool(self.alive[i]),
                "leader": i == leader,
            })
        return out

    def leader_rays(self, leader):
        if not hasattr(self, "_last_sensor_dist"):
            return []
        rays = []
        origin = self.pos[leader]
        for s in range(self.sensor_angles.shape[0]):
            d = float(self._last_sensor_dist[leader, s])
            dx, dy = self._last_sensor_dirs[leader, s]
            rays.append({
                "x1": round(float(origin[0]), 1),
                "y1": round(float(origin[1]), 1),
                "x2": round(float(origin[0] + dx * d), 1),
                "y2": round(float(origin[1] + dy * d), 1),
                "dist": round(d, 1),
            })
        return rays
