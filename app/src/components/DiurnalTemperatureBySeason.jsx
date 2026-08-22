import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateDiurnalTemperature } from "../lib/diurnalTemperature.js";

// Temperatura 3 (proposal) — the daily cycle per season instead of one annual
// curve, each with a ±1 standard-deviation band so between-day variability is
// visible rather than hidden behind a mean.
const ANNUAL = "#5b6b78";

const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

export default function DiurnalTemperatureBySeason({ measurement, t }) {
  const result = useMemo(() => calculateDiurnalTemperature(measurement?.hourly), [measurement]);

  const data = useMemo(() => {
    if (!result.seasons.length) return [];
    return Array.from({ length: 24 }, (_, hour) => {
      const row = { hour, annual: result.annual.hours[hour]?.mean ?? null };
      for (const season of result.seasons) {
        const cell = season.hours[hour];
        row[season.season] = cell.mean;
        row[`${season.season}_low`] = cell.low;
        row[`${season.season}_band`] = cell.low == null ? null : +(cell.high - cell.low).toFixed(2);
        row[`${season.season}_spread`] = cell.spread;
      }
      return row;
    });
  }, [result]);

  if (!data.length) return null;

  function ProfileTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{formatHour(row.hour)}</strong>
        {result.seasons.map((season) => (
          <span key={season.season}>
            {t(season.season)}: {row[season.season] == null ? "—" : `${format(row[season.season])} °C ± ${format(row[`${season.season}_spread`])}`}
          </span>
        ))}
        <span>{t("annualMean")}: {row.annual == null ? "—" : `${format(row.annual)} °C`}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("diurnalTempTitle")}</h2>
        <p>{t("diurnalTempDesc")}</p>
      </div>
      <p className="indicator-callout">
        {t("diurnalAmplitude")}: {result.seasons
          .filter((season) => season.amplitude != null)
          .map((season) => `${t(season.season)} ${format(season.amplitude)} °C`)
          .join(" · ")}
      </p>
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 20, right: 26, left: 46, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            interval={1}
            tick={{ fontSize: 11 }}
            label={{ value: t("hourOfDay"), position: "insideBottom", offset: -14, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={68}
            tick={{ fontSize: 12 }}
            tickFormatter={format}
            label={{ value: t("temperatureAxis"), angle: -90, position: "insideLeft", offset: -12 }}
          />
          <Tooltip content={<ProfileTooltip />} />
          <Legend
            verticalAlign="top"
            height={26}
            payload={[
              ...result.seasons.map((season) => ({ value: t(season.season), type: "line", color: season.color })),
              { value: t("annualMean"), type: "line", color: ANNUAL },
            ]}
          />
          <ReferenceLine y={0} stroke="#5b6b78" strokeDasharray="5 4" label={{ value: "0 °C", position: "insideLeft", fill: "#5b6b78", fontSize: 11, fontWeight: 700 }} />
          {result.seasons.map((season) => [
            <Area key={`${season.season}-base`} dataKey={`${season.season}_low`} stackId={season.season} stroke="none" fill="transparent" isAnimationActive={false} />,
            <Area key={`${season.season}-band`} dataKey={`${season.season}_band`} stackId={season.season} stroke="none" fill={season.color} fillOpacity={0.15} isAnimationActive={false} />,
          ])}
          <Line type="monotone" dataKey="annual" stroke={ANNUAL} strokeWidth={1.8} strokeDasharray="6 4" dot={false} connectNulls isAnimationActive={false} />
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
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("diurnalTempExplanation")}</p>
      <p className="indicator-assumption">
        {t("diurnalTempAssumption").replace("{years}", result.years.join(", ")).replace("{n}", result.count.toLocaleString())}
      </p>
    </section>
  );
}
