import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateLandslideRainfallIndicator,
} from "../lib/landslideRainfall.js";
import { ChartEmptyState, topLegendProps, xAxisLabel, yAxisLabel } from "./chartLabels.jsx";

const RED = "#c63a2b";
const PARTIAL = "#7b8a95";
// One hue per year rather than six shades of the same grey-blue: the review
// could not separate the curves from each other or from the legend swatches.
const MUTED = ["#3f7fb0", "#4c9a6a", "#9d7bc4", "#c98a2e", "#5aa9a2", "#a8577c"];

function fmt(value) {
  return value == null
    ? "—"
    : Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function IndicatorTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const series = payload.find((entry) => entry.dataKey !== "threshold" && entry.value != null);
  if (!row || !series) return null;
  const exceeded = Number(series.value) > row.threshold;
  return (
    <div className="indicator-tooltip">
      <strong>{series.name}</strong>
      <span>{t("landslideDuration")}: {label} {t("days")}</span>
      <span>{t("landslideMaximum")}: {fmt(series.value)} mm/h</span>
      <span>{t("landslideThreshold")}: {fmt(row.threshold)} mm/h</span>
      <span className={exceeded ? "critical-text" : ""}>
        {exceeded ? t("landslideExceeded") : t("landslideNotExceeded")}
      </span>
    </div>
  );
}

function DaysTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}{row.isPartial ? ` · ${t("partialYear")}` : ""}</strong>
      <span>{t("landslideCriticalDays")}: {row.criticalDays}</span>
      <span>{t("coverage")}: {row.availableStart} – {row.availableEnd}</span>
    </div>
  );
}

export default function LandslideRainfallIndicator({ measurement, t }) {
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
      const result = calculateLandslideRainfallIndicator(measurement.hourly);
      setState({
        status: result.yearly.length ? "ready" : "empty",
        result,
        error: null,
      });
    } catch (error) {
      setState({
        status: "error",
        result: null,
        error,
      });
    }
  }, [measurement]);

  const chartData = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.result.durations.map((duration, index) => {
      const row = {
        duration,
        threshold: state.result.yearly[0]?.values[index]?.threshold,
      };
      state.result.yearly.forEach((year) => {
        row[`year_${year.year}`] = year.values[index].maximum;
      });
      return row;
    });
  }, [state]);

  const domain = useMemo(() => {
    const values = chartData.flatMap((row) => [
      row.threshold,
      ...Object.entries(row)
        .filter(([key]) => key.startsWith("year_"))
        .map(([, value]) => value),
    ]).filter((value) => Number.isFinite(value) && value > 0);
    if (!values.length) return [0.1, 10];
    return [
      Math.max(0.001, Math.min(...values) * 0.75),
      Math.max(...values) * 1.35,
    ];
  }, [chartData]);

  // A record in which no day ever met the threshold: worth saying in words
  // rather than drawing as six empty columns.
  const yearlyRows = state.status === "ready" ? state.result.yearly : [];
  const noCriticalDays = yearlyRows.length > 0 && yearlyRows.every((row) => !row.criticalDays);
  const coveredYears = yearlyRows.length;
  const hasPartialYear = yearlyRows.some((row) => row.isPartial);
  const thresholdAudit = state.status === "ready" ? state.result.thresholdAudit : null;
  const auditText = thresholdAudit?.closestRatio == null
    ? null
    : t(thresholdAudit.triggered ? "landslideThresholdTriggered" : "landslideThresholdSilent")
        .replace("{days}", thresholdAudit.criticalDays)
        .replace("{years}", thresholdAudit.yearsTriggered)
        .replace("{duration}", thresholdAudit.closestDuration)
        .replace("{ratio}", Math.round(thresholdAudit.closestRatio * 100));

  return (
    <section className="card landslide-indicator">
      {state.status === "loading" && <div className="empty">{t("indicatorLoading")}</div>}
      {state.status === "empty" && <ChartEmptyState title={t("noChartData")} detail={t("landslideNoData")} />}
      {state.status === "insufficient" && <ChartEmptyState title={t("noChartData")} detail={t("landslideNoHourly")} />}
      {state.status === "error" && <ChartEmptyState title={t("noChartData")} detail={t("landslideCalculationError")} />}

      {state.status === "ready" && (
        <>
          {auditText && (
            <p className={`indicator-callout${thresholdAudit.triggered ? "" : " indicator-callout--warn"}`}>
              {auditText}
            </p>
          )}
          <div className="indicator-grid">
            <div className="indicator-panel">
              <div className="indicator-heading">
                <h2>{t("landslideTitle")}</h2>
                <p>{t("landslideSubtitle")}</p>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData} margin={{ top: 14, right: 22, left: 24, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" />
                  {chartData.map((row) => (
                    <ReferenceArea
                      key={`safe-${row.duration}`}
                      x1={row.duration - 0.49}
                      x2={row.duration + 0.49}
                      y1={domain[0]}
                      y2={row.threshold}
                      fill="#dfeee8"
                      fillOpacity={0.65}
                      stroke="none"
                    />
                  ))}
                  {chartData.map((row) => (
                    <ReferenceArea
                      key={`critical-${row.duration}`}
                      x1={row.duration - 0.49}
                      x2={row.duration + 0.49}
                      y1={row.threshold}
                      y2={domain[1]}
                      fill="#f5dfdc"
                      fillOpacity={0.62}
                      stroke="none"
                    />
                  ))}
                  <XAxis
                    dataKey="duration"
                    type="number"
                    domain={[0.8, 5.2]}
                    ticks={[1, 2, 3, 4, 5]}
                    label={xAxisLabel(t("landslideXAxis"), -12)}
                  />
                  <YAxis
                    scale="log"
                    domain={domain}
                    allowDataOverflow
                    label={yAxisLabel(t("landslideYAxis"))}
                  />
                  <Tooltip content={<IndicatorTooltip t={t} />} />
                  <Legend {...topLegendProps} height={44} />
                  <Line
                    dataKey="threshold"
                    name={t("landslideThreshold")}
                    stroke="#17242b"
                    strokeWidth={2.5}
                    strokeDasharray="8 5"
                    dot={false}
                    isAnimationActive={false}
                  />
                  {state.result.yearly.map((year, index) => (
                    <Line
                      key={year.year}
                      dataKey={`year_${year.year}`}
                      name={`${year.year}${year.isPartial ? "*" : ""}${year.exceeded ? ` (${t("landslideExceeded")})` : ""}`}
                      stroke={year.isPartial ? PARTIAL : year.exceeded ? RED : MUTED[index % MUTED.length]}
                      strokeWidth={year.exceeded ? 3 : 1.8}
                      strokeOpacity={year.exceeded ? 1 : 0.72}
                      dot={{ r: year.exceeded ? 4 : 3 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="indicator-panel">
              <div className="indicator-heading">
                <h2>{t("landslideDaysTitle")}</h2>
                <p>{t("landslideDaysSubtitle")}</p>
              </div>
              {/* Six years of zeroes plotted on an axis running 0 to 1 is an
                  empty rectangle. A sentence carries the same finding, and says
                  the thing the bars could not: nothing was recorded, which is
                  not the same as nothing being measured. */}
              {noCriticalDays ? (
                <ChartEmptyState
                  title={t("noQualifyingEvents")}
                  detail={t("landslideNoCriticalDetail").replace("{years}", coveredYears)}
                />
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={state.result.yearly} margin={{ top: 30, right: 18, left: 24, bottom: 28 }}>
                    <CartesianGrid stroke="#dce5ea" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(year) => `${year}${state.result.yearly.find((row) => row.year === year)?.isPartial ? "*" : ""}`}
                    />
                    <YAxis
                      width={64}
                      allowDecimals={false}
                      domain={[0, (max) => Math.max(1, max + 1)]}
                      label={yAxisLabel(t("landslideBarYAxis"))}
                    />
                    <Tooltip content={<DaysTooltip t={t} />} />
                    <Legend
                      {...topLegendProps}
                      payload={[
                        { value: t("landslideFullYearLegend"), type: "square", color: RED, id: "full" },
                        ...(hasPartialYear ? [{ value: t("landslidePartialYearLegend"), type: "square", color: PARTIAL, id: "partial" }] : []),
                      ]}
                    />
                    <Bar dataKey="criticalDays" name={t("landslideCriticalDays")} fill={RED} minPointSize={3} radius={[3, 3, 0, 0]}>
                      {state.result.yearly.map((row) => (
                        <Cell key={row.year} fill={row.isPartial ? PARTIAL : RED} />
                      ))}
                      <LabelList dataKey="criticalDays" position="top" fontWeight={700} fill="#17242b" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {hasPartialYear && (
                <p className="indicator-assumption">{t("landslidePartialYearNote")}</p>
              )}
            </div>
          </div>

          <p className="indicator-explanation">{t("landslideExplanation")}</p>
          {/* The threshold used to be an undocumented pair of constants. A
              reader cannot judge an exceedance without knowing which published
              curve it came from and what it does not claim, so both are stated
              on the chart itself. */}
          <p className="indicator-assumption">{t("landslideThresholdSource")}</p>
          <p className="indicator-assumption">{t("landslideThresholdCaveat")}</p>
          <p className="indicator-assumption">
            {t("landslideMethodologyNote")}
          </p>
        </>
      )}
    </section>
  );
}
