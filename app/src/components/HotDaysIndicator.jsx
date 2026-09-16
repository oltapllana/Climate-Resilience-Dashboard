import ChartFrame from "./ChartFrame.jsx";
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateHotDays } from "../lib/hotDays.js";
import { ChartEmptyState, yAxisLabel } from "./chartLabels.jsx";

const HOT = "#c63a2b";
const WARM = "#f5a742";
const COOL = "#719eac";
const MUTED = ["#9aaab4", "#719eac", "#aab8bf", "#6f98a6", "#b4c0c5", "#829da7"];

function fmt(t, value, digits = 3) {
  return value == null ? "—" : t.number(Number(value), { maximumFractionDigits: digits });
}

function tidyAxisValue(t, value) {
  if (value == null) return "";
  return t.number(value, { maximumFractionDigits: 1 });
}

function DailyTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.date}</strong>
      <span>{t("dailyMaximumShort")}: {fmt(t, row.dailyMax)} °C</span>
      <span>{row.dailyMax >= 30 ? t("hotDayThresholdReached") : ""}</span>
    </div>
  );
}

function AnnualTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const series = payload[0].dataKey === "days30" ? "≥30°C" : "≥40°C";
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}</strong>
      <span>{series}: {t("dayCount", { count: payload[0].value })}</span>
      {row.isPartial ? <span>{t("partialYear")}</span> : null}
    </div>
  );
}

function AnnualLabel({ t, x, y, value }) {
  return (
    <text x={x} y={y - 8} textAnchor="middle" fill="#17242b" fontSize="11" fontWeight="700">
      {fmt(t, value, 0)}
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
      {state.status === "empty" && <ChartEmptyState title={t("noChartData")} detail={t("landslideNoData")} />}
      {state.status === "insufficient" && <ChartEmptyState title={t("noChartData")} detail={t("landslideNoHourly")} />}
      {state.status === "error" && <ChartEmptyState title={t("noChartData")} detail={t("landslideCalculationError")} />}

      {state.status === "ready" && (
        <>
          <div className="indicator-grid">
            <div className="indicator-panel">
              <div className="indicator-heading">
                <h2>{t("hotDaysTitle")}</h2>
                <p>{t("hotDaysDesc")}</p>
              </div>
              <ChartFrame t={t} rows={dailyData} columns={[{"key":"date","label":"Date"},{"key":"dailyMax","label":"Maximum (°C)"}]} indicator="hot-days-indicator-1" width="100%" height={360}>
                <LineChart data={dailyData} margin={{ top: 26, right: 22, left: 44, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" />
                  <XAxis dataKey="date" minTickGap={48} tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={[0, 40]}
                    ticks={[0, 10, 20, 30, 40]}
                    allowDataOverflow
                    width={60}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => tidyAxisValue(t, value)}
                    label={yAxisLabel(t("hotDaysAxis"))}
                  />
                  <Tooltip content={<DailyTooltip t={t} />} />
                  <ReferenceLine y={30} stroke="#17242b" strokeDasharray="6 4" label={{ value: "30°C", position: "insideTopRight", fill: "#17242b", fontSize: 11, fontWeight: 600 }} />
                  <ReferenceLine y={40} stroke="#17242b" strokeDasharray="8 5" label={{ value: "40°C", position: "insideTopLeft", fill: "#17242b", fontSize: 11, fontWeight: 600 }} />
                  {recordMax.date && (
                    <ReferenceLine x={recordMax.date} stroke={HOT} strokeDasharray="4 4" label={{ value: `${fmt(t, recordMax.temperature, 1)}°C`, position: "top", fill: HOT, fontSize: 11, fontWeight: 700 }} />
                  )}
                  <Line type="monotone" dataKey="dailyMax" stroke="#2f7d32" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="dailyMax" stroke="transparent" strokeWidth={0} dot={<ThresholdDot />} isAnimationActive={false} />
                </LineChart>
              </ChartFrame>
            </div>

            <div className="indicator-panel">
              <div className="indicator-heading">
                <h2>{t("hotDaysAnnualTitle")}</h2>
                <p>{t("hotDaysAnnualDesc")}</p>
              </div>
              <ChartFrame t={t} rows={yearlyData.map((row) => ({ ...row, threshold30: row.days30, threshold40: row.days40 }))} columns={[{"key":"year","label":"Year"},{"key":"days30","label":"Days at least 30°C"},{"key":"days40","label":"Days at least 40°C"},{"key":"isPartial","label":"Partial year"}]} indicator="hot-days-indicator-2" width="100%" height={360}>
                <BarChart data={yearlyData.map((row) => ({ ...row, threshold30: row.days30, threshold40: row.days40 }))} margin={{ top: 30, right: 18, left: 14, bottom: 28 }}>
                  <CartesianGrid stroke="#dce5ea" vertical={false} />
                  {/* 2021 and 2026 are partial records; unmarked, a short year
                      reads as a mild one */}
                  <XAxis
                    dataKey="year"
                    tickFormatter={(year) => `${year}${yearlyData.find((row) => row.year === year)?.isPartial ? "*" : ""}`}
                  />
                  <YAxis tickFormatter={(value) => t.number(value)}
                    allowDecimals={false}
                    domain={[0, Math.max(1, ...yearlyData.map((row) => Math.max(row.days30, row.days40, 1)))]}
                    label={{ value: t("countOfDaysAxis"), angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#475569", fontSize: 12, fontWeight: 600 } }}
                  />
                  <Tooltip content={<AnnualTooltip t={t} />} />
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
                    <LabelList content={<AnnualLabel t={t} />} />
                  </Bar>
                  <Bar dataKey="days40" name="≥40°C" minPointSize={(value) => (value ? 2 : 0)} radius={[3, 3, 0, 0]}>
                    {yearlyData.map((row) => (
                      <Cell key={`${row.year}-40`} fill={row.isPartial ? HOT : MUTED[row.year % MUTED.length]} />
                    ))}
                    <LabelList content={<AnnualLabel t={t} />} />
                  </Bar>
                </BarChart>
              </ChartFrame>
            </div>
          </div>

          <p className="indicator-explanation">{t("hotDaysDesc")}</p>
          <p className="indicator-assumption">{t("hotDaysAssumption")}</p>
          <p className="indicator-assumption">
            {t("recordMaximum")}: {fmt(t, recordMax.temperature, 1)} °C {t("onDate")} {recordMax.date}.
          </p>
        </>
      )}
    </section>
  );
}
