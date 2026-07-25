import { useState } from "react";
import { BrainGraph } from "./components/BrainGraph";
import { BrainLibrary } from "./components/BrainLibrary";
import { Charts } from "./components/Charts";
import { ControlPanel } from "./components/ControlPanel";
import { SimulationCanvas } from "./components/SimulationCanvas";
import { StatsBar } from "./components/StatsBar";
import { TrackEditor } from "./components/TrackEditor";
import { useSimSocket } from "./hooks/useSimSocket";

export default function App() {
  const { connected, frame, track, send } = useSimSocket();
  const [editing, setEditing] = useState(false);

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">NeuroLab</h1>
          <p className="text-xs text-stone-500">
            Autos bringen sich selbst bei, die Strecke zu fahren.
          </p>
        </div>
        <button className="btn" onClick={() => setEditing(true)}>
          Strecke bearbeiten
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_320px] gap-4">
        <div className="space-y-4 order-2 xl:order-1">
          <div className="card">
            <div className="card-title">Steuerung</div>
            <ControlPanel config={frame?.config ?? null} send={send} />
          </div>
        </div>

        <div className="space-y-4 order-1 xl:order-2">
          <div className="card">
            <StatsBar frame={frame} connected={connected} />
          </div>
          <div className="card p-2">
            <SimulationCanvas frame={frame} track={track} />
          </div>
        </div>

        <div className="space-y-4 order-3">
          <div className="card">
            <div className="card-title">Netz vom besten Auto</div>
            <BrainGraph brain={frame?.brain ?? null} />
            <div className="flex justify-between text-[10px] text-stone-500 mt-1 px-1">
              <span>Sensoren</span>
              <span>Lenkung / Gas</span>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Fitness pro Generation</div>
            <Charts history={frame?.history ?? []} />
          </div>
          <div className="card">
            <div className="card-title">Gespeicherte Autos</div>
            <BrainLibrary send={send} mode={frame?.mode ?? "train"} />
          </div>
        </div>
      </div>

      {editing && (
        <TrackEditor track={track} send={send} onClose={() => setEditing(false)} />
      )}

      <footer className="text-center text-[11px] text-stone-600 mt-6">
        läuft lokal · Python im Backend, React im Frontend
      </footer>
    </div>
  );
}
