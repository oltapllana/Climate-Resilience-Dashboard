import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateSeasonalBand } from "../lib/seasonalBand.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { topLegendProps, yAxisLabel } from "./chartLabels.jsx";

const OUTER = "#fbe6da";
const INNER = "#dd8b5c";
const MEDIAN = "#c1452c";
const CURRENT = "#1e6f8c";

// first day-of-year of each calendar month in a non-leap year
const MONTH_STARTS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

// Chart C of the water-quality and water-temperature specs. Removing the
// seasonal cycle is the whole point: 17 °C in April and 17 °C in August are the
// same number and completely different news, and only the percentile bands make
// that legible to a reader who is not a hydrologist.
export default function SeasonalBandChart({
  measurement, unit, title, description, axisLabel, digits = 2, explanation, assumption, t,
}) {
  const result = useMemo(() => calculateSeasonalBand(measurement?.daily), [measurement]);
  if (result.days.length < 30 || !result.historicalYears.length) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const referenceLabel = result.historicalYears.length === 1
    ? `${result.historicalYears[0]}`
    : `${result.historicalYears[0]}–${result.historicalYears.at(-1)}`;
  const monthTick = (slot) => {
    const index = MONTH_STARTS.indexOf(slot);
    return index === -1 ? "" : t("months")[index];
  };

  function SeasonTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{t("dayOfYear")} {row.slot}</strong>
        {row.p50 != null && <span>{t("historicalMedian")}: {format(row.p50)} {unit}</span>}
        {row.p10 != null && <span>10–90 %: {format(row.p10)} – {format(row.p90)} {unit}</span>}
        {row.current != null && <span>{result.currentYear}: {format(row.current)} {unit}</span>}
      </div>
    );
  }

  const scale = axisScale(
    result.days.flatMap((row) => [row.p10, row.p90, row.p50, row.current]),
    { unit }
  );
  // Percentiles taken over a handful of reference years are not a climatology:
  // one year's sensor outage drags the whole band toward zero for those weeks.
  const fewReferenceYears = result.historicalYears.length <= 5;

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <p className="indicator-callout">
        {t("referencePeriod")}: <strong>{referenceLabel}</strong>
        {result.currentYear != null && <> · {t("currentYearOverlay")}: <strong>{result.currentYear}</strong></>}
      </p>
      <ResponsiveContainer width="100%" height={370}>
        <ComposedChart data={result.days} margin={{ top: 26, right: 30, left: 52, bottom: 30 }}>
          <CartesianGrid stroke="#eef2f6" />
          <XAxis
            dataKey="slot"
            type="number"
            domain={[1, 366]}
            ticks={MONTH_STARTS}
            tickFormatter={monthTick}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            width={72}
            domain={scale.domain}
            ticks={scale.ticks}
            allowDataOverflow
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => formatForAxis(value, scale.decimals)}
            label={yAxisLabel(axisLabel)}
          />
          <Tooltip content={<SeasonTooltip />} />
          <Legend {...topLegendProps} align="left" height={26} />
          <Area dataKey="outerBase" stackId="outer" stroke="none" fill="transparent" legendType="none" isAnimationActive={false} />
          <Area dataKey="outerBand" stackId="outer" name={`10–90 % (${referenceLabel})`} stroke="none" fill={OUTER} fillOpacity={0.9} isAnimationActive={false} />
          <Area dataKey="innerBase" stackId="inner" stroke="none" fill="transparent" legendType="none" isAnimationActive={false} />
          <Area dataKey="innerBand" stackId="inner" name="25–75 %" stroke="none" fill={INNER} fillOpacity={0.75} isAnimationActive={false} />
          <Line dataKey="p50" name={`${t("historicalMedian")} (${referenceLabel})`} stroke={MEDIAN} strokeWidth={1.8} strokeDasharray="6 4" dot={false} connectNulls isAnimationActive={false} />
          {result.currentYear != null && (
            <Line dataKey="current" name={`${result.currentYear}`} stroke={CURRENT} strokeWidth={2.2} dot={false} connectNulls={false} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("seasonalBandBasis").replace("{years}", referenceLabel).replace("{n}", result.historicalYears.length)}
      </p>
      {fewReferenceYears && (
        <p className="indicator-assumption">
          {t("referenceBandNarrowNote").replace("{years}", result.historicalYears.length)}{" "}
          {t("seasonalBandOutageNote")}
        </p>
      )}
    </section>
  );
}
