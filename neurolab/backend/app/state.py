from dataclasses import dataclass, field


@dataclass
class SimConfig:
    population: int = 150
    hidden: list = field(default_factory=lambda: [8, 6])
    sensor_count: int = 7
    mutation_rate: float = 0.08
    mutation_strength: float = 0.4
    sim_speed: int = 2          # physics steps per streamed frame
    max_gen_steps: int = 1200   # hard cap so a generation can't run forever
    paused: bool = False
    mode: str = "train"         # train or duel
