import type { Frame } from "../types";

interface Props {
  frame: Frame | null;
  connected: boolean;
}

export function StatsBar({ frame, connected }: Props) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <div className="stat">
        <span className="stat-val text-accent">{frame?.generation ?? "-"}</span>
        <span className="stat-label">Generation</span>
      </div>
      <div className="stat">
        <span className="stat-val">
          {frame ? `${frame.alive}/${frame.population}` : "-"}
        </span>
        <span className="stat-label">lebend</span>
      </div>
      <div className="stat">
        <span className="stat-val">{frame ? Math.round(frame.bestFitness) : "-"}</span>
        <span className="stat-label">beste Fitness</span>
      </div>
      <div className="stat">
        <span className="stat-val">{frame ? Math.round(frame.leaderFitness) : "-"}</span>
        <span className="stat-label">aktuell bestes</span>
      </div>
      <div className="stat">
        <span className="stat-val">{frame?.steps ?? "-"}</span>
        <span className="stat-label">Steps</span>
      </div>
      <div className="ml-auto flex items-center gap-2 pr-2">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-accent" : "bg-danger animate-pulse"
          }`}
        />
        <span className="text-xs text-stone-400">
          {connected ? "verbunden" : "keine Verbindung"}
        </span>
        {frame?.mode === "duel" && (
          <span className="text-xs px-2 py-0.5 rounded bg-accent2/20 text-accent2 border border-accent2/40">
            Duell
          </span>
        )}
      </div>
    </div>
  );
}
