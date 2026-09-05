import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Label, Legend, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateMonthlyExtremes } from "../lib/monthlyExtremes.js";
import { DotLabel, anchorForPosition, topLegendProps, xAxisLabel, yAxisLabel } from "./chartLabels.jsx";

// Shtypja 2 — monthly maximum and minimum with the range shaded between them.
const MAX_LINE = "#e0393e";
const MIN_LINE = "#7b2d9f";
const BAND = "#c5cbe8";

export default function MonthlyExtremesRange({ measurement, unit, title, description, axisLabel, explanation, assumption, digits = 1, t }) {
  const result = useMemo(() => calculateMonthlyExtremes(measurement?.daily), [measurement]);
  if (!result.monthly.length) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const data = result.monthly.map((row) => ({ ...row, base: row.min, band: row.range }));
  const { absoluteMax, absoluteMin, widest } = result;

  // Both extremes are marked on the plot, and either can land in the last
  // months of the record — where a centred label runs off the right edge and
  // "Absolute minimum: 906.8 hPa" arrives as "906.8 hP".
  const maxAnchor = anchorForPosition(data.findIndex((row) => row.month === absoluteMax.month), data.length);
  const minAnchor = anchorForPosition(data.findIndex((row) => row.month === absoluteMin.month), data.length);

  const lows = data.map((row) => row.min);
  const highs = data.map((row) => row.max);
  const pad = Math.max(2, (Math.max(...highs) - Math.min(...lows)) * 0.08);
  const domain = [Math.floor(Math.min(...lows) - pad), Math.ceil(Math.max(...highs) + pad)];

  // only January carries a tick, so a five-year axis stays legible
  const tickFormatter = (month) => (month.endsWith("-01") ? `Jan\n${month.slice(0, 4)}` : "");

  function YearTick({ x, y, payload }) {
    const label = tickFormatter(payload.value);
    if (!label) return null;
    const [head, year] = label.split("\n");
    return (
      <g transform={`translate(${x},${y})`}>
        <text y={12} textAnchor="middle" fill="#475569" fontSize="11">{head}</text>
        <text y={25} textAnchor="middle" fill="#475569" fontSize="11">{year}</text>
      </g>
    );
  }

  function RangeTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.month}</strong>
        <span>{t("maxValueLegend")}: {format(row.max)} {unit}{row.maxDate ? ` (${row.maxDate})` : ""}</span>
        <span>{t("minValueLegend")}: {format(row.min)} {unit}{row.minDate ? ` (${row.minDate})` : ""}</span>
        <span>{t("monthlyRangeLegend")}: {format(row.range)} {unit}</span>
        <span>{t("observedDays")}: {row.observedDays}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <p className="indicator-callout">
        {t("absoluteMaximum")}: <strong>{format(absoluteMax.value)} {unit}</strong> ({absoluteMax.date}) · {t("absoluteMinimum")}: <strong>{format(absoluteMin.value)} {unit}</strong> ({absoluteMin.date}) · {t("widestMonth")}: {widest.month} ({format(widest.range)} {unit})
      </p>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={data} margin={{ top: 34, right: 30, left: 52, bottom: 46 }}>
          <CartesianGrid stroke="#eef2f6" />
          <XAxis
            dataKey="month"
            interval={0}
            tickLine={false}
            tick={<YearTick />}
            height={44}
            label={xAxisLabel(t("periodAxis"), -2)}
          />
          <YAxis
            width={70}
            domain={domain}
            allowDataOverflow
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => Number(value).toFixed(0)}
            label={yAxisLabel(axisLabel, 4)}
          />
          <Tooltip content={<RangeTooltip />} />
          <Legend
            {...topLegendProps}
            payload={[
              { value: t("monthlyRangeLegend"), type: "square", color: BAND, id: "band" },
              { value: t("maxValueLegend"), type: "line", color: MAX_LINE, id: "max" },
              { value: t("minValueLegend"), type: "line", color: MIN_LINE, id: "min" },
            ]}
          />
          <Area dataKey="base" stackId="range" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area dataKey="band" stackId="range" stroke="none" fill={BAND} fillOpacity={0.75} isAnimationActive={false} />
          <Line type="linear" dataKey="max" stroke={MAX_LINE} strokeWidth={1.5} dot={{ r: 2.2, fill: MAX_LINE, strokeWidth: 0 }} isAnimationActive={false} />
          <Line type="linear" dataKey="min" stroke={MIN_LINE} strokeWidth={1.5} dot={{ r: 2.2, fill: MIN_LINE, strokeWidth: 0 }} isAnimationActive={false} />
          <ReferenceDot x={absoluteMax.month} y={absoluteMax.value} r={4} fill={MAX_LINE} stroke="#fff" strokeWidth={1.2} isFront>
            <Label
              content={<DotLabel text={`${t("absoluteMaximum")}: ${format(absoluteMax.value)} ${unit}`} anchor={maxAnchor} place="top" fill={MAX_LINE} />}
            />
          </ReferenceDot>
          <ReferenceDot x={absoluteMin.month} y={absoluteMin.value} r={4} fill={MIN_LINE} stroke="#fff" strokeWidth={1.2} isFront>
            {/* the minimum was drawn in the maximum's red */}
            <Label
              content={<DotLabel text={`${t("absoluteMinimum")}: ${format(absoluteMin.value)} ${unit}`} anchor={minAnchor} place="bottom" fill={MIN_LINE} />}
            />
          </ReferenceDot>
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.firstDate} – {result.lastDate} ({result.observedDays.toLocaleString()} {t("observedDays").toLowerCase()}).
      </p>
    </section>
  );
}
