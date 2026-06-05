import torch

from .network import Population


def evolve(pop, fitness, mutation_rate, mutation_strength, elite_frac=0.1, tournament=4):
    N = pop.size
    device = pop.device
    order = torch.argsort(fitness, descending=True)
    n_elite = max(1, int(N * elite_frac))

    child = Population(N, pop.layer_sizes, device=device)

    # keep the best ones unchanged
    for layer in range(len(pop.weights)):
        child.weights[layer][:n_elite] = pop.weights[layer][order[:n_elite]]
        child.biases[layer][:n_elite] = pop.biases[layer][order[:n_elite]]

    n_children = N - n_elite
    if n_children > 0:
        p1 = _tournament_select(fitness, n_children, tournament, device)
        p2 = _tournament_select(fitness, n_children, tournament, device)
        for layer in range(len(pop.weights)):
            w = _crossover(pop.weights[layer], p1, p2)
            b = _crossover(pop.biases[layer], p1, p2)
            w = _mutate(w, mutation_rate, mutation_strength)
            b = _mutate(b, mutation_rate, mutation_strength)
            child.weights[layer][n_elite:] = w
            child.biases[layer][n_elite:] = b

    return child


def _tournament_select(fitness, count, k, device):
    N = fitness.shape[0]
    contenders = torch.randint(0, N, (count, k), device=device)
    fit = fitness[contenders]
    best = fit.argmax(dim=1)
    return contenders[torch.arange(count, device=device), best]


def _crossover(param, p1, p2):
    a = param[p1]
    b = param[p2]
    mask = (torch.rand_like(a) < 0.5)
    return torch.where(mask, a, b)


def _mutate(param, rate, strength):
    mask = (torch.rand_like(param) < rate).float()
    noise = torch.randn_like(param) * strength
    return param + mask * noise
