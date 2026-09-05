import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateMonthlyTemperature } from "../lib/monthlyTemperature.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { xAxisLabel, yAxisLabel } from "./chartLabels.jsx";

// Temperatura 2 and 3 — mean monthly maxima and minima.
// The review asked for the colours to carry meaning: blue for the minima,
// red/orange for the maxima. The shaded bands are the between-year spread, so a
// flat average is not read as a stable value.
const MAX = "#d1622c";
const MIN = "#2b7fc4";
const MAX_BAND = "#f2cdb6";
const MIN_BAND = "#c3dcee";

const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });

export default function MonthlyTemperatureExtremes({ measurement, t }) {
  const result = useMemo(() => calculateMonthlyTemperature(measurement?.hourly), [measurement]);

  const data = useMemo(
    () => result.climatology.map((row) => ({
      ...row,
      label: t("months")[row.monthNumber - 1],
      maxLowBase: row.maxLow,
      maxBand: row.maxHigh == null ? null : +(row.maxHigh - row.maxLow).toFixed(2),
      minLowBase: row.minLow,
      minBand: row.minHigh == null ? null : +(row.minHigh - row.minLow).toFixed(2),
    })),
    [result.climatology, t],
  );

  if (!data.some((row) => row.meanMax != null)) return null;

  const scale = axisScale(
    data.flatMap((row) => [row.meanMax, row.meanMin, row.maxLow, row.maxHigh, row.minLow, row.minHigh]).concat([0]),
    { unit: "°C", allowNegative: true }
  );

  const withValues = data.filter((row) => row.meanMax != null);
  const hottest = withValues.reduce((best, row) => (best == null || row.meanMax > best.meanMax ? row : best), null);
  const coldest = withValues.reduce((best, row) => (best == null || row.meanMin < best.meanMin ? row : best), null);

  function MonthTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    if (row.meanMax == null) return null;
    return (
      <div className="indicator-tooltip">
        <strong>{row.label} · {row.yearCount} {row.yearCount === 1 ? t("yearSingular") : t("yearPlural")}</strong>
        <span>{t("meanMaxTemp")}: {format(row.meanMax)} °C ({format(row.maxLow)} – {format(row.maxHigh)})</span>
        <span>{t("meanMinTemp")}: {format(row.meanMin)} °C ({format(row.minLow)} – {format(row.minHigh)})</span>
        <span>{t("absoluteRange")}: {format(row.absoluteMin)} – {format(row.absoluteMax)} °C</span>
        <span>{row.years.join(", ")}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("monthlyExtremesTitle")}</h2>
        <p>{t("monthlyExtremesDesc")}</p>
      </div>
      {hottest && coldest && (
        <p className="indicator-callout">
          {t("warmestMonthMean")}: <strong>{hottest.label}</strong> ({format(hottest.meanMax)} °C) · {t("coldestMonthMean")}: <strong>{coldest.label}</strong> ({format(coldest.meanMin)} °C)
        </p>
      )}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 20, right: 24, left: 46, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
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
              { value: t("meanMaxTemp"), type: "line", color: MAX },
              { value: t("meanMinTemp"), type: "line", color: MIN },
              { value: t("betweenYearRange"), type: "square", color: MAX_BAND },
            ]}
          />
          <ReferenceLine y={0} stroke="#5b6b78" strokeDasharray="5 4" label={{ value: "0 °C", position: "insideLeft", fill: "#5b6b78", fontSize: 11, fontWeight: 700 }} />
          <Area dataKey="maxLowBase" stackId="maxRange" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area dataKey="maxBand" stackId="maxRange" stroke="none" fill={MAX_BAND} fillOpacity={0.75} isAnimationActive={false} />
          <Area dataKey="minLowBase" stackId="minRange" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area dataKey="minBand" stackId="minRange" stroke="none" fill={MIN_BAND} fillOpacity={0.75} isAnimationActive={false} />
          <Line type="monotone" dataKey="meanMax" stroke={MAX} strokeWidth={2.6} dot={{ r: 3, fill: MAX }} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="meanMin" stroke={MIN} strokeWidth={2.6} dot={{ r: 3, fill: MIN }} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("monthlyExtremesExplanation")}</p>
      <p className="indicator-assumption">{t("monthlyExtremesAssumption")}</p>
    </section>
  );
}
