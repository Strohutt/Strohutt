import { useEffect, useRef } from "react";
import type { Frame, TrackData } from "../types";

interface Props {
  frame: Frame | null;
  track: TrackData | null;
}

export function SimulationCanvas({ frame, track }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !track) return;
    const [W, H] = track.world;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#110f0c";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1c1813";
    ctx.lineWidth = 1;
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

    // the road is just the centerline drawn as a fat stroke
    if (track.centerline.length > 1) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#262019";
      ctx.lineWidth = track.width;
      ctx.beginPath();
      ctx.moveTo(track.centerline[0][0], track.centerline[0][1]);
      for (const [x, y] of track.centerline.slice(1)) ctx.lineTo(x, y);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(154,167,176,0.08)";
    ctx.lineWidth = 1.5;
    for (const [x1, y1, x2, y2] of track.checkpoints) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.strokeStyle = "#4a4036";
    ctx.lineWidth = 3;
    for (const [x1, y1, x2, y2] of track.walls) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    if (!frame) return;

    for (const r of frame.rays) {
      ctx.strokeStyle = "rgba(230,162,60,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x1, r.y1);
      ctx.lineTo(r.x2, r.y2);
      ctx.stroke();
      ctx.fillStyle = "rgba(230,162,60,0.5)";
      ctx.beginPath();
      ctx.arc(r.x2, r.y2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const cw = 16;
    const ch = 9;
    for (const car of frame.cars) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.a);
      if (car.leader) ctx.fillStyle = "#e6a23c";
      else if (car.alive) ctx.fillStyle = "#c9cdd2";
      else ctx.fillStyle = "rgba(207,75,44,0.25)";
      ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
      if (car.leader) {
        ctx.strokeStyle = "#fff4e0";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);
      }
      ctx.restore();
    }
  }, [frame, track]);

  return <canvas ref={canvasRef} className="w-full h-full rounded-md" />;
}
