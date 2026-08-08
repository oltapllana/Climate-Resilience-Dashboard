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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateHotDays } from "../lib/hotDays.js";

const HOT = "#c63a2b";
const WARM = "#f5a742";
const COOL = "#719eac";
const MUTED = ["#9aaab4", "#719eac", "#aab8bf", "#6f98a6", "#b4c0c5", "#829da7"];

function fmt(value, digits = 3) {
  return value == null ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function tidyAxisValue(value) {
  if (value == null) return "";
  const rounded = Number(value).toFixed(1);
  return rounded.replace(/\.0$/, "");
}

function DailyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.date}</strong>
      <span>Daily max: {fmt(row.dailyMax)} °C</span>
      <span>{row.dailyMax >= 30 ? "Hot-day threshold reached" : ""}</span>
    </div>
  );
}

function AnnualTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const series = payload[0].dataKey === "days30" ? "≥30°C" : "≥40°C";
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}</strong>
      <span>{series}: {payload[0].value} days</span>
      {row.isPartial ? <span>Partial year</span> : null}
    </div>
  );
}

function AnnualLabel({ x, y, value }) {
  return (
    <text x={x} y={y - 8} textAnchor="middle" fill="#17242b" fontSize="11" fontWeight="700">
      {fmt(value, 0)}
    </text>
  );
}

function ThresholdDot({ cx, cy, payload }) {
  if (payload?.dailyMax == null || payload.dailyMax < 30) return null;
  const radius = payload.dailyMax >= 40 ? 5 : 3;
  return <circle cx={cx} cy={cy} r={radius} fill={payload.dailyMax >= 40 ? HOT : WARM} stroke="#ffffff" strokeWidth={1.2} />;
}

export default function HotDaysIndicator({ measurement, t }) {
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
      const result = calculateHotDays(measurement.hourly);
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
  const recordMax = state.status === "ready" ? state.result.recordMax : { date: null, temperature: null };

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
                <h2>Daily maximum temperature</h2>
                <p>This indicator counts calendar days when the observed daily maximum temperature reached at least 30°C or 40°C.</p>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={dailyData} margin={{ top: 14, right: 22, left: 44, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" />
                  <XAxis dataKey="date" minTickGap={48} tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={[0, 40]}
                    ticks={[0, 10, 20, 30, 40]}
                    allowDataOverflow
                    width={60}
                    tick={{ fontSize: 12 }}
                    tickFormatter={tidyAxisValue}
                    label={{ value: "Daily maximum temperature (°C)", angle: -90, position: "insideLeft", offset: -12 }}
                  />
                  <Tooltip content={<DailyTooltip />} />
                  <ReferenceLine y={30} stroke="#17242b" strokeDasharray="6 4" label={{ value: "30°C", position: "insideTopRight", fill: "#17242b", fontSize: 11, fontWeight: 600 }} />
                  <ReferenceLine y={40} stroke="#17242b" strokeDasharray="8 5" label={{ value: "40°C", position: "insideTopLeft", fill: "#17242b", fontSize: 11, fontWeight: 600 }} />
                  {recordMax.date && (
                    <ReferenceLine x={recordMax.date} stroke={HOT} strokeDasharray="4 4" label={{ value: `${fmt(recordMax.temperature, 1)}°C`, position: "top", fill: HOT, fontSize: 11, fontWeight: 700 }} />
                  )}
                  <Line type="monotone" dataKey="dailyMax" stroke="#2f7d32" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="dailyMax" stroke="transparent" strokeWidth={0} dot={<ThresholdDot />} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="indicator-panel">
              <div className="indicator-heading">
                <h2>Annual hot-day count</h2>
                <p>Grouped bars show counts for days with daily maxima at or above 30°C and 40°C.</p>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={yearlyData.map((row) => ({ ...row, threshold30: row.days30, threshold40: row.days40 }))} margin={{ top: 30, right: 18, left: 14, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" vertical={false} />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} domain={[0, Math.max(1, ...yearlyData.map((row) => Math.max(row.days30, row.days40, 1)))]} label={{ value: "Count of days", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<AnnualTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    wrapperStyle={{ transform: "translateY(-14px)" }}
                    payload={[
                      { value: "≥30°C", type: "square", color: COOL },
                      { value: "≥40°C", type: "square", color: HOT },
                    ]}
                  />
                  <Bar dataKey="days30" name="≥30°C" radius={[3, 3, 0, 0]}>
                    {yearlyData.map((row) => (
                      <Cell key={`${row.year}-30`} fill={row.isPartial ? WARM : COOL} />
                    ))}
                    <LabelList content={<AnnualLabel />} />
                  </Bar>
                  <Bar dataKey="days40" name="≥40°C" radius={[3, 3, 0, 0]}>
                    {yearlyData.map((row) => (
                      <Cell key={`${row.year}-40`} fill={row.isPartial ? HOT : MUTED[row.year % MUTED.length]} />
                    ))}
                    <LabelList content={<AnnualLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="indicator-explanation">This indicator counts calendar days when the observed daily maximum temperature reached at least 30°C or 40°C.</p>
          <p className="indicator-assumption">
            Daily maxima use available hourly observations; missing hours or days are not treated as 0°C. 2021 and 2026 are partial records, and this is a single-station record.
          </p>
          <p className="indicator-assumption">
            Record maximum: {fmt(recordMax.temperature, 1)} °C on {recordMax.date}.
          </p>
        </>
      )}
    </section>
  );
}
