import math
from dataclasses import dataclass, field

import numpy as np

WORLD_W = 1000.0
WORLD_H = 700.0


@dataclass
class Track:
    # a track is just a closed centerline plus a width; walls and checkpoints
    # are derived from that so the frontend only has to draw the centerline
    centerline: list
    width: float = 90.0
    version: int = 0

    wall_a: np.ndarray = field(default_factory=lambda: np.zeros((0, 2), np.float32))
    wall_b: np.ndarray = field(default_factory=lambda: np.zeros((0, 2), np.float32))
    cp_a: np.ndarray = field(default_factory=lambda: np.zeros((0, 2), np.float32))
    cp_b: np.ndarray = field(default_factory=lambda: np.zeros((0, 2), np.float32))
    start_pos: np.ndarray = field(default_factory=lambda: np.zeros(2, np.float32))
    start_angle: float = 0.0

    def __post_init__(self):
        self._build()

    def _build(self):
        pts = np.asarray(self.centerline, dtype=np.float32)
        n = len(pts)
        if n < 3:
            raise ValueError("Track needs at least 3 centerline points")

        half = self.width / 2.0
        left = np.zeros_like(pts)
        right = np.zeros_like(pts)
        for i in range(n):
            prev = pts[(i - 1) % n]
            nxt = pts[(i + 1) % n]
            tangent = nxt - prev
            norm = math.hypot(float(tangent[0]), float(tangent[1])) or 1.0
            nx = -tangent[1] / norm
            ny = tangent[0] / norm
            left[i] = pts[i] + np.array([nx, ny], np.float32) * half
            right[i] = pts[i] - np.array([nx, ny], np.float32) * half

        wa, wb = [], []
        for i in range(n):
            j = (i + 1) % n
            wa.append(left[i]);  wb.append(left[j])
            wa.append(right[i]); wb.append(right[j])
        self.wall_a = np.asarray(wa, dtype=np.float32)
        self.wall_b = np.asarray(wb, dtype=np.float32)

        self.cp_a = left.copy()
        self.cp_b = right.copy()

        self.start_pos = pts[0].copy()
        head = pts[1] - pts[0]
        self.start_angle = math.atan2(float(head[1]), float(head[0]))

    @property
    def num_checkpoints(self):
        return len(self.cp_a)

    def to_dict(self):
        return {
            "version": self.version,
            "width": self.width,
            "centerline": [[float(x), float(y)] for x, y in self.centerline],
            "walls": [
                [float(a[0]), float(a[1]), float(b[0]), float(b[1])]
                for a, b in zip(self.wall_a, self.wall_b)
            ],
            "checkpoints": [
                [float(a[0]), float(a[1]), float(b[0]), float(b[1])]
                for a, b in zip(self.cp_a, self.cp_b)
            ],
            "start": [float(self.start_pos[0]), float(self.start_pos[1])],
            "startAngle": self.start_angle,
            "world": [WORLD_W, WORLD_H],
        }


def default_track():
    cx, cy = WORLD_W / 2.0, WORLD_H / 2.0
    rx, ry = 360.0, 230.0
    pts = []
    steps = 40
    for i in range(steps):
        ang = 2.0 * math.pi * i / steps
        pts.append([cx + rx * math.cos(ang), cy + ry * math.sin(ang)])
    return Track(centerline=pts, width=110.0, version=1)
