import { useMemo } from "react";
import { CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateDailyTrend } from "../lib/dailyTrend.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { EdgeLabel, topLegendProps, yAxisLabel } from "./chartLabels.jsx";

// Shared by Rrezatimi 1 (solar radiation) and Shtypja 1 (air pressure): daily
// values with a 30-day rolling mean over them, plus the long-term average.
export default function DailyTrendIndicator({ measurement, unit, title, description, axisLabel, explanation, assumption, dailyColor, trendColor, digits = 1, t }) {
  const result = useMemo(() => calculateDailyTrend(measurement?.daily), [measurement]);
  if (!result.daily.length) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
  const { longTermMean, maximum, minimum } = result;

  // Framed on the values actually plotted rather than from zero: at this
  // station pressure varies by ~50 hPa around 930, and a zero-based axis
  // spends nine tenths of its height on space nothing is drawn in.
  const scale = axisScale(
    result.daily.flatMap((row) => [row.value, row.rolling]).concat(longTermMean ?? []),
    { unit }
  );

  // Three lines are drawn and none of them was named anywhere on the chart —
  // the reader had to infer blue/red/yellow from the subtitle.
  const legendPayload = [
    { value: t("dailyValueLegend"), type: "line", color: dailyColor, id: "daily" },
    { value: t("rollingMean30"), type: "line", color: trendColor, id: "rolling" },
  ];
  if (longTermMean != null) {
    legendPayload.push({ value: t("longTermMean"), type: "plainline", color: "#e0a52b", payload: { strokeDasharray: "6 4" }, id: "ltm" });
  }

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
          <YAxis
            width={68}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatForAxis(value, scale.decimals)}
            domain={scale.domain}
            ticks={scale.ticks}
            allowDataOverflow
            label={yAxisLabel(axisLabel)}
          />
          <Tooltip content={<TrendTooltip />} />
          <Legend {...topLegendProps} payload={legendPayload} />
          <Line type="monotone" dataKey="value" name={t("dailyValueLegend")} stroke={dailyColor} strokeWidth={0.9} strokeOpacity={0.45} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="rolling" name={t("rollingMean30")} stroke={trendColor} strokeWidth={2.6} dot={false} connectNulls isAnimationActive={false} />
          {/* Declared after the series on purpose. Recharts paints children in
              JSX order — ReferenceLine's own isFront prop is a Recharts 1.x
              leftover that nothing reads any more — so a reference line written
              before the lines ends up under them, and the rolling mean covered
              the middle of this label. */}
          {longTermMean != null && (
            <ReferenceLine
              y={longTermMean}
              stroke="#e0a52b"
              strokeDasharray="6 4"
              label={<EdgeLabel text={`${t("longTermMean")}: ${format(longTermMean)} ${unit}`} fill="#8a6410" topLimit={38} />}
            />
          )}
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
