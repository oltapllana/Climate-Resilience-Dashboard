import { useMemo } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateExceedanceDays } from "../lib/exceedanceDays.js";
import { topLegendProps, yAxisLabel } from "./chartLabels.jsx";

const COMPLETE = "#c1452c";
const PARTIAL = "#7b8a95";

// Chart E of the water-quality and water-temperature specs — the most direct
// year-over-year indicator of the set. Counted as a share of monitored days,
// not a raw day count, so a year with a three-month sensor outage does not read
// as a calm year.
export default function ExceedanceDaysChart({
  measurement, unit, title, description, axisLabel, digits = 2, explanation, assumption, t,
}) {
  const result = useMemo(() => calculateExceedanceDays(measurement?.daily), [measurement]);
  if (result.years.length < 2) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const data = result.years.map((row) => ({ ...row, share: +row.share.toFixed(1) }));
  const hasComplete = data.some((row) => !row.partial);
  const hasPartial = data.some((row) => row.partial);

  // The monitored-day count is printed inside its own bar. A year with no
  // exceeding day draws a bar of zero height, and the count then landed on the
  // share label and the axis zero together — it is dropped whenever the bar is
  // too short to hold it, and the tooltip still carries the number.
  function MonitoredDaysLabel({ x, y, width, height, value }) {
    if (height < 15) return null;
    return (
      <text x={x + width / 2} y={y + height - 5} textAnchor="middle" fill="#f8fafc" fontSize="10">
        n={value}
      </text>
    );
  }

  function ExceedanceTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.year}{row.partial ? ` · ${t("partialYear")}` : ""}</strong>
        {row.first && <span>{t("observedWindow")}: {row.first} – {row.last}</span>}
        <span>{t("exceedingDays")}: {row.exceedingDays} / {row.monitoredDays}</span>
        <span>{t("shareOfMonitoredDays")}: {row.share.toFixed(1)} %</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <p className="indicator-callout">
        {t("thresholdUsed")}: <strong>{format(result.threshold)} {unit}</strong> ({t("recordPercentilePlaceholder").replace("{p}", 90)})
      </p>
      {/* Every bar grey and no red one anywhere reads as a broken chart. It is
          not: this record simply holds no year the sensor covered end to end,
          and that is worth stating outright rather than leaving the reader to
          infer it from a legend entry that never appears. */}
      {!hasComplete && (
        <p className="indicator-callout indicator-callout--warn">{t("noCompleteYearNote")}</p>
      )}
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 30, right: 30, left: 48, bottom: 34 }}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            width={66}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${value} %`}
            label={yAxisLabel(axisLabel)}
          />
          <Tooltip content={<ExceedanceTooltip />} cursor={{ fill: "#f1f5f9" }} />
          <Legend
            {...topLegendProps}
            // Only the classes actually on the plot. Advertising "full year"
            // where none exists sends the reader looking for a bar that is not
            // there.
            payload={[
              ...(hasComplete ? [{ value: t("fullYearLegend"), type: "square", color: COMPLETE, id: "complete" }] : []),
              ...(hasPartial ? [{ value: t("partialYear"), type: "square", color: PARTIAL, id: "partial" }] : []),
            ]}
          />
          {/* A year in which nothing crossed the threshold used to draw no bar
              at all, which reads as a year with no data rather than a calm one.
              A stub under the printed "0 %" keeps the year present. */}
          <Bar dataKey="share" barSize={46} minPointSize={(value) => (value ? 0 : 3)} isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={row.year} fill={row.partial ? PARTIAL : COMPLETE} />
            ))}
            <LabelList dataKey="share" position="top" formatter={(value) => `${value} %`} fontSize={12} fontWeight={700} fill="#334155" />
            <LabelList dataKey="monitoredDays" content={<MonitoredDaysLabel />} />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.start} – {result.end}. {t("partialYearsNote")}
      </p>
    </section>
  );
}
