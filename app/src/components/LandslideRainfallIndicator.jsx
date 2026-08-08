import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

const RED = "#c63a2b";
const MUTED = ["#9aaab4", "#719eac", "#aab8bf", "#6f98a6", "#b4c0c5", "#829da7"];

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
      <strong>{row.year}</strong>
      <span>{t("landslideCriticalDays")}: {row.criticalDays}</span>
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

  return (
    <section className="card landslide-indicator">
      {state.status === "loading" && <div className="empty">{t("indicatorLoading")}</div>}
      {state.status === "empty" && <div className="empty">{t("landslideNoData")}</div>}
      {state.status === "insufficient" && <div className="empty">{t("landslideNoHourly")}</div>}
      {state.status === "error" && <div className="empty error-text">{t("landslideCalculationError")}</div>}

      {state.status === "ready" && (
        <>
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
                    label={{ value: t("landslideXAxis"), position: "insideBottom", offset: -12 }}
                  />
                  <YAxis
                    scale="log"
                    domain={domain}
                    allowDataOverflow
                    label={{ value: t("landslideYAxis"), angle: -90, position: "insideLeft", offset: -8 }}
                  />
                  <Tooltip content={<IndicatorTooltip t={t} />} />
                  <Legend verticalAlign="top" height={48} />
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
                      name={`${year.year}${year.exceeded ? ` (${t("landslideExceeded")})` : ""}`}
                      stroke={year.exceeded ? RED : MUTED[index % MUTED.length]}
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
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={state.result.yearly} margin={{ top: 30, right: 18, left: 14, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" vertical={false} />
                  <XAxis dataKey="year" />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, (max) => Math.max(1, max + 1)]}
                    label={{ value: t("landslideBarYAxis"), angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip content={<DaysTooltip t={t} />} />
                  <Bar dataKey="criticalDays" name={t("landslideCriticalDays")} fill={RED} radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="criticalDays" position="top" fontWeight={700} fill="#17242b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="indicator-explanation">{t("landslideExplanation")}</p>
          <p className="indicator-assumption">
            {t("landslideMethodologyNote")}
          </p>
        </>
      )}
    </section>
  );
}
