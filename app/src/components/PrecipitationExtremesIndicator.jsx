import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculatePrecipitationExtremes } from "../lib/precipitationExtremes.js";

const RED = "#c63a2b";
const MUTED = ["#9aaab4", "#719eac", "#aab8bf", "#6f98a6", "#b4c0c5", "#829da7"];

function fmt(value, digits = 3) {
  return value == null ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function thresholdLabel(value) {
  if (value == null) return "";
  return `99.9th percentile: ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} mm/day`;
}

function axisTick(value) {
  if (!Number.isFinite(Number(value))) return "";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function DailyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.date}</strong>
      <span>Daily total: {fmt(row.total)} mm/day</span>
      <span>{row.isExtreme ? "Extreme day" : ""}</span>
    </div>
  );
}

function YearTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}</strong>
      <span>Maximum date: {row.maxDate}</span>
      <span>Maximum: {fmt(row.maxTotal)} mm/day</span>
      <span>Threshold: {fmt(row.threshold)} mm/day</span>
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

  const dailyDomain = useMemo(() => {
    const values = dailyData.map((row) => row.total).filter((value) => Number.isFinite(value) && value >= 0);
    if (!values.length) return [0.1, 10];
    return [0, Math.max(...values) * 1.15];
  }, [dailyData]);

  const yearlyDomain = useMemo(() => {
    const values = yearlyData.map((row) => row.maxTotal).filter((value) => Number.isFinite(value) && value >= 0);
    if (!values.length) return [0.1, 10];
    return [0, Math.max(...values) * 1.2];
  }, [yearlyData]);

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
                <h2>Precipitation extremes</h2>
                <p>This indicator identifies exceptionally wet days relative to the 99.9th percentile of the available daily precipitation record.</p>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={dailyData} margin={{ top: 14, right: 22, left: 54, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" />
                  <XAxis dataKey="date" minTickGap={48} tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={dailyDomain}
                    allowDataOverflow
                    width={72}
                    tick={{ fontSize: 12 }}
                    tickFormatter={axisTick}
                    label={{ value: "Daily precipitation (mm)", angle: -90, position: "insideLeft", offset: -22 }}
                  />
                  <Tooltip content={<DailyTooltip />} />
                  <ReferenceLine
                    y={threshold}
                    stroke="#17242b"
                    strokeDasharray="8 5"
                    label={{ value: thresholdLabel(threshold), position: "insideTopRight", fill: "#17242b", fontSize: 11, fontWeight: 600 }}
                  />
                  <Bar dataKey="total" fill="#2b7fc4" isAnimationActive={false}>
                    {dailyData.map((row, index) => (
                      <Cell key={row.date} fill={row.isExtreme ? RED : MUTED[index % MUTED.length]} />
                    ))}
                    <LabelList content={<ExtremeLabel />} />
                  </Bar>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="indicator-panel">
              <div className="indicator-heading">
                <h2>Each year's most extreme day</h2>
                <p>Annual maximum daily totals compared with the same record-wide threshold.</p>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={yearlyData.map((row) => ({ ...row, threshold }))} margin={{ top: 30, right: 18, left: 54, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" vertical={false} />
                  <XAxis dataKey="year" />
                  <YAxis
                    allowDecimals={false}
                    domain={yearlyDomain}
                    width={72}
                    tickFormatter={axisTick}
                    label={{ value: "Annual daily maximum (mm)", angle: -90, position: "insideLeft", offset: -22 }}
                  />
                  <Tooltip content={<YearTooltip />} />
                  <ReferenceLine
                    y={threshold}
                    stroke="#17242b"
                    strokeDasharray="8 5"
                    label={{ value: thresholdLabel(threshold), position: "insideTopRight", fill: "#17242b", fontSize: 11, fontWeight: 600 }}
                  />
                  <Bar dataKey="maxTotal" name="Maximum daily total" radius={[3, 3, 0, 0]}>
                    {yearlyData.map((row) => (
                      <Cell key={row.year} fill={row.exceedsThreshold ? RED : "#719eac"} />
                    ))}
                    <LabelList content={<YearLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="indicator-explanation">This indicator identifies exceptionally wet days relative to the 99.9th percentile of the available daily precipitation record.</p>
          <p className="indicator-assumption">
            The threshold is provisional because it is based on a short record rather than a conventional long-term climate baseline. Hourly values are reconstructed by averaging observations within each clock hour. Hours without logged readings are treated as zero rainfall. Extreme daily totals should be validated against raw gauge volume/tip data before operational use.
          </p>
        </>
      )}
    </section>
  );
}
