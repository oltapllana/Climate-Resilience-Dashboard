import { useMemo } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateExceedanceDays } from "../lib/exceedanceDays.js";

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

  function ExceedanceTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.year}{row.partial ? ` · ${t("partialYear")}` : ""}</strong>
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
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 30, right: 30, left: 48, bottom: 34 }}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            width={66}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${value}`}
            label={{ value: axisLabel, angle: -90, position: "insideLeft", offset: -8 }}
          />
          <Tooltip content={<ExceedanceTooltip />} cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="share" barSize={46} isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={row.year} fill={row.partial ? PARTIAL : COMPLETE} />
            ))}
            <LabelList dataKey="share" position="top" formatter={(value) => `${value} %`} fontSize={12} fontWeight={700} fill="#334155" />
            <LabelList dataKey="monitoredDays" position="insideBottom" formatter={(value) => `n=${value}`} fontSize={10} fill="#f8fafc" />
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
