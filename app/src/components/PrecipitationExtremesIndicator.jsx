import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculatePrecipitationExtremes } from "../lib/precipitationExtremes.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { ChartEmptyState, EdgeLabel, yAxisLabel } from "./chartLabels.jsx";

const RED = "#c63a2b";
const MUTED = ["#9aaab4", "#719eac", "#aab8bf", "#6f98a6", "#b4c0c5", "#829da7"];

function fmt(value, digits = 3) {
  return value == null ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function thresholdLabel(value, t) {
  if (value == null) return "";
  return `${t("percentileThreshold")}: ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} mm/ditë`;
}

function DailyTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.date}</strong>
      <span>{t("dailyTotal")}: {fmt(row.total)} mm/ditë</span>
      <span>{row.isExtreme ? t("extremeDay") : ""}</span>
    </div>
  );
}

function YearTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}</strong>
      <span>{t("maximumDate")}: {row.maxDate}</span>
      <span>{t("maximum")}: {fmt(row.maxTotal)} mm/ditë</span>
      <span>{t("threshold")}: {fmt(row.threshold)} mm/ditë</span>
    </div>
  );
}

function ExtremeLabel({ x, y, value, payload }) {
  if (!payload?.isExtreme) return null;
  return (
    <g transform={`translate(${x},${y - 10})`}>
      <text textAnchor="middle" fill="#17242b" fontSize="10" fontWeight="700">
        <tspan x="0" dy="0">{payload.date}</tspan>
        <tspan x="0" dy="12">{fmt(value, 1)} mm</tspan>
      </text>
    </g>
  );
}

function YearLabel({ x, y, value }) {
  return (
    <text x={x} y={y - 8} textAnchor="middle" fill="#17242b" fontSize="11" fontWeight="700">
      {fmt(value, 1)}
    </text>
  );
}

export default function PrecipitationExtremesIndicator({ measurement, t }) {
  const [state, setState] = useState({ status: "loading", result: null, error: null });

  useEffect(() => {
    if (!measurement) {
      setState({ status: "empty", result: null, error: null });
      return;
    }
    if (!Array.isArray(measurement.hourly) || !measurement.hourly.length) {
      setState({ status: "insufficient", result: null, error: null });
      return;
    }
    setState({ status: "loading", result: null, error: null });
    try {
      const result = calculatePrecipitationExtremes(measurement.hourly);
      setState({
        status: result.daily.length ? "ready" : "empty",
        result,
        error: null,
      });
    } catch (error) {
      setState({ status: "error", result: null, error });
    }
  }, [measurement]);

  const dailyData = useMemo(() => (state.status === "ready" ? state.result.daily : []), [state]);
  const yearlyData = useMemo(() => (state.status === "ready" ? state.result.yearly : []), [state]);
  const threshold = state.status === "ready" ? state.result.threshold : null;

  // Round ticks: the old yearly domain gave the axis a 0 and then a 30 with
  // nothing in between, which the review read as a missing stretch of scale.
  const dailyScale = useMemo(
    () => axisScale(dailyData.map((row) => row.total).concat(threshold ?? []), { unit: "mm", includeZero: true }),
    [dailyData, threshold]
  );

  const yearlyScale = useMemo(
    () => axisScale(yearlyData.map((row) => row.maxTotal).concat(threshold ?? []), { unit: "mm", includeZero: true }),
    [yearlyData, threshold]
  );

  const yearTick = (year) => `${year}${yearlyData.find((row) => row.year === year)?.isPartial ? "*" : ""}`;
  const hasPartialYear = yearlyData.some((row) => row.isPartial);

  return (
    <section className="card landslide-indicator">
      {state.status === "loading" && <div className="empty">{t("indicatorLoading")}</div>}
      {state.status === "empty" && <ChartEmptyState title={t("noChartData")} detail={t("landslideNoData")} />}
      {state.status === "insufficient" && <ChartEmptyState title={t("noChartData")} detail={t("landslideNoHourly")} />}
      {state.status === "error" && <ChartEmptyState title={t("noChartData")} detail={t("landslideCalculationError")} />}

      {state.status === "ready" && (
        <>
          <div className="indicator-grid">
            <div className="indicator-panel">
              <div className="indicator-heading">
                <h2>{t("precipitationExtremesTitle")}</h2>
                <p>{t("precipitationExtremesDesc")}</p>
              </div>
              {/* This panel was a LineChart with a Bar inside it. Recharts does
                  not render bars in a LineChart, so the plot came out empty —
                  the "no visible point above the threshold" the review flagged,
                  while the panel beside it counted two years over that same
                  threshold. A ComposedChart draws the bars it always had. */}
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={dailyData} margin={{ top: 22, right: 22, left: 54, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" />
                  {/* the first date label is centred on the first bar, which
                      sits on the plot edge — without the padding half of it
                      hangs over the y-axis and lands on its zero tick */}
                  <XAxis dataKey="date" minTickGap={48} tick={{ fontSize: 10 }} padding={{ left: 30, right: 30 }} />
                  <YAxis
                    domain={dailyScale.domain}
                    ticks={dailyScale.ticks}
                    allowDataOverflow
                    width={72}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatForAxis(value, dailyScale.decimals)}
                    label={yAxisLabel(t("dailyPrecipitationAxis"))}
                  />
                  <Tooltip content={<DailyTooltip t={t} />} />
                  <Bar dataKey="total" fill="#2b7fc4" minPointSize={(value) => (value ? 1 : 0)} isAnimationActive={false}>
                    {dailyData.map((row, index) => (
                      <Cell key={row.date} fill={row.isExtreme ? RED : MUTED[index % MUTED.length]} />
                    ))}
                    <LabelList content={<ExtremeLabel />} />
                  </Bar>
                  {/* after the bars, so the threshold and its label sit on top
                      of them rather than behind — see DailyTrendIndicator */}
                  <ReferenceLine
                    y={threshold}
                    stroke="#17242b"
                    strokeDasharray="8 5"
                    label={<EdgeLabel text={thresholdLabel(threshold, t)} fill="#17242b" topLimit={26} />}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="indicator-panel">
              <div className="indicator-heading">
                <h2>{t("eachYearExtremeDay")}</h2>
                <p>{t("annualExtremeDayDesc")}</p>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={yearlyData.map((row) => ({ ...row, threshold }))} margin={{ top: 30, right: 18, left: 54, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" vertical={false} />
                  <XAxis dataKey="year" tickFormatter={yearTick} />
                  <YAxis
                    allowDecimals={false}
                    domain={yearlyScale.domain}
                    ticks={yearlyScale.ticks}
                    allowDataOverflow
                    width={72}
                    tickFormatter={(value) => formatForAxis(value, yearlyScale.decimals)}
                    label={yAxisLabel(t("annualDailyMaximumAxis"))}
                  />
                  <Tooltip content={<YearTooltip t={t} />} />
                  <Bar dataKey="maxTotal" name={t("maximumDailyTotal")} radius={[3, 3, 0, 0]}>
                    {yearlyData.map((row) => (
                      <Cell key={row.year} fill={row.exceedsThreshold ? RED : "#719eac"} />
                    ))}
                    <LabelList content={<YearLabel />} />
                  </Bar>
                  {/* after the bars, so the threshold and its label are read
                      against them instead of disappearing behind 2024 and 2025 */}
                  <ReferenceLine
                    y={threshold}
                    stroke="#17242b"
                    strokeDasharray="8 5"
                    label={<EdgeLabel text={thresholdLabel(threshold, t)} fill="#17242b" topLimit={30} />}
                  />
                </BarChart>
              </ResponsiveContainer>
              {hasPartialYear && (
                <p className="indicator-assumption">
                  {t("partialWettestDayNote")}
                </p>
              )}
            </div>
          </div>

          <p className="indicator-explanation">{t("precipitationExtremesDesc")}</p>
          <p className="indicator-assumption">{t("precipitationExtremesAssumption")}</p>
        </>
      )}
    </section>
  );
}
