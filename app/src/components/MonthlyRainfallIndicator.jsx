import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ErrorBar, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEASONS, calculateMonthlyRainfall } from "../lib/monthlyRainfall.js";

const formatMm = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });

function MonthTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (row.mean == null) return null;
  return (
    <div className="indicator-tooltip">
      <strong>{t("months")[row.month - 1]}</strong>
      <span>{t("mean")}: {formatMm(row.mean)} mm</span>
      <span>± {formatMm(row.stdDev)} mm ({t("standardDeviation")})</span>
      <span>{t("completeYearsCounted")}: {row.yearCount}{row.years.length ? ` (${row.years.join(", ")})` : ""}</span>
    </div>
  );
}

export default function MonthlyRainfallIndicator({ measurement, t }) {
  const result = useMemo(() => calculateMonthlyRainfall(measurement?.hourly), [measurement]);
  const data = useMemo(
    () => result.monthly.map((row) => ({ ...row, label: t("months")[row.month - 1] })),
    [result.monthly, t],
  );
  if (!result.monthly.some((row) => row.mean != null)) return null;

  const wettest = result.wettestMonth;

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("monthlyRainfallTitle")}</h2>
        <p>{t("monthlyRainfallDesc")}</p>
      </div>
      {wettest && (
        <p className="indicator-callout">
          {t("highestRainfallMonth")}: <strong>{t("months")[wettest.month - 1]}</strong> ({formatMm(wettest.mean)} mm)
        </p>
      )}
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 46, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            label={{ value: t("month"), position: "insideBottom", offset: -14, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={66}
            tick={{ fontSize: 12 }}
            tickFormatter={formatMm}
            label={{ value: t("monthlyRainfallAxis"), angle: -90, position: "insideLeft", offset: -14 }}
          />
          <Tooltip content={<MonthTooltip t={t} />} />
          <Legend
            verticalAlign="top"
            height={26}
            payload={Object.entries(SEASONS).map(([id, season]) => ({ value: t(id), type: "square", color: season.color }))}
          />
          <Bar dataKey="mean" radius={[4, 4, 0, 0]}>
            {data.map((row) => (
              <Cell key={row.month} fill={SEASONS[row.season].color} />
            ))}
            <ErrorBar dataKey="stdDev" width={5} strokeWidth={1.4} stroke="#4b5563" direction="y" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("monthlyRainfallExplanation")}</p>
      <p className="indicator-assumption">{t("monthlyRainfallAssumption")}</p>
    </section>
  );
}
