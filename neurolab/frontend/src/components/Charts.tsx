import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GenHistory } from "../types";

interface Props {
  history: GenHistory[];
}

export function Charts({ history }: Props) {
  return (
    <div className="h-[180px] w-full">
      {history.length === 0 ? (
        <div className="text-stone-600 text-sm">
          Die Kurve kommt, sobald die erste Generation durch ist.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#1b2130" strokeDasharray="3 3" />
            <XAxis dataKey="gen" stroke="#5a6377" fontSize={10} />
            <YAxis stroke="#5a6377" fontSize={10} />
            <Tooltip
              contentStyle={{
                background: "#11141c",
                border: "1px solid #222838",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#9aa4b8" }}
            />
            <Line
              type="monotone"
              dataKey="best"
              name="Beste"
              stroke="#e6a23c"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="mean"
              name="Durchschnitt"
              stroke="#9aa7b0"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
