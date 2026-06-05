import { useCallback, useEffect, useState } from "react";
import type { BrainRecord, Command } from "../types";

interface Props {
  send: (cmd: Command) => void;
  mode: string;
}

export function BrainLibrary({ send, mode }: Props) {
  const [brains, setBrains] = useState<BrainRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/brains");
      const data = await res.json();
      setBrains(data.brains ?? []);
    } catch {
      /* backend not up yet */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async () => {
    await fetch("/api/brains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/brains/${id}`, { method: "DELETE" });
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    refresh();
  };

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const startDuel = () => {
    if (selected.size < 1) return;
    send({ type: "duel", brains: [...selected] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="flex-1 bg-panel2 border border-edge rounded px-2 py-1 text-sm"
        />
        <button className="btn btn-accent" onClick={save}>
          speichern
        </button>
      </div>

      <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
        {brains.length === 0 && (
          <div className="text-stone-600 text-xs">Noch nichts gespeichert.</div>
        )}
        {brains.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-2 bg-panel2 border border-edge rounded px-2 py-1"
          >
            <input
              type="checkbox"
              checked={selected.has(b.id)}
              onChange={() => toggle(b.id)}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{b.name}</div>
              <div className="text-[10px] text-stone-500 font-mono">
                Gen {String((b.meta as any)?.generation ?? "?")} · Fit{" "}
                {String((b.meta as any)?.fitness ?? "?")}
              </div>
            </div>
            <button
              className="text-stone-500 hover:text-danger text-xs px-1"
              onClick={() => remove(b.id)}
              title="löschen"
            >
              x
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn flex-1" onClick={startDuel} disabled={selected.size < 1}>
          Duell ({selected.size})
        </button>
        {mode === "duel" && (
          <button
            className="btn flex-1"
            onClick={() => send({ type: "control", action: "reset" })}
          >
            zum Training
          </button>
        )}
      </div>
    </div>
  );
}
