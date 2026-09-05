import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ErrorBar, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEASONS, calculateMonthlyRainfall } from "../lib/monthlyRainfall.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { topLegendProps, xAxisLabel, yAxisLabel } from "./chartLabels.jsx";

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
    () =>
      result.monthly.map((row) => ({
        ...row,
        label: t("months")[row.month - 1],
        // A deviation wider than the mean sent the lower whisker to -30 mm and
        // dragged the whole axis to -100. A month cannot rain a negative depth,
        // so the downward arm stops at zero and the note below says it does.
        spread:
          row.mean == null || row.stdDev == null
            ? null
            : [Math.min(row.stdDev, row.mean), row.stdDev],
      })),
    [result.monthly, t],
  );
  if (!result.monthly.some((row) => row.mean != null)) return null;

  const wettest = result.wettestMonth;
  const scale = axisScale(
    data.flatMap((row) => (row.mean == null ? [] : [row.mean, row.mean + (row.stdDev ?? 0)])),
    { unit: "mm", includeZero: true }
  );

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
            label={xAxisLabel(t("month"), -14)}
          />
          <YAxis
            width={66}
            tick={{ fontSize: 12 }}
            domain={scale.domain}
            ticks={scale.ticks}
            tickFormatter={(value) => formatForAxis(value, scale.decimals)}
            allowDataOverflow
            label={yAxisLabel(t("monthlyRainfallAxis"))}
          />
          <Tooltip content={<MonthTooltip t={t} />} />
          <Legend
            {...topLegendProps}
            payload={[
              ...Object.entries(SEASONS).map(([id, season]) => ({ value: t(id), type: "square", color: season.color, id })),
              { value: t("standardDeviation"), type: "plainline", color: "#4b5563", payload: { strokeWidth: 1.4 }, id: "sd" },
            ]}
          />
          <Bar dataKey="mean" radius={[4, 4, 0, 0]}>
            {data.map((row) => (
              <Cell key={row.month} fill={SEASONS[row.season].color} />
            ))}
            <LabelList
              dataKey="mean"
              content={({ x, y, width, index }) => data[index]?.month === wettest?.month ? (
                <text
                  x={x + width / 2}
                  y={y + 18}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="11"
                  fontWeight="700"
                >
                  Peak: {formatMm(data[index].mean)} mm
                </text>
              ) : null}
            />
            <ErrorBar dataKey="spread" width={5} strokeWidth={1.4} stroke="#4b5563" direction="y" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("monthlyRainfallExplanation")}</p>
      <p className="indicator-assumption">{t("monthlyRainfallAssumption")}</p>
      <p className="indicator-assumption">{t("rainfallWhiskerNote")}</p>
    </section>
  );
}
