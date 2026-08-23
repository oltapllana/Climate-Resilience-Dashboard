import { useMemo } from "react";
import { CartesianGrid, ComposedChart, Label, Legend, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateDilutionEvent } from "../lib/dilutionEvent.js";
import { dayTicks } from "../lib/seriesUtils.js";

const QUALITY = "#c1452c";
const LEVEL = "#3d7f9c";

// Chart A of the salinity / TDS / conductivity specs. Two independent sensors,
// one physical mechanism: the flood wave arrives and the dissolved load is
// diluted. It reads as an explainer of why these values spike in drought, and
// doubles as a cross-check — if the dip is missing, one instrument is wrong.
export default function DilutionEventChart({
  measurement, levelMeasurement, unit, levelUnit, title, description, axisLabel, levelAxisLabel,
  seriesLabel, levelLabel, digits = 2, windowDays = 4, explanation, assumption, t,
}) {
  const result = useMemo(
    () => calculateDilutionEvent(
      measurement?.hourly?.length ? measurement.hourly : measurement?.daily,
      levelMeasurement?.hourly?.length ? levelMeasurement.hourly : levelMeasurement?.daily,
      { windowDays },
    ),
    [measurement, levelMeasurement, windowDays],
  );
  if (result.series.length < 2) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const formatTime = (time) => new Date(time).toLocaleDateString(undefined, { day: "2-digit", month: "short" });

  function DilutionTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.key.replace("T", " ")}</strong>
        {row.value != null && <span>{seriesLabel}: {format(row.value)} {unit}</span>}
        {row.level != null && <span>{levelLabel}: {Number(row.level).toFixed(2)} {levelUnit}</span>}
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
        {t("floodPeak")}: <strong>{Number(result.peak.value).toFixed(2)} {levelUnit}</strong> ({result.peak.key.replace("T", " ")})
        {" · "}
        {t("dilutionMinimum")}: <strong>{format(result.minimum.value)} {unit}</strong> ({result.minimum.key.replace("T", " ")})
      </p>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={result.series} margin={{ top: 26, right: 60, left: 52, bottom: 30 }}>
          <CartesianGrid stroke="#eef2f6" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[result.windowStart, result.windowEnd]}
            ticks={dayTicks(result.windowStart, result.windowEnd)}
            tickFormatter={formatTime}
            minTickGap={30}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            yAxisId="quality"
            width={72}
            domain={["auto", "auto"]}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })}
            label={{ value: axisLabel, angle: -90, position: "insideLeft", offset: -10 }}
          />
          <YAxis
            yAxisId="level"
            orientation="right"
            width={58}
            domain={["auto", "auto"]}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => Number(value).toFixed(1)}
            label={{ value: levelAxisLabel, angle: 90, position: "insideRight", offset: -6 }}
          />
          <Tooltip content={<DilutionTooltip />} />
          <Legend verticalAlign="top" align="left" height={26} />
          <Line yAxisId="level" dataKey="level" name={levelLabel} stroke={LEVEL} strokeWidth={1.8} strokeDasharray="7 5" dot={false} connectNulls isAnimationActive={false} />
          <Line yAxisId="quality" dataKey="value" name={seriesLabel} stroke={QUALITY} strokeWidth={2.4} dot={false} connectNulls isAnimationActive={false} />
          {/* the flood peak on the level axis, so the two lines are visibly
              keyed to the same moment */}
          <ReferenceDot yAxisId="level" x={result.peak.time} y={result.peak.value} r={4.5} fill={LEVEL} stroke="#fff" strokeWidth={1.4} isFront />
          <ReferenceDot yAxisId="quality" x={result.minimum.time} y={result.minimum.value} r={4.5} fill={QUALITY} stroke="#fff" strokeWidth={1.4} isFront>
            <Label value={`${t("dilutionMinimum")}: ${format(result.minimum.value)} ${unit}`} position="bottom" offset={12} fill={QUALITY} fontSize={11} fontWeight={700} />
          </ReferenceDot>
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">{t("eventWindowNote").replace("{days}", windowDays)}</p>
    </section>
  );
}
