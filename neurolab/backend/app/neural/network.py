import torch

torch.set_grad_enabled(False)


class Population:
    # the whole population lives in a few tensors so one forward pass covers
    # every car. weights[l] is (N, out, in), biases[l] is (N, out).
    def __init__(self, size, layer_sizes, device="cpu", seed=None):
        self.size = size
        self.layer_sizes = list(layer_sizes)
        self.device = device
        gen = torch.Generator(device=device)
        if seed is not None:
            gen.manual_seed(seed)
        self.weights = []
        self.biases = []
        for i in range(len(layer_sizes) - 1):
            n_in, n_out = layer_sizes[i], layer_sizes[i + 1]
            scale = (1.0 / n_in) ** 0.5
            w = torch.randn(size, n_out, n_in, generator=gen, device=device) * scale
            b = torch.zeros(size, n_out, device=device)
            self.weights.append(w)
            self.biases.append(b)
        self.last_activations = []

    @property
    def n_inputs(self):
        return self.layer_sizes[0]

    @property
    def n_outputs(self):
        return self.layer_sizes[-1]

    def forward(self, x):
        h = x.unsqueeze(2)
        self.last_activations = [x]
        n_layers = len(self.weights)
        for i in range(n_layers):
            z = torch.bmm(self.weights[i], h) + self.biases[i].unsqueeze(2)
            if i < n_layers - 1:
                h = torch.tanh(z)
            else:
                h = z
            self.last_activations.append(h.squeeze(2))
        out = h.squeeze(2)
        steering = torch.tanh(out[:, 0:1])
        throttle = torch.sigmoid(out[:, 1:2])
        return torch.cat([steering, throttle], dim=1)

    def get_individual(self, idx):
        return {
            "layer_sizes": self.layer_sizes,
            "weights": [w[idx].cpu().tolist() for w in self.weights],
            "biases": [b[idx].cpu().tolist() for b in self.biases],
        }

    def set_individual(self, idx, genome):
        for l, (w, b) in enumerate(zip(genome["weights"], genome["biases"])):
            self.weights[l][idx] = torch.tensor(w, device=self.device)
            self.biases[l][idx] = torch.tensor(b, device=self.device)

    def leader_snapshot(self, idx):
        # weights + last activations of one car, for drawing the brain
        acts = [a[idx].cpu().tolist() for a in self.last_activations] if self.last_activations else []
        return {
            "layerSizes": self.layer_sizes,
            "weights": [w[idx].cpu().tolist() for w in self.weights],
            "activations": acts,
        }
