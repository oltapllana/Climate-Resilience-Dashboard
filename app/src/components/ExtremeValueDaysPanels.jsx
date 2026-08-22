import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DEFAULT_EXTREME_DAY_COUNT, calculateExtremeValueDays } from "../lib/extremeValueDays.js";

// Rrezatimi 3 — the brightest and the dullest days, side by side.
const HIGH = "#f5a623";
const LOW = "#4a90e2";

export default function ExtremeValueDaysPanels({
  measurement, unit, count = DEFAULT_EXTREME_DAY_COUNT,
  title, description, axisLabel, highTitle, lowTitle, explanation, assumption, digits = 0, t,
}) {
  const result = useMemo(() => calculateExtremeValueDays(measurement?.daily, { count }), [measurement, count]);
  const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
  const formatDate = (date) =>
    `${date.slice(8, 10)} ${t("months")[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;

  const panels = useMemo(() => [
    { key: "high", rows: result.highest, color: HIGH, heading: highTitle },
    { key: "low", rows: result.lowest, color: LOW, heading: lowTitle },
  ], [result, highTitle, lowTitle]);

  if (!result.highest.length) return null;

  function ValueLabel({ x, y, width, height, value }) {
    return (
      <text x={x + width + 7} y={y + height / 2 + 4} fill="#17242b" fontSize="10" fontWeight="700">
        {format(value)} {unit}
      </text>
    );
  }

  function DayTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.label}</strong>
        <span>{axisLabel}: {format(row.value)} {unit}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="indicator-grid even">
        {panels.map((panel) => {
          const data = panel.rows.map((row) => ({ ...row, label: formatDate(row.date) }));
          const longest = Math.max(...data.map((row) => row.value));
          return (
            <div className="indicator-panel" key={panel.key}>
              <h3 className="panel-title" style={{ color: panel.color }}>{panel.heading}</h3>
              <ResponsiveContainer width="100%" height={Math.max(300, data.length * 24 + 80)}>
                <BarChart data={data} layout="vertical" margin={{ top: 6, right: 86, left: 74, bottom: 34 }}>
                  <CartesianGrid stroke="#eef2f6" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, Math.ceil(longest * 1.02)]}
                    tick={{ fontSize: 10 }}
                    label={{ value: axisLabel, position: "insideBottom", offset: -16, fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={72}
                    interval={0}
                    tickLine={false}
                    tick={{ fontSize: 9.5, fill: "#3f4d57" }}
                  />
                  <Tooltip content={<DayTooltip />} cursor={{ fill: "rgba(15,23,42,0.05)" }} />
                  <Bar dataKey="value" fill={panel.color} barSize={13} radius={[0, 2, 2, 0]} isAnimationActive={false}>
                    <LabelList content={<ValueLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.firstDate} – {result.lastDate} ({result.observedDays.toLocaleString()} {t("observedDays").toLowerCase()}).
      </p>
    </section>
  );
}
