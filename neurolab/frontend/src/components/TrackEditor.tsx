import { useEffect, useRef, useState } from "react";
import type { Command, TrackData } from "../types";

interface Props {
  track: TrackData | null;
  send: (cmd: Command) => void;
  onClose: () => void;
}

export function TrackEditor({ track, send, onClose }: Props) {
  const [W, H] = track?.world ?? [1000, 700];
  const [points, setPoints] = useState<number[][]>(track?.centerline ?? []);
  const [width, setWidth] = useState<number>(track?.width ?? 100);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0a0c12";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#12161f";
    for (let x = 0; x < W; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    if (points.length > 0) {
      // asphalt preview
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1c2230";
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
      if (points.length > 2) ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = "#e6a23c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
      if (points.length > 2) ctx.closePath();
      ctx.stroke();

      points.forEach(([x, y], i) => {
        ctx.fillStyle = i === 0 ? "#cf4b2c" : "#9aa7b0";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [points, width, W, H]);

  const addPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    setPoints((p) => [...p, [Math.round(x), Math.round(y)]]);
  };

  const apply = () => {
    if (points.length < 3) return;
    send({ type: "track", centerline: points, width });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
      <div className="card max-w-5xl w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="card-title mb-0">Strecke zeichnen</div>
          <button className="btn" onClick={onClose}>
            schließen
          </button>
        </div>
        <p className="text-xs text-stone-400 mb-2">
          Klick nacheinander Punkte für die Mittellinie (am besten im Uhrzeigersinn). Der rote
          Punkt ist der Start, mindestens drei Punkte. Der Rest wird automatisch geschlossen.
        </p>
        <canvas
          ref={canvasRef}
          onClick={addPoint}
          className="w-full border border-edge rounded-lg cursor-crosshair bg-black"
        />
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-stone-400">
            Breite
            <input
              type="range"
              min={50}
              max={180}
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value, 10))}
            />
            <span className="font-mono text-accent">{width}</span>
          </label>
          <button className="btn" onClick={() => setPoints((p) => p.slice(0, -1))}>
            letzten Punkt zurück
          </button>
          <button className="btn" onClick={() => setPoints([])}>
            leeren
          </button>
          <button
            className="btn btn-accent ml-auto"
            onClick={apply}
            disabled={points.length < 3}
          >
            übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
