import { useEffect, useState } from "react";
import type { Command, SimConfig } from "../types";

interface Props {
  config: SimConfig | null;
  send: (cmd: Command) => void;
}

export function ControlPanel({ config, send }: Props) {
  const paused = config?.paused ?? false;

  // local state for live sliders, seeded once from the backend config
  const [mutationRate, setMutationRate] = useState(0.08);
  const [mutationStrength, setMutationStrength] = useState(0.4);
  const [simSpeed, setSimSpeed] = useState(2);
  const [population, setPopulation] = useState(150);
  const [sensorCount, setSensorCount] = useState(7);
  const [hidden, setHidden] = useState("8,6");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (config && !seeded) {
      setMutationRate(config.mutationRate);
      setMutationStrength(config.mutationStrength);
      setSimSpeed(config.simSpeed);
      setPopulation(config.population);
      setSensorCount(config.sensorCount);
      setHidden(config.hidden.join(","));
      setSeeded(true);
    }
  }, [config, seeded]);

  const applyStructure = () => {
    const layers = hidden
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    send({ type: "params", population, sensorCount, hidden: layers.length ? layers : [8] });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          className={`btn ${paused ? "" : "btn-accent"}`}
          onClick={() => send({ type: "control", action: "play" })}
        >
          Play
        </button>
        <button
          className={`btn ${paused ? "btn-accent" : ""}`}
          onClick={() => send({ type: "control", action: "pause" })}
        >
          Pause
        </button>
        <button className="btn" onClick={() => send({ type: "control", action: "step" })}>
          Step
        </button>
        <button
          className="btn hover:!border-danger hover:!text-danger"
          onClick={() => send({ type: "control", action: "reset" })}
        >
          Reset
        </button>
      </div>

      <Slider
        label="Zeitraffer (Sim-Speed)"
        value={simSpeed}
        min={1}
        max={40}
        step={1}
        suffix="×"
        onChange={(v) => {
          setSimSpeed(v);
          send({ type: "params", simSpeed: v });
        }}
      />
      <Slider
        label="Mutationsrate"
        value={mutationRate}
        min={0}
        max={0.6}
        step={0.01}
        onChange={(v) => {
          setMutationRate(v);
          send({ type: "params", mutationRate: v });
        }}
      />
      <Slider
        label="Mutationsstärke"
        value={mutationStrength}
        min={0}
        max={1.5}
        step={0.05}
        onChange={(v) => {
          setMutationStrength(v);
          send({ type: "params", mutationStrength: v });
        }}
      />

      <div className="border-t border-edge pt-3 space-y-3">
        <div className="text-xs text-stone-500">
          Netzaufbau (startet das Training neu)
        </div>
        <Slider
          label="Population"
          value={population}
          min={10}
          max={400}
          step={10}
          onChange={setPopulation}
        />
        <Slider
          label="Sensoren"
          value={sensorCount}
          min={3}
          max={13}
          step={1}
          onChange={setSensorCount}
        />
        <label className="block">
          <span className="text-xs text-stone-400">verdeckte Schichten (z.B. 8,6)</span>
          <input
            value={hidden}
            onChange={(e) => setHidden(e.target.value)}
            className="mt-1 w-full bg-panel2 border border-edge rounded px-2 py-1 text-sm font-mono"
          />
        </label>
        <button className="btn btn-accent w-full" onClick={applyStructure}>
          übernehmen
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs">
        <span className="text-stone-400">{label}</span>
        <span className="font-mono text-accent">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full mt-1"
      />
    </label>
  );
}
