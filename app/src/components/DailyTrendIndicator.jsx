import { useMemo } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateDailyTrend } from "../lib/dailyTrend.js";

// Shared by Rrezatimi 1 (solar radiation) and Shtypja 1 (air pressure): daily
// values with a 30-day rolling mean over them, plus the long-term average.
export default function DailyTrendIndicator({ measurement, unit, title, description, axisLabel, explanation, assumption, dailyColor, trendColor, digits = 1, t }) {
  const result = useMemo(() => calculateDailyTrend(measurement?.daily), [measurement]);
  if (!result.daily.length) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
  const { longTermMean, maximum, minimum } = result;

  function TrendTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.date}</strong>
        <span>{t("daily")}: {format(row.value)} {unit}</span>
        {row.rolling != null && <span>{t("rollingMean30")}: {format(row.rolling)} {unit}</span>}
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={result.daily} margin={{ top: 26, right: 26, left: 48, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" />
          <XAxis dataKey="date" minTickGap={54} tick={{ fontSize: 10 }} />
          <YAxis width={68} tick={{ fontSize: 12 }} tickFormatter={format} domain={["auto", "auto"]} label={{ value: axisLabel, angle: -90, position: "insideLeft", offset: -14 }} />
          <Tooltip content={<TrendTooltip />} />
          {longTermMean != null && (
            <ReferenceLine
              y={longTermMean}
              stroke="#e0a52b"
              strokeDasharray="6 4"
              label={{ value: `${t("longTermMean")}: ${format(longTermMean)} ${unit}`, position: "insideBottomRight", fill: "#8a6410", fontSize: 11, fontWeight: 600 }}
            />
          )}
          <Line type="monotone" dataKey="value" stroke={dailyColor} strokeWidth={0.9} strokeOpacity={0.45} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="rolling" stroke={trendColor} strokeWidth={2.6} dot={false} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.daily[0].date} – {result.daily.at(-1).date}. {t("max")}: {format(maximum.value)} {unit} ({maximum.date}). {t("min")}: {format(minimum.value)} {unit} ({minimum.date}).
      </p>
    </section>
  );
}
