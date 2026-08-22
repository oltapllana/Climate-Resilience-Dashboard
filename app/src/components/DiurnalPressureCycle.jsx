import { useMemo } from "react";
import { CartesianGrid, Label, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateDiurnalAnomalyCycle } from "../lib/diurnalAnomalyCycle.js";

// Shtypja 3 — "Cikli ditor i shtypjes atmosferike sipas stinës".
const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

export default function DiurnalPressureCycle({ measurement, unit, t }) {
  const result = useMemo(() => calculateDiurnalAnomalyCycle(measurement?.hourly), [measurement]);

  const data = useMemo(() => {
    if (!result.seasons.length) return [];
    return Array.from({ length: 24 }, (_, hour) => {
      const row = { hour };
      for (const season of result.seasons) {
        const cell = season.hours[hour];
        row[season.season] = cell.deviation;
        row[`${season.season}_spread`] = cell.spread;
      }
      return row;
    });
  }, [result]);

  if (!data.length || !result.annual.peak) return null;
  const { peak, trough } = result.annual;

  function CycleTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{formatHour(row.hour)}</strong>
        {result.seasons.map((season) => (
          <span key={season.season}>
            {t(season.season)}: {row[season.season] == null
              ? "—"
              : `${row[season.season] > 0 ? "+" : ""}${format(row[season.season])} ${unit} ± ${format(row[`${season.season}_spread`])}`}
          </span>
        ))}
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("pressureDiurnalTitle")}</h2>
        <p>{t("pressureDiurnalDesc")}</p>
      </div>
      <p className="indicator-callout">
        {t("pressureMorningRise")} ({formatHour(peak.hour)}, +{format(peak.deviation)} {unit}) · {t("pressureAfternoonFall")} ({formatHour(trough.hour)}, {format(trough.deviation)} {unit}) · {t("dailyAmplitude")}: {format(result.annual.amplitude)} {unit}
      </p>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 20, right: 26, left: 52, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            interval={1}
            tick={{ fontSize: 11 }}
            label={{ value: t("hourOfDay"), position: "insideBottom", offset: -14, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={76}
            tick={{ fontSize: 12 }}
            tickFormatter={format}
            label={{ value: t("pressureDeviationAxis"), angle: -90, position: "insideLeft", offset: -18 }}
          />
          <Tooltip content={<CycleTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={30}
            wrapperStyle={{ paddingTop: 18 }}
            payload={result.seasons.map((season) => ({ value: t(season.season), type: "line", color: season.color }))}
          />
          {/* the day's own mean — every curve is a departure from this */}
          <ReferenceLine y={0} stroke="#8a97a1" strokeWidth={1.2}>
            <Label value={t("dailyMeanLine")} position="insideBottomLeft" fill="#5b6b78" fontSize={11} fontWeight={600} />
          </ReferenceLine>
          {result.seasons.map((season) => (
            <Line
              key={season.season}
              type="monotone"
              dataKey={season.season}
              stroke={season.color}
              strokeWidth={2.4}
              dot={{ r: 2.5, fill: season.color }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("pressureDiurnalExplanation")}</p>
      <p className="indicator-assumption">
        {t("pressureDiurnalAssumption")
          .replace("{days}", result.days.toLocaleString())
          .replace("{years}", result.years.join(", "))}
      </p>
      <p className="indicator-assumption">
        {result.seasons
          .filter((season) => season.amplitude != null)
          .map((season) => `${t(season.season)}: ${format(season.amplitude)} ${unit}`)
          .join(" · ")}
      </p>
    </section>
  );
}
