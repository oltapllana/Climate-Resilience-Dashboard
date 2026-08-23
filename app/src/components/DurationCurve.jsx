import { useMemo } from "react";
import { CartesianGrid, ComposedChart, Label, Legend, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateDurationCurve } from "../lib/durationCurve.js";

const EARLY = "#9dbdd0";
const RECENT = "#1e4f63";
const HIGH_MARK = "#2b7fc4";
const LOW_MARK = "#c1452c";

// Water-level 3 and Chart D of every water-quality dataset. The x axis is the
// share of time a value is equalled or exceeded, so the whole regime is visible
// at once: a recent curve sitting above the earlier one across most of its
// length says more than any single extreme day does.
export default function DurationCurve({
  measurement, unit, title, description, axisLabel, markers = [10, 95], markerLabels,
  logScale = false, digits = 2, shadeLowWater = false, explanation, assumption, t,
}) {
  const result = useMemo(() => calculateDurationCurve(measurement?.daily, { markers }), [measurement, markers]);
  if (!result.grid.length || !result.periods.length) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const [highMarker, lowMarker] = result.markers;
  // a log axis cannot show a zero or negative reading; those series are drawn
  // linearly rather than silently dropping the rows
  const positive = result.grid.every((row) => result.periods.every((period) => row[period.id] == null || row[period.id] > 0));
  const useLog = logScale && positive;

  function CurveTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="indicator-tooltip">
        <strong>{Number(label).toFixed(1)} % {t("ofTimeExceeded")}</strong>
        {result.periods.map((period) => {
          const value = payload.find((item) => item.dataKey === period.id)?.value;
          return value == null ? null : <span key={period.id}>{period.label}: {format(value)} {unit}</span>;
        })}
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
        {markerLabels.high}: <strong>{format(highMarker.value)} {unit}</strong> ({highMarker.percent} %)
        {" · "}
        {markerLabels.low}: <strong>{format(lowMarker.value)} {unit}</strong> ({lowMarker.percent} %)
        {" · "}
        {t("medianValue")}: {format(result.median)} {unit}
      </p>
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={result.grid} margin={{ top: 26, right: 34, left: 56, bottom: 40 }}>
          <CartesianGrid stroke="#eef2f6" />
          {shadeLowWater && (
            <ReferenceArea x1={90} x2={100} fill={LOW_MARK} fillOpacity={0.07} stroke="none" ifOverflow="hidden" />
          )}
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tick={{ fontSize: 11 }}
            label={{ value: t("exceedanceAxis"), position: "insideBottom", offset: -8, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={74}
            scale={useLog ? "log" : "linear"}
            domain={["auto", "auto"]}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })}
            label={{ value: useLog ? `${axisLabel} — ${t("logScale")}` : axisLabel, angle: -90, position: "insideLeft", offset: -12 }}
          />
          <Tooltip content={<CurveTooltip />} />
          <Legend verticalAlign="top" align="right" height={26} />
          <ReferenceLine x={highMarker.percent} stroke={HIGH_MARK} strokeDasharray="2 4" />
          <ReferenceLine x={lowMarker.percent} stroke={LOW_MARK} strokeDasharray="2 4" />
          {result.periods.map((period) => (
            <Line
              key={period.id}
              dataKey={period.id}
              name={period.label}
              stroke={period.id === "early" ? EARLY : RECENT}
              strokeWidth={period.id === "early" ? 2 : 2.6}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
          <ReferenceDot x={highMarker.percent} y={highMarker.value} r={4} fill={HIGH_MARK} stroke="#fff" strokeWidth={1.2} isFront>
            <Label value={`${markerLabels.high}: ${format(highMarker.value)} ${unit}`} position="right" offset={10} fill={HIGH_MARK} fontSize={11} fontWeight={700} />
          </ReferenceDot>
          <ReferenceDot x={lowMarker.percent} y={lowMarker.value} r={4} fill={LOW_MARK} stroke="#fff" strokeWidth={1.2} isFront>
            <Label value={`${markerLabels.low}: ${format(lowMarker.value)} ${unit}`} position="left" offset={10} fill={LOW_MARK} fontSize={11} fontWeight={700} />
          </ReferenceDot>
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.start} – {result.end}. {result.periods.map((period) => `${period.label}: ${period.days.toLocaleString()} ${t("days")}`).join(" · ")}.
        {logScale && !positive ? ` ${t("logScaleUnavailable")}` : ""}
      </p>
    </section>
  );
}
