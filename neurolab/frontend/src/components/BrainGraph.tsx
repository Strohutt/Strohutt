import { useMemo } from "react";
import type { Brain } from "../types";

interface Props {
  brain: Brain | null;
}

const WIDTH = 320;
const HEIGHT = 260;
const PAD = 26;

export function BrainGraph({ brain }: Props) {
  const layout = useMemo(() => {
    if (!brain || !brain.layerSizes?.length) return null;
    const layers = brain.layerSizes;
    const xs = layers.map((_, i) =>
      layers.length === 1 ? WIDTH / 2 : PAD + (i * (WIDTH - 2 * PAD)) / (layers.length - 1)
    );
    const nodes = layers.map((count, li) => {
      const ys = Array.from({ length: count }, (_, ni) =>
        count === 1 ? HEIGHT / 2 : PAD + (ni * (HEIGHT - 2 * PAD)) / (count - 1)
      );
      return ys.map((y) => ({ x: xs[li], y }));
    });
    return { nodes, layers };
  }, [brain]);

  if (!brain || !layout) {
    return <div className="text-stone-600 text-sm">noch keine Daten</div>;
  }

  const acts = brain.activations || [];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
      {/* edges colored by weight */}
      {brain.weights.map((layerW, li) =>
        layerW.map((row, j) =>
          row.map((w, i) => {
            const from = layout.nodes[li][i];
            const to = layout.nodes[li + 1][j];
            if (!from || !to) return null;
            const mag = Math.min(1, Math.abs(w));
            const color = w >= 0 ? "230,162,60" : "207,75,44";
            return (
              <line
                key={`e${li}-${i}-${j}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={`rgba(${color},${0.08 + mag * 0.6})`}
                strokeWidth={0.4 + mag * 1.8}
              />
            );
          })
        )
      )}
      {/* neurons colored by activation */}
      {layout.nodes.map((layerNodes, li) =>
        layerNodes.map((n, ni) => {
          const a = acts[li]?.[ni] ?? 0;
          const intensity = Math.min(1, Math.abs(a));
          const fill =
            a >= 0
              ? `rgba(230,162,60,${0.25 + intensity * 0.75})`
              : `rgba(154,167,176,${0.25 + intensity * 0.75})`;
          return (
            <circle
              key={`n${li}-${ni}`}
              cx={n.x}
              cy={n.y}
              r={6}
              fill={fill}
              stroke="#0a0c12"
              strokeWidth={1}
            />
          );
        })
      )}
    </svg>
  );
}
