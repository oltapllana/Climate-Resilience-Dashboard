import { useMemo } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateAnnualTrend } from "../lib/annualTrend.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { yAxisLabel } from "./chartLabels.jsx";

const RANGE = "#e6b3a3";
const RANGE_PARTIAL = "#c9d1d6";
const MEAN = "#c1452c";
const TREND = "#1e6f8c";

// Chart B of the water-quality and water-temperature specs — the primary
// warming / salinisation screen. Partial years are drawn in grey and left out
// of the fit rather than deleted: hiding them would make the record look
// longer and cleaner than it is.
//
// The two specs disagree about the bars on purpose: water temperature wants the
// min–max range, because how cold the river got matters as much as how warm,
// while the dissolved-load series want the annual maximum from zero, because
// only the high end is a stress signal there.
export default function AnnualTrendChart({
  measurement, unit, title, description, axisLabel, bars = "range",
  digits = 2, slopeDigits = 3, explanation, assumption, t,
}) {
  const result = useMemo(() => calculateAnnualTrend(measurement?.daily), [measurement]);
  if (result.years.length < 2) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  // recharts draws a bar from the axis baseline, so a min–max bar is carried as
  // a transparent pad up to the minimum plus the range above it
  const data = result.years.map((row) => ({ ...row, base: row.min, band: row.range }));
  const slope = result.trend?.slope ?? null;
  const formatSlope = (value) =>
    `${value > 0 ? "+" : ""}${value.toLocaleString(undefined, { maximumFractionDigits: slopeDigits })} ${unit}/${t("yearsShort")}`;

  function TrendTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.year}{row.partial ? ` · ${t("partialYear")}` : ""}</strong>
        <span>{t("annualMean")}: {format(row.mean)} {unit}</span>
        <span>{t("max")}: {format(row.max)} {unit} · {t("min")}: {format(row.min)} {unit}</span>
        <span>{t("observedDays")}: {row.observedDays}</span>
      </div>
    );
  }

  // Explicit round ticks: with an automatic domain the TDS axis produced two
  // ticks that both printed as "0.4".
  const scale = axisScale(
    data.flatMap((row) => [row.min, row.max, row.mean, row.fit]),
    { unit }
  );

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <p className="indicator-callout">
        {slope == null
          ? t("trendUnavailable")
          : `${t("linearTrend")}: ${formatSlope(slope)}`}
        {" · "}
        {t("completeYearsCount").replace("{n}", result.completeYears)}
      </p>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 26, right: 30, left: 52, bottom: 30 }}>
          <CartesianGrid stroke="#eef2f6" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            width={72}
            domain={scale.domain}
            ticks={scale.ticks}
            allowDataOverflow
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => formatForAxis(value, scale.decimals)}
            label={yAxisLabel(axisLabel)}
          />
          <Tooltip content={<TrendTooltip />} />
          <Legend verticalAlign="top" align="left" height={26} wrapperStyle={{ fontSize: 12, paddingBottom: 6 }} />
          {bars === "range" && (
            <Bar dataKey="base" stackId="range" fill="transparent" legendType="none" isAnimationActive={false} />
          )}
          <Bar
            dataKey={bars === "range" ? "band" : "max"}
            stackId={bars === "range" ? "range" : undefined}
            name={bars === "range" ? t("annualRangeLegend") : t("annualMaximumLegend")}
            barSize={bars === "range" ? 22 : 46}
            isAnimationActive={false}
          >
            {data.map((row) => (
              <Cell key={row.year} fill={row.partial ? RANGE_PARTIAL : RANGE} />
            ))}
          </Bar>
          {/* With no complete year to fit on there is no trend, and a red line
              joining the annual means reads as one anyway. In that case the
              means are drawn as markers and nothing is joined up. */}
          <Line
            dataKey="mean"
            name={t("annualMean")}
            stroke={slope == null ? "none" : MEAN}
            strokeWidth={2.4}
            dot={{ r: 4, fill: MEAN, strokeWidth: 0 }}
            legendType="circle"
            isAnimationActive={false}
          />
          {slope != null && (
            <Line
              dataKey="fit"
              name={`${t("trendCompleteYears")} (${formatSlope(slope)})`}
              stroke={TREND}
              strokeWidth={2}
              strokeDasharray="7 5"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.start} – {result.end}. {t("partialYearsNote")}
        {slope == null ? ` ${t("trendNotFitted")}.` : ""}
      </p>
    </section>
  );
}
