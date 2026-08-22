import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Label, Legend, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateMonthlyExtremes } from "../lib/monthlyExtremes.js";

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
            label={{ value: t("periodAxis"), position: "insideBottom", offset: -2, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={70}
            domain={domain}
            allowDataOverflow
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => Number(value).toFixed(0)}
            label={{ value: axisLabel, angle: -90, position: "insideLeft", offset: -8 }}
          />
          <Tooltip content={<RangeTooltip />} />
          <Legend verticalAlign="bottom" align="left" height={30} wrapperStyle={{ paddingLeft: 60, paddingTop: 6 }}
            payload={[
              { value: t("monthlyRangeLegend"), type: "square", color: BAND },
              { value: t("maxValueLegend"), type: "line", color: MAX_LINE },
              { value: t("minValueLegend"), type: "line", color: MIN_LINE },
            ]}
          />
          <Area dataKey="base" stackId="range" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area dataKey="band" stackId="range" stroke="none" fill={BAND} fillOpacity={0.75} isAnimationActive={false} />
          <Line type="linear" dataKey="max" stroke={MAX_LINE} strokeWidth={1.5} dot={{ r: 2.2, fill: MAX_LINE, strokeWidth: 0 }} isAnimationActive={false} />
          <Line type="linear" dataKey="min" stroke={MIN_LINE} strokeWidth={1.5} dot={{ r: 2.2, fill: MIN_LINE, strokeWidth: 0 }} isAnimationActive={false} />
          <ReferenceDot x={absoluteMax.month} y={absoluteMax.value} r={4} fill={MAX_LINE} stroke="#fff" strokeWidth={1.2} isFront>
            <Label
              value={`${t("absoluteMaximum")}: ${format(absoluteMax.value)} ${unit}`}
              position="top"
              offset={10}
              fill={MAX_LINE}
              fontSize={11}
              fontWeight={700}
            />
          </ReferenceDot>
          <ReferenceDot x={absoluteMin.month} y={absoluteMin.value} r={4} fill={MIN_LINE} stroke="#fff" strokeWidth={1.2} isFront>
            <Label
              value={`${t("absoluteMinimum")}: ${format(absoluteMin.value)} ${unit}`}
              position="bottom"
              offset={10}
              fill={MAX_LINE}
              fontSize={11}
              fontWeight={700}
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
