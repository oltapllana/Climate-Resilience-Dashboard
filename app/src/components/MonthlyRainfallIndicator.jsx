import ChartFrame from "./ChartFrame.jsx";
import Methodology from "./Methodology.jsx";
import { useMemo } from "react";
import { Bar, ComposedChart, CartesianGrid, ErrorBar, Line, Tooltip, XAxis, YAxis } from "recharts";
import { calculateMonthlyRainfall, MIN_QUARTILE_YEARS } from "../lib/monthlyRainfall.js";
import { CHART_PALETTE } from "../lib/chartPalette.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { xAxisLabel } from "./chartLabels.jsx";

const formatMm = (t, value) => t.number(Number(value), { maximumFractionDigits: 1 });

function MonthTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <div className="indicator-tooltip">
    <strong>{t("months")[row.month - 1]}</strong>
    {row.mean == null ? <span>{t("rainfallNoData")}</span> : <>
      <span>{t("mean")}: {formatMm(t, row.mean)} mm</span>
      {row.q1 != null && <span>{t("middleHalf")}: {formatMm(t, row.q1)} – {formatMm(t, row.q3)} mm</span>}
      <span>{t("fullRange")}: {formatMm(t, row.lowest)} – {formatMm(t, row.highest)} mm</span>
      <span>{t("completeYearsCounted")}: {row.yearCount} ({row.years.join(", ")})</span>
    </>}
  </div>;
}

export default function MonthlyRainfallIndicator({ measurement, t }) {
  const result = useMemo(() => calculateMonthlyRainfall(measurement?.hourly), [measurement]);
  const data = result.monthly.map((row) => ({
    ...row,
    label: t("months")[row.month - 1],
    // A skewed distribution can put the mean outside the IQR. Centre the
    // whisker on its own midpoint so its endpoints remain exactly Q1 and Q3.
    quartileMid: row.q1 == null ? null : (row.q1 + row.q3) / 2,
    spread: row.q1 == null ? null : (row.q3 - row.q1) / 2,
  }));
  if (!data.length) return null;
  const wettest = data.reduce((best, row) => row.mean == null || (best && best.mean >= row.mean) ? best : row, null);
  const hasQuartiles = data.some((row) => row.q1 != null);
  const scale = axisScale(data.flatMap((row) => row.mean == null ? [] : [row.mean, row.q1 ?? row.mean, row.q3 ?? row.mean]), { unit: "mm", includeZero: true });

  function MonthTick({ x, y, index }) {
    const row = data[index];
    if (!row) return null;
    return <g transform={`translate(${x},${y})`}>
      <title>{row.label}{row.mean == null ? `: ${t("rainfallNoData")}` : ""}</title>
      <text transform="rotate(-50)" textAnchor="end" y={8} fontSize={11} fill={row.mean == null ? CHART_PALETTE.noData : CHART_PALETTE.reference}>
        {row.mean == null ? "× " : ""}{row.label}
      </text>
    </g>;
  }

  return <section className="card landslide-indicator monthly-rainfall-indicator">
    <div className="indicator-heading"><h2>{t("monthlyRainfallTitle")}</h2><p>{t("monthlyRainfallDesc")}</p></div>
    {wettest && <p className="indicator-callout">{t("highestRainfallMonth")}: <strong>{t("months")[wettest.month - 1]}</strong> ({formatMm(t, wettest.mean)} mm)</p>}
    <p className="chart-axis-note">{t("monthlyRainfallAxis")}</p>
    <ChartFrame t={t} rows={data} columns={[{"key":"label","label":"Month"},{"key":"mean","label":"Mean (mm)"},{"key":"q1","label":"Lower quartile (mm)"},{"key":"q3","label":"Upper quartile (mm)"},{"key":"lowest","label":"Minimum (mm)"},{"key":"highest","label":"Maximum (mm)"},{"key":"yearCount","label":"Contributing years"},{"key":"years","label":"Years"}]} indicator="monthly-rainfall-indicator-1" width="100%" height={340}>
      <ComposedChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 24 }}>
        <CartesianGrid stroke="#dce5ea" vertical={false} />
        <XAxis dataKey="label" interval={0} tick={<MonthTick />} height={70} label={xAxisLabel(t("month"), -18)} />
        <YAxis width={48} tick={{ fontSize: 12 }} domain={[0, scale.domain[1]]} ticks={scale.ticks} tickFormatter={(value) => formatForAxis(value, scale.decimals, t.locale)} allowDataOverflow />
        <Tooltip content={<MonthTooltip t={t} />} />
        <Bar dataKey="mean" name={t("mean")} fill={CHART_PALETTE.rainfall} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        {hasQuartiles && <Line dataKey="quartileMid" stroke="none" dot={false} activeDot={false} isAnimationActive={false} tooltipType="none">
          <ErrorBar dataKey="spread" width={4} strokeWidth={1.4} stroke={CHART_PALETTE.reference} direction="y" />
        </Line>}
      </ComposedChart>
    </ChartFrame>
    <p className="indicator-explanation">{t("monthlyRainfallExplanation")}</p>
    <p className="indicator-assumption">{t("rainfallNoDataNote")}</p>
    <p className="indicator-assumption">{t("rainfallMethodSummary", { n: MIN_QUARTILE_YEARS })}</p>
    <Methodology t={t}>
      <p className="indicator-assumption">{t("monthlyRainfallAssumption")}</p>
      <p className="indicator-assumption">{t("rainfallWhiskerNote").replace("{n}", MIN_QUARTILE_YEARS)}</p>
    </Methodology>
  </section>;
}
