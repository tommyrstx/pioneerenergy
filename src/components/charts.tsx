"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtInt } from "@/lib/format";
import type { MonthPoint } from "@/lib/types";

export type Colour = "amber" | "blue" | "sage" | "plum" | "grey" | "red" | "green";
export const cssVar = (c: Colour) => `var(--${c})`;

type Row = MonthPoint;
const val = (r: Row, key: string) => Number((r as unknown as Record<string, unknown>)[key]) || 0;

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(min-width: 640px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useWide() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true,
  );
}

/** Hatch fills for partial-month bars. Rendered once per page. */
export function HatchDefs() {
  const colours: Colour[] = ["amber", "blue", "sage", "plum", "grey", "red", "green"];
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {colours.map((c) => (
          <pattern key={c} id={`hatch-${c}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" style={{ fill: "var(--paper)" }} />
            <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: cssVar(c) }} strokeWidth="3.5" />
          </pattern>
        ))}
      </defs>
    </svg>
  );
}

const fill = (c: Colour, partial: boolean) => (partial ? `url(#hatch-${c})` : cssVar(c));

function TipBox({
  active,
  payload,
  series,
  total,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  series: Series[];
  total?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const sum = series.reduce((s, x) => s + val(row, x.key), 0);
  return (
    <div className="tip">
      <b>{row.longLabel}</b>
      {series.map((s) => (
        <div key={s.key}>
          {series.length > 1 && <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: cssVar(s.colour), marginRight: 6 }} />}
          {s.label}: <b style={{ display: "inline" }}>{fmtInt(val(row, s.key))}</b>
        </div>
      ))}
      {total && series.length > 1 && (
        <div className="muted" style={{ marginTop: 2 }}>
          Total: {fmtInt(sum)}
        </div>
      )}
    </div>
  );
}

export interface Series {
  key: string;
  label: string;
  colour: Colour;
}

/**
 * Monthly bars, single or stacked. The partial month is hatched.
 * On narrow screens only the indexes in `keyLabels` get a value label;
 * tapping a bar shows the rest in the tooltip.
 */
export function MonthlyBars({
  data,
  series,
  height = 240,
  keyLabels,
  ariaLabel,
}: {
  data: readonly Row[];
  series: Series[];
  height?: number;
  keyLabels?: number[];
  ariaLabel: string;
}) {
  const wide = useWide();
  const stacked = series.length > 1;
  const top = series[series.length - 1];
  const total = (r: Row) => series.reduce((s, x) => s + val(r, x.key), 0);
  const show = (i: number) => wide || !keyLabels || keyLabels.includes(i);

  return (
    <div className="chart" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data as Row[]} margin={{ top: 22, right: 4, left: 4, bottom: 0 }} barCategoryGap={wide ? "22%" : "14%"}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            tick={{ fill: "var(--muted)", fontSize: wide ? 12 : 10 }}
            tickFormatter={(v: string, i: number) => (data[i]?.partial ? `${v}*` : v)}
            interval={0}
          />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip
            cursor={{ fill: "var(--bg)" }}
            content={<TipBox series={series} total={stacked} />}
            isAnimationActive={false}
          />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} stackId={stacked ? "a" : undefined} isAnimationActive={false}
              radius={s === top ? [3, 3, 0, 0] : 0}>
              {data.map((r, i) => (
                <Cell key={i} fill={fill(s.colour, r.partial)} stroke={r.partial ? cssVar(s.colour) : undefined} strokeWidth={r.partial ? 1 : 0} />
              ))}
              {s === top && (
                <LabelList
                  position="top"
                  offset={6}
                  style={{ fill: "var(--ink)", fontSize: wide ? 11 : 10, fontWeight: 600 }}
                  valueAccessor={(entry, i) => (show(i) ? fmtInt(total(entry.payload as Row)) : "")}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Legend for stacked charts, with a hatched swatch explaining the partial month. */
export function Legend({ series, partialNote = true }: { series: Series[]; partialNote?: boolean }) {
  return (
    <ul className="legend" style={{ marginTop: 6 }}>
      {series.length > 1 &&
        series.map((s) => (
          <li key={s.key}>
            <i style={{ background: cssVar(s.colour) }} />
            {s.label}
          </li>
        ))}
      {partialNote && (
        <li className="muted">
          <i className="hatch" />
          Nov* = 1 to 15 Nov only
        </li>
      )}
    </ul>
  );
}
