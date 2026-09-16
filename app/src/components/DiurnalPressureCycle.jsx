import { SERIES_DASHES } from "../lib/chartPalette.js";
import ChartFrame from "./ChartFrame.jsx";
import { useMemo } from "react";
import { CartesianGrid, Label, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { calculateDiurnalAnomalyCycle } from "../lib/diurnalAnomalyCycle.js";
import { topLegendProps, xAxisLabel, yAxisLabel } from "./chartLabels.jsx";

// Shtypja 3 — "Cikli ditor i shtypjes atmosferike sipas stinës".
const format = (t, value) => t.number(Number(value), { maximumFractionDigits: 2 });
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
        {result.seasons.map((season, index) => (
          <span key={season.season}>
            {t(season.season)}: {row[season.season] == null
              ? "—"
              : `${row[season.season] > 0 ? "+" : ""}${format(t, row[season.season])} ${unit} ± ${format(t, row[`${season.season}_spread`])}`}
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
        {t("pressureMorningRise")} ({formatHour(peak.hour)}, +{format(t, peak.deviation)} {unit}) · {t("pressureAfternoonFall")} ({formatHour(trough.hour)}, {format(t, trough.deviation)} {unit}) · {t("dailyAmplitude")}: {format(t, result.annual.amplitude)} {unit}
      </p>
      <ChartFrame t={t} rows={data} columns={[{key:"hour",label:"Hour"},...result.seasons.flatMap(s=>[{key:s.season,label:s.season},{key:`${s.season}_spread`,label:`${s.season} standard deviation`}]),{key:"unit",label:"Unit",value:()=>unit}]} indicator="diurnal-pressure-cycle-1" width="100%" height={380}>
        <LineChart data={data} margin={{ top: 20, right: 26, left: 52, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            interval={1}
            tick={{ fontSize: 11 }}
            padding={{ left: 20, right: 20 }}
            label={xAxisLabel(t("hourOfDay"), -14)}
          />
          {/* The unit lived in this title all along; a negative offset pushed the
              rotated text into the margin, and "(hPa)" was the half that got cut. */}
          <YAxis
            width={76}
            tick={{ fontSize: 12 }}
            tickFormatter={format.bind(null, t)}
            label={yAxisLabel(t("pressureDeviationAxis"), 6)}
          />
          <Tooltip content={<CycleTooltip />} />
          <Legend
            {...topLegendProps}
            payload={result.seasons.map((season, index) => ({ value: t(season.season), type: "plainline", payload: { strokeDasharray: SERIES_DASHES[index % SERIES_DASHES.length] }, color: season.color, id: season.season }))}
          />
          {/* the day's own mean — every curve is a departure from this */}
          <ReferenceLine y={0} stroke="#8a97a1" strokeWidth={1.2}>
            <Label value={t("dailyMeanLine")} position="insideBottomLeft" fill="#5b6b78" fontSize={11} fontWeight={600} />
          </ReferenceLine>
          {result.seasons.map((season, index) => (
            <Line
              key={season.season}
              type="monotone"
              strokeDasharray={SERIES_DASHES[index % SERIES_DASHES.length]} dataKey={season.season}
              stroke={season.color}
              strokeWidth={2.4}
              dot={{ r: 2.5, fill: season.color }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartFrame>
      <p className="indicator-explanation">{t("pressureDiurnalExplanation")}</p>
      <p className="indicator-assumption">
        {t("pressureDiurnalAssumption")
          .replace("{days}", t("dayCount", { count: result.days }))
          .replace("{years}", result.years.join(", "))}
      </p>
      <p className="indicator-assumption">
        {result.seasons
          .filter((season) => season.amplitude != null)
          .map((season) => `${t(season.season)}: ${format(t, season.amplitude)} ${unit}`)
          .join(" · ")}
      </p>
    </section>
  );
}
