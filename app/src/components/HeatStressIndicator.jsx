import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HEAT_STRESS_BANDS, HEAT_WAVE_MIN_DAYS, HEAT_WAVE_THRESHOLD_C, calculateHeatStress } from "../lib/heatStress.js";
import { topLegendProps, yAxisLabel } from "./chartLabels.jsx";

// Temperatura 4 — days per year in each thermal-stress class. The review asked
// for the classes to be visually distinguishable, so each gets its own colour
// and the classes are exclusive, making the stack total the year's stress days.
// The low-value counterpart lives in ExtremeDaysIndicator (Temperatura 5).
const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });

// A year with no stress days at all still gets its number printed on the
// baseline. Without it 2026 appeared on the axis with nothing above it, which
// reads as a year the chart failed to draw rather than a year that was calm.
function CountLabel({ x, y, width, value }) {
  if (value == null || x == null || y == null) return null;
  return (
    <text x={x + width / 2} y={y - 7} textAnchor="middle" fill={value ? "#17242b" : "#7c8b96"} fontSize="11" fontWeight="700">
      {format(value)}
    </text>
  );
}

export default function HeatStressIndicator({ measurement, t }) {
  const result = useMemo(() => calculateHeatStress(measurement?.hourly), [measurement]);
  if (!result.yearly.length) return null;

  const yearLabel = (year) => {
    const row = result.yearly.find((item) => item.year === year);
    return row?.isPartial ? `${year}*` : String(year);
  };

  function HeatTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.year}{row.isPartial ? ` (${t("partialYear")})` : ""}</strong>
        {HEAT_STRESS_BANDS.map((band) => <span key={band.id}>{band.label}: {row[band.id]}</span>)}
        <span>{t("heatWaves")}: {row.heatWaveCount} ({row.heatWaveDays} {t("days")})</span>
        <span>{t("warmestDay")}: {row.warmestDay.date} ({row.warmestDay.max} °C)</span>
        <span>{t("observedDays")}: {row.observedDays}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("heatStressTitle")}</h2>
        <p>{t("heatStressDesc")}</p>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={result.yearly} margin={{ top: 30, right: 24, left: 46, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} tickFormatter={yearLabel} />
          <YAxis width={64} allowDecimals={false} tick={{ fontSize: 12 }} label={yAxisLabel(t("daysAxis"))} />
          <Tooltip content={<HeatTooltip />} />
          <Legend
            {...topLegendProps}
            payload={HEAT_STRESS_BANDS.map((band) => ({ value: band.label, type: "square", color: band.color, id: band.id }))}
          />
          {HEAT_STRESS_BANDS.map((band, index) => (
            /* the >46 °C class is one or two days in a hundred: without a floor
               on the segment height it is thinner than the bar's own outline */
            <Bar key={band.id} dataKey={band.id} stackId="heat" fill={band.color} minPointSize={(value) => (value ? 3 : 0)} radius={index === HEAT_STRESS_BANDS.length - 1 ? [4, 4, 0, 0] : undefined}>
              {index === HEAT_STRESS_BANDS.length - 1 && <LabelList dataKey="heatStressTotal" content={<CountLabel />} />}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <p className="indicator-assumption">{t("partialYearExcluded")}</p>

      {result.heatWaves.length > 0 && (
        <p className="indicator-callout">
          {t("heatWaveSummary")
            .replace("{n}", result.heatWaves.length)
            .replace("{days}", HEAT_WAVE_MIN_DAYS)
            .replace("{threshold}", HEAT_WAVE_THRESHOLD_C)}
          {" "}
          {result.heatWaves
            .slice()
            .sort((a, b) => b.length - a.length)
            .slice(0, 3)
            .map((wave) => `${wave.startDate} → ${wave.endDate} (${wave.length} ${t("days")}, ${wave.peak} °C)`)
            .join(" · ")}
        </p>
      )}

      <p className="indicator-explanation">{t("heatStressExplanation")}</p>
      <p className="indicator-assumption">{t("heatStressAssumption")}</p>
      <p className="indicator-assumption">{t("coverage")}: {result.firstDate} – {result.lastDate}.</p>
    </section>
  );
}
