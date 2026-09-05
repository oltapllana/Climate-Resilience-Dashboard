import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateMonthlyTemperature } from "../lib/monthlyTemperature.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { xAxisLabel, yAxisLabel } from "./chartLabels.jsx";

// Temperatura 1 — monthly mean series with the fitted linear trend and the 0 °C
// reference line the review asked for.
const MEAN = "#2b7fc4";
const TREND = "#c63a2b";

const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });

export default function MonthlyTemperatureTrend({ measurement, t }) {
  const result = useMemo(() => calculateMonthlyTemperature(measurement?.hourly), [measurement]);

  const data = useMemo(() => {
    const { slopePerYear, grandMean, meanX } = result.trend;
    return result.monthly.map((row) => {
      const x = row.year + (row.monthNumber - 0.5) / 12;
      return {
        month: row.month,
        mean: row.mean,
        low: row.absoluteMin,
        band: +(row.absoluteMax - row.absoluteMin).toFixed(2),
        absoluteMax: row.absoluteMax,
        absoluteMin: row.absoluteMin,
        observedDays: row.observedDays,
        complete: row.complete,
        trend: slopePerYear == null ? null : +(grandMean + slopePerYear * (x - meanX)).toFixed(2),
      };
    });
  }, [result]);

  if (!data.length) return null;

  const scale = axisScale(
    data.flatMap((row) => [row.mean, row.absoluteMin, row.absoluteMax, row.trend]).concat([0]),
    { unit: "°C", allowNegative: true }
  );

  const { slopePerYear, r2 } = result.trend;
  const warmest = result.warmestMonth;
  const coldest = result.coldestMonth;

  function MonthTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.month}{row.complete ? "" : ` · ${t("partialMonth")}`}</strong>
        <span>{t("mean")}: {format(row.mean)} °C</span>
        <span>{t("max")}: {format(row.absoluteMax)} °C · {t("min")}: {format(row.absoluteMin)} °C</span>
        <span>{t("observedDays")}: {row.observedDays}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("monthlyTempTrendTitle")}</h2>
        <p>{t("monthlyTempTrendDesc")}</p>
      </div>
      <p className="indicator-callout">
        {slopePerYear == null
          ? t("trendUnavailable")
          : <>
              {t("linearTrend")}: <strong>{slopePerYear > 0 ? "+" : ""}{format(slopePerYear)} °C/{t("yearSingular")}</strong>
              {r2 == null ? "" : ` (R² = ${r2})`} · {t("basedOnCompleteMonths").replace("{n}", result.completeMonthCount)}
            </>}
        {warmest && coldest && <> · {t("warmest")}: {warmest.month} ({format(warmest.mean)} °C) · {t("coldest")}: {coldest.month} ({format(coldest.mean)} °C)</>}
      </p>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 20, right: 24, left: 46, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <XAxis dataKey="month" minTickGap={36} tick={{ fontSize: 10 }} />
          {/* Framed on the values actually drawn. The stacked bands used to
              drag the automatic domain down to -11 °C on a record whose real
              minimum is -1.8 °C, leaving a third of the plot empty. Zero stays
              in range because the freezing line is drawn on it. */}
          <YAxis
            width={68}
            tick={{ fontSize: 12 }}
            domain={scale.domain}
            ticks={scale.ticks}
            allowDataOverflow
            tickFormatter={(value) => formatForAxis(value, scale.decimals)}
            label={yAxisLabel(t("temperatureAxis"))}
          />
          <Tooltip content={<MonthTooltip />} />
          <Legend
            verticalAlign="top"
            height={26}
            payload={[
              { value: t("monthlyMeanTemp"), type: "line", color: MEAN },
              { value: t("monthlyRangeBand"), type: "square", color: "#bcd7ea" },
              ...(slopePerYear == null ? [] : [{ value: t("linearTrend"), type: "line", color: TREND }]),
            ]}
          />
          {/* freezing point — lets months below zero be read at a glance */}
          <ReferenceLine
            y={0}
            stroke="#5b6b78"
            strokeDasharray="5 4"
            label={{ value: "0 °C", position: "insideLeft", fill: "#5b6b78", fontSize: 11, fontWeight: 700 }}
          />
          <Area dataKey="low" stackId="range" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area dataKey="band" stackId="range" stroke="none" fill="#bcd7ea" fillOpacity={0.55} isAnimationActive={false} />
          <Line type="monotone" dataKey="mean" stroke={MEAN} strokeWidth={2.4} dot={{ r: 2.5, fill: MEAN }} isAnimationActive={false} />
          <Line type="monotone" dataKey="trend" stroke={TREND} strokeWidth={2.2} strokeDasharray="7 5" dot={false} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("monthlyTempTrendExplanation")}</p>
      <p className="indicator-assumption">{t("monthlyTempTrendAssumption")}</p>
      {/* A fit this weak is worth saying out loud next to the number rather than
          leaving as an R² the reader has to interpret unaided. */}
      {r2 != null && r2 < 0.2 && (
        <p className="indicator-assumption">
          {t("weakTrendCaution").replace("{r2}", r2).replace("{pct}", Math.round(r2 * 100))}
        </p>
      )}
      <p className="indicator-assumption">{t("coverage")}: {result.firstDate} – {result.lastDate}.</p>
    </section>
  );
}
