import ChartFrame from "./ChartFrame.jsx";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { calculateWindDiurnalCycle } from "../lib/windDiurnalCycle.js";
import { yAxisLabel } from "./chartLabels.jsx";

const BLUE = "#2b7fc4";

const formatSpeed = (t, value) => t.number(Number(value), { maximumFractionDigits: 2 });
const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

function DiurnalTooltip({ t, active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (row.mean == null) return null;
  return (
    <div className="indicator-tooltip">
      <strong>{formatHour(row.hour)}</strong>
      <span>{t("meanWindSpeed")}: {formatSpeed(t, row.mean)} m/s</span>
      <span>{t("totalRecords")}: {t.number(row.count, { maximumFractionDigits: 3 })}</span>
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
      <ChartFrame t={t} rows={result.hourly} columns={[{"key":"hour","label":"Hour"},{"key":"mean","label":"Mean speed (m/s)"}]} indicator="wind-diurnal-cycle-1" width="100%" height={330}>
        <LineChart data={result.hourly} margin={{ top: 30, right: 26, left: 44, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            interval={1}
            padding={{ left: 20, right: 20 }}
            tick={{ fontSize: 11 }}
            label={{ value: t("hourOfDay"), position: "insideBottom", offset: -14, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={64}
            tick={{ fontSize: 12 }}
            tickFormatter={formatSpeed.bind(null, t)}
            label={yAxisLabel(t("meanSpeedAxis"))}
          />
          <Tooltip content={<DiurnalTooltip t={t} />} />
          {overallMean != null && (
            <ReferenceLine
              y={overallMean}
              stroke="#64748b"
              strokeDasharray="6 4"
              label={{ value: `${t("mean")}: ${formatSpeed(t, overallMean)} m/s`, position: "insideTopRight", fill: "#475569", fontSize: 11, fontWeight: 600 }}
            />
          )}
          {peakHour && (
            <ReferenceLine
              x={peakHour.hour}
              stroke={BLUE}
              strokeDasharray="4 4"
              label={{ value: `${t("peak")}: ${formatHour(peakHour.hour)} · ${formatSpeed(t, peakHour.mean)} m/s`, position: "top", fill: BLUE, fontSize: 11, fontWeight: 700 }}
            />
          )}
          <Line type="monotone" dataKey="mean" stroke={BLUE} strokeWidth={2.6} dot={{ r: 3, fill: BLUE }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ChartFrame>
      <p className="indicator-explanation">{t("windDiurnalExplanation")}</p>
      <p className="indicator-assumption">
        {t("windDiurnalAssumption")} {peakHour && troughHour
          ? `${t("peak")}: ${formatHour(peakHour.hour)} (${formatSpeed(t, peakHour.mean)} m/s) · ${t("min")}: ${formatHour(troughHour.hour)} (${formatSpeed(t, troughHour.mean)} m/s).`
          : ""} {t.number(result.count, { maximumFractionDigits: 3 })} {t("records").toLowerCase()}.
      </p>
    </section>
  );
}
