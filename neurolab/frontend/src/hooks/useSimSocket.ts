import { useCallback, useEffect, useRef, useState } from "react";
import type { Command, Frame, TrackData } from "../types";

interface SocketState {
  connected: boolean;
  frame: Frame | null;
  track: TrackData | null;
  send: (cmd: Command) => void;
}

const WS_URL = `ws://${location.host}/ws`;

export function useSimSocket(): SocketState {
  const [connected, setConnected] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [track, setTrack] = useState<TrackData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // auto-reconnect after a short delay
      setTimeout(connect, 1000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "frame") setFrame(msg as Frame);
      else if (msg.type === "track") setTrack(msg as TrackData);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const send = useCallback((cmd: Command) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(cmd));
  }, []);

  return { connected, frame, track, send };
}
