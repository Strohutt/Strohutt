import math
from dataclasses import dataclass

import numpy as np


@dataclass
class CarConfig:
    sensor_count: int = 7
    sensor_fov: float = math.radians(180)
    sensor_range: float = 220.0
    radius: float = 9.0
    max_speed: float = 7.0
    accel: float = 0.35
    friction: float = 0.04
    turn_rate: float = 0.10

    def sensor_angles(self):
        n = self.sensor_count
        if n == 1:
            return np.array([0.0], dtype=np.float32)
        return np.linspace(-self.sensor_fov / 2, self.sensor_fov / 2, n).astype(np.float32)

    @property
    def n_inputs(self):
        return self.sensor_count + 1  # sensors + current speed

    @property
    def n_outputs(self):
        return 2  # steering, throttle
