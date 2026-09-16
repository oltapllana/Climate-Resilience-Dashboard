import { SERIES_DASHES } from "../lib/chartPalette.js";
import ChartFrame from "./ChartFrame.jsx";
import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts";
import { OPTIMAL_WINDOW, SOLAR_HOUR_REFERENCE_W_M2, calculateSolarDiurnalProfile } from "../lib/solarDiurnalProfile.js";
import { yAxisLabel } from "./chartLabels.jsx";

const formatHours = (t, value) => t.number(Number(value), { maximumFractionDigits: 2 });
const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

export default function SolarDiurnalProfile({ measurement, t }) {
  const result = useMemo(() => calculateSolarDiurnalProfile(measurement?.hourly), [measurement]);

  const chartData = useMemo(() => {
    if (!result.seasons.length) return [];
    return Array.from({ length: 24 }, (_, hour) => {
      const row = { hour };
      for (const season of result.seasons) {
        row[season.season] = season.hours[hour].hoursEquivalent;
        row[`${season.season}_w`] = season.hours[hour].meanWattsPerSquareMetre;
      }
      return row;
    });
  }, [result.seasons]);

  if (!chartData.length) return null;

  function ProfileTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{formatHour(row.hour)}</strong>
        {result.seasons.map((season, index) => (
          <span key={season.season}>
            {t(season.season)}: {row[season.season] == null ? "—" : `${formatHours(t, row[season.season])} h`}
            {row[`${season.season}_w`] == null ? "" : ` (${Math.round(row[`${season.season}_w`])} W/m²)`}
          </span>
        ))}
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("solarProfileTitle")}</h2>
        <p>{t("solarProfileDesc")}</p>
      </div>
      <p className="indicator-callout">{t("solarHourConversion").replace("{ref}", t.number(SOLAR_HOUR_REFERENCE_W_M2, { maximumFractionDigits: 3 }))}</p>
      <ChartFrame t={t} rows={chartData} columns={[{key:"hour",label:"Hour"},...result.seasons.flatMap(s=>[{key:s.season,label:`${s.season} equivalent hours`},{key:`${s.season}_w`,label:`${s.season} mean (W/m²)`}])]} indicator="solar-diurnal-profile-1" width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 26, right: 26, left: 48, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <ReferenceArea
            x1={OPTIMAL_WINDOW.start}
            x2={OPTIMAL_WINDOW.end}
            fill="#f0a92b"
            fillOpacity={0.12}
            label={{ value: t("solarOptimalWindow"), position: "insideTop", fill: "#8a6410", fontSize: 11, fontWeight: 700 }}
          />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            interval={1}
            padding={{ left: 20, right: 20 }}
            tick={{ fontSize: 11 }}
            label={{ value: t("hourOfDay"), position: "insideBottom", offset: -14, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={70}
            tick={{ fontSize: 12 }}
            tickFormatter={formatHours.bind(null, t)}
            label={yAxisLabel(t("solarHoursAxis"))}
          />
          <Tooltip content={<ProfileTooltip />} />
          <Legend
            verticalAlign="top"
            height={26}
            payload={result.seasons.map((season, index) => ({ value: t(season.season), type: "plainline", payload: { strokeDasharray: SERIES_DASHES[index % SERIES_DASHES.length] }, color: season.color }))}
          />
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
      <p className="indicator-explanation">{t("solarProfileExplanation")}</p>
      <p className="indicator-assumption">
        {t("solarProfileAssumption")} {result.seasons
          .filter((season) => season.peakHour != null)
          .map((season) => `${t(season.season)}: ${formatHour(season.peakHour)} (${formatHours(t, season.peakHoursEquivalent)} h)`)
          .join(" · ")}.
      </p>
    </section>
  );
}
