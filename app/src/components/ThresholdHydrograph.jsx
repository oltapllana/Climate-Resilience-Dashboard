import { useMemo } from "react";
import { CartesianGrid, ComposedChart, Label, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateThresholdHydrograph } from "../lib/thresholdHydrograph.js";
import { dayTicks } from "../lib/seriesUtils.js";

// Water-level 1 and water-temperature Chart A — the record's most extreme event
// replayed over shaded threshold bands. The bands are what make a single number
// readable: 1.84 m means nothing on its own, "into the danger band" does.
export default function ThresholdHydrograph({
  measurement, unit, title, description, axisLabel, bands, mode = "fixed", stops = [],
  windowDays = 5, digits = 2, explanation, assumption, t,
}) {
  const result = useMemo(
    () => calculateThresholdHydrograph(measurement?.hourly?.length ? measurement.hourly : measurement?.daily, { windowDays, mode, stops }),
    [measurement, windowDays, mode, stops],
  );
  if (result.series.length < 2 || result.boundaries.length < 1) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const values = result.series.map((row) => row.value);
  const lowest = Math.min(...values, result.boundaries[0]);
  const highest = Math.max(...values, result.boundaries.at(-1));
  const pad = Math.max((highest - lowest) * 0.12, 0.05);
  const domain = [lowest - pad, highest + pad];
  // the bands run from the axis floor, through each boundary, to the ceiling.
  // A flat record collapses duplicate boundaries, so drop the band labels that
  // no longer have an edge to sit on rather than drawing them at undefined.
  const edges = [domain[0], ...result.boundaries, domain[1]];
  const drawnBands = bands.slice(0, result.boundaries.length + 1);

  const formatTime = (time) =>
    new Date(time).toLocaleDateString(undefined, { day: "2-digit", month: "short" });

  function EventTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.key.replace("T", " ")}</strong>
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
      <p className="indicator-callout">
        {t("peakShort")}: <strong>{format(result.peak.value)} {unit}</strong> ({result.peak.key.replace("T", " ")})
        {" · "}
        {drawnBands.slice(1).map((band, index) => `${band.label} ≥ ${format(result.boundaries[index])} ${unit}`).join(" · ")}
      </p>
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={result.series} margin={{ top: 26, right: 116, left: 52, bottom: 30 }}>
          <CartesianGrid stroke="#eef2f6" />
          {drawnBands.map((band, index) => (
            <ReferenceArea
              key={band.label}
              y1={edges[index]}
              y2={edges[index + 1]}
              fill={band.color}
              fillOpacity={0.16}
              stroke="none"
              ifOverflow="hidden"
            >
              <Label value={band.label} position="right" fill={band.color} fontSize={11} fontWeight={700} offset={12} />
            </ReferenceArea>
          ))}
          {result.boundaries.map((boundary, index) => (
            <ReferenceLine key={boundary} y={boundary} stroke={drawnBands[index + 1]?.color ?? "#94a3b8"} strokeDasharray="6 4" strokeWidth={1.1} />
          ))}
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[result.windowStart, result.windowEnd]}
            ticks={dayTicks(result.windowStart, result.windowEnd)}
            tickFormatter={formatTime}
            minTickGap={28}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            width={72}
            domain={domain}
            allowDataOverflow
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => Number(value).toFixed(digits === 0 ? 0 : 1)}
            label={{ value: axisLabel, angle: -90, position: "insideLeft", offset: -10 }}
          />
          <Tooltip content={<EventTooltip />} />
          <Line type="monotone" dataKey="value" stroke="#c1452c" strokeWidth={2.4} dot={false} isAnimationActive={false} />
          <ReferenceDot x={result.peak.time} y={result.peak.value} r={4.5} fill="#a5321d" stroke="#fff" strokeWidth={1.4} isFront>
            <Label
              value={`${t("peakShort")}: ${format(result.peak.value)} ${unit}`}
              position="top"
              offset={12}
              fill="#a5321d"
              fontSize={11.5}
              fontWeight={700}
            />
          </ReferenceDot>
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.start} – {result.end} ({result.count.toLocaleString()} {t("records").toLowerCase()}).
        {" "}{t("eventWindowNote").replace("{days}", windowDays)}
      </p>
    </section>
  );
}
