import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLD_BANDS, HEAT_STRESS_BANDS, HEAT_WAVE_MIN_DAYS, HEAT_WAVE_THRESHOLD_C, calculateHeatStress } from "../lib/heatStress.js";

// Temperatura 4 and 5. The review's two complaints about the old chart were
// that hot and cold were mixed on one axis and that the two categories were not
// visually distinguishable, so heat and cold get separate panels and each
// stress class its own colour.
const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });

function CountLabel({ x, y, width, value }) {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 7} textAnchor="middle" fill="#17242b" fontSize="11" fontWeight="700">
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

  function ColdTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.year}{row.isPartial ? ` (${t("partialYear")})` : ""}</strong>
        <span>{t("frostDays")}: {row.frostDays}</span>
        <span>{t("iceDays")}: {row.iceDays}</span>
        <span>{t("coldestDay")}: {row.coldestDay.date} ({row.coldestDay.min} °C)</span>
        <span>{t("observedDays")}: {row.observedDays}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-grid">
        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>{t("heatStressTitle")}</h2>
            <p>{t("heatStressDesc")}</p>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={result.yearly} margin={{ top: 30, right: 18, left: 40, bottom: 30 }}>
              <CartesianGrid stroke="#dce5ea" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={yearLabel} />
              <YAxis width={60} allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: t("daysAxis"), angle: -90, position: "insideLeft", offset: -8 }} />
              <Tooltip content={<HeatTooltip />} />
              <Legend
                verticalAlign="top"
                height={26}
                payload={HEAT_STRESS_BANDS.map((band) => ({ value: band.label, type: "square", color: band.color }))}
              />
              {HEAT_STRESS_BANDS.map((band, index) => (
                <Bar key={band.id} dataKey={band.id} stackId="heat" fill={band.color} radius={index === HEAT_STRESS_BANDS.length - 1 ? [4, 4, 0, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <p className="indicator-assumption">* {t("partialYear")}</p>
        </div>

        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>{t("coldDaysTitle")}</h2>
            <p>{t("coldDaysDesc")}</p>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={result.yearly} margin={{ top: 30, right: 18, left: 40, bottom: 30 }}>
              <CartesianGrid stroke="#dce5ea" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={yearLabel} />
              <YAxis width={60} allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: t("daysAxis"), angle: -90, position: "insideLeft", offset: -8 }} />
              <Tooltip content={<ColdTooltip />} />
              <Legend
                verticalAlign="top"
                height={26}
                payload={COLD_BANDS.map((band) => ({ value: band.label, type: "square", color: band.color }))}
              />
              {COLD_BANDS.map((band) => (
                <Bar key={band.id} dataKey={band.id} fill={band.color} radius={[4, 4, 0, 0]}>
                  {result.yearly.map((row) => <Cell key={`${band.id}-${row.year}`} fill={band.color} />)}
                  <LabelList content={<CountLabel />} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
