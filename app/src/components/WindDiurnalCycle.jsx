import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateWindDiurnalCycle } from "../lib/windDiurnalCycle.js";

const BLUE = "#2b7fc4";

const formatSpeed = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

function DiurnalTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (row.mean == null) return null;
  return (
    <div className="indicator-tooltip">
      <strong>{formatHour(row.hour)}</strong>
      <span>Mean speed: {formatSpeed(row.mean)} m/s</span>
      <span>Observations: {row.count.toLocaleString()}</span>
    </div>
  );
}

export default function WindDiurnalCycle({ speedMeasurement, t }) {
  const result = useMemo(() => calculateWindDiurnalCycle(speedMeasurement?.hourly), [speedMeasurement]);
  if (!result.hourly.length) return null;

  const { peakHour, troughHour, overallMean } = result;

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("windDiurnalTitle")}</h2>
        <p>{t("windDiurnalDesc")}</p>
      </div>
      <ResponsiveContainer width="100%" height={330}>
        <LineChart data={result.hourly} margin={{ top: 30, right: 26, left: 44, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            interval={1}
            tick={{ fontSize: 11 }}
            label={{ value: t("hourOfDay"), position: "insideBottom", offset: -14, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={64}
            tick={{ fontSize: 12 }}
            tickFormatter={formatSpeed}
            label={{ value: t("meanSpeedAxis"), angle: -90, position: "insideLeft", offset: -12 }}
          />
          <Tooltip content={<DiurnalTooltip />} />
          {overallMean != null && (
            <ReferenceLine
              y={overallMean}
              stroke="#64748b"
              strokeDasharray="6 4"
              label={{ value: `${t("mean")}: ${formatSpeed(overallMean)} m/s`, position: "insideTopRight", fill: "#475569", fontSize: 11, fontWeight: 600 }}
            />
          )}
          {peakHour && (
            <ReferenceLine
              x={peakHour.hour}
              stroke={BLUE}
              strokeDasharray="4 4"
              label={{ value: `${t("peak")}: ${formatHour(peakHour.hour)} · ${formatSpeed(peakHour.mean)} m/s`, position: "top", fill: BLUE, fontSize: 11, fontWeight: 700 }}
            />
          )}
          <Line type="monotone" dataKey="mean" stroke={BLUE} strokeWidth={2.6} dot={{ r: 3, fill: BLUE }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("windDiurnalExplanation")}</p>
      <p className="indicator-assumption">
        {t("windDiurnalAssumption")} {peakHour && troughHour
          ? `${t("peak")}: ${formatHour(peakHour.hour)} (${formatSpeed(peakHour.mean)} m/s) · ${t("min")}: ${formatHour(troughHour.hour)} (${formatSpeed(troughHour.mean)} m/s).`
          : ""} {result.count.toLocaleString()} {t("records").toLowerCase()}.
      </p>
    </section>
  );
}
