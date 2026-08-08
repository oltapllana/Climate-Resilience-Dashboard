import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateDrySpells } from "../lib/drySpells.js";

const AMBER = "#f5a742";
const RED = "#c63a2b";
const MONTHS = [
  ["Apr", 0], ["May", 30], ["Jun", 61], ["Jul", 91], ["Aug", 122], ["Sep", 153],
];
const SEASON_DAYS = 183;

function seasonOffset(date) {
  const year = Number(date.slice(0, 4));
  return Math.round((Date.UTC(year, Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) - Date.UTC(year, 3, 1)) / 86400000);
}

function RunTooltip({ run, x, y }) {
  if (!run) return null;
  return (
    <div className="indicator-tooltip" style={{ position: "absolute", left: x + 10, top: y + 10, pointerEvents: "none", zIndex: 2 }}>
      <strong>{run.year}</strong>
      <span>Start: {run.startDate}</span>
      <span>End: {run.endDate}</span>
      <span>Length: {run.length} days</span>
      <span>{run.classification}</span>
    </div>
  );
}

function SeasonalRunsChart({ yearly }) {
  const [tooltip, setTooltip] = useState(null);
  const height = 76 + yearly.length * 42;
  const left = 96;
  const width = 500;
  const scale = width / SEASON_DAYS;
  return (
    <div style={{ position: "relative", width: "100%" }} onMouseLeave={() => setTooltip(null)}>
      <svg viewBox={`0 0 620 ${height}`} role="img" aria-label="Dry-spell runs from April through September" style={{ display: "block", width: "100%", height: 360 }}>
        {MONTHS.map(([month, offset]) => {
          const x = left + offset * scale;
          return (
            <g key={month}>
              <line x1={x} x2={x} y1="28" y2={height - 28} stroke="#dce5ea" />
              <text x={x + 3} y={height - 8} fill="#5f7079" fontSize="11">{month}</text>
            </g>
          );
        })}
        {yearly.map((row, rowIndex) => {
          const y = 40 + rowIndex * 42;
          return (
            <g key={row.year}>
              <text x={left - 10} y={y + 5} textAnchor="end" fill="#42545d" fontSize="12" fontWeight={row.isPartial ? 700 : 400}>
                {row.year}{row.isPartial ? "*" : ""}
              </text>
              <line x1={left} x2={left + width} y1={y} y2={y} stroke="#dce5ea" strokeWidth="8" strokeLinecap="round" />
              {row.runs.filter((run) => run.length >= 5).map((run) => {
                const x = left + seasonOffset(run.startDate) * scale;
                const segmentWidth = Math.max(3, run.length * scale);
                const enriched = { ...run, year: row.year };
                return (
                  <rect
                    key={`${run.startDate}-${run.endDate}`}
                    x={x}
                    y={y - 7}
                    width={segmentWidth}
                    height="14"
                    rx="3"
                    fill={run.length >= 7 ? RED : AMBER}
                    onMouseMove={(event) => setTooltip({ run: enriched, x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })}
                  />
                );
              })}
              {row.year === 2021 && <text x={left} y={y - 12} fill="#5f7079" fontSize="10">starts 6 Apr</text>}
              {row.year === 2026 && <text x={left + width} y={y - 12} textAnchor="end" fill="#5f7079" fontSize="10" fontWeight="700">partial</text>}
            </g>
          );
        })}
      </svg>
      <RunTooltip {...tooltip} />
    </div>
  );
}

function BarLabel({ x, y, width, value }) {
  return <text x={x + width / 2} y={y - 7} textAnchor="middle" fill="#17242b" fontSize="11" fontWeight="700">{value}</text>;
}

function AnnualTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const row = item.payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}{row.isPartial ? " (partial)" : ""}</strong>
      <span>Threshold: {item.dataKey === "daysAtLeast5" ? "≥5-day runs" : "≥7-day runs"}</span>
      <span>Qualifying days: {item.value}</span>
      <span>Available season: {row.availableSeasonalDays} days</span>
      <span>{row.isPartial ? "Partial record" : "Full Apr–Sep record"}</span>
    </div>
  );
}

export default function DrySpellsIndicator({ measurement }) {
  const result = useMemo(() => calculateDrySpells(measurement?.hourly), [measurement]);
  if (!result.yearly.length) return null;

  return (
    <section className="card landslide-indicator">
      <div className="indicator-grid">
        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>Dry spells (5-day / 7-day)</h2>
            <p>Qualifying consecutive dry-day runs during April–September.</p>
          </div>
          <SeasonalRunsChart yearly={result.yearly} />
        </div>

        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>Annual dry-spell day count</h2>
            <p>Days in ≥7-day runs are also included in the ≥5-day total.</p>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={result.yearly} margin={{ top: 34, right: 18, left: 14, bottom: 28 }}>
              <CartesianGrid stroke="#dce5ea" vertical={false} />
              <XAxis dataKey="year" tickFormatter={(year) => `${year}${result.yearly.find((row) => row.year === year)?.isPartial ? "*" : ""}`} />
              <YAxis allowDecimals={false} label={{ value: "Qualifying dry days", angle: -90, position: "insideLeft" }} />
              <Tooltip content={<AnnualTooltip />} />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ transform: "translateY(-16px)" }} />
              <Bar dataKey="daysAtLeast5" name="Days in ≥5-day runs" fill={AMBER} radius={[3, 3, 0, 0]}>
                <LabelList content={<BarLabel />} />
              </Bar>
              <Bar dataKey="daysAtLeast7" name="Days in ≥7-day runs (included in ≥5)" fill={RED} radius={[3, 3, 0, 0]}>
                <LabelList content={<BarLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="indicator-explanation">A day is classified as dry when its daily precipitation total is below 1 mm. Annual values count all days belonging to consecutive dry runs of at least 5 or 7 days during April–September.</p>
      <p className="indicator-assumption">The calculation uses the per-day &lt;1 mm interpretation, and the ≥7-day total is included within the ≥5-day total. Missing rainfall hours are reconstructed as zero under the existing project assumption. 2021 begins on 6 April. 2026 has only partial April coverage and is not comparable with complete years.</p>
    </section>
  );
}
