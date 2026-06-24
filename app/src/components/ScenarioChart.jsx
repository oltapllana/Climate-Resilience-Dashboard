import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from "recharts";
import { scenarioClimatology, forecast, longTermProjection } from "../lib/projection.js";

const AXIS = "#475569";
const GRID = "#edf2f7";
const scenarioChartMargin = { top: 6, right: 18, left: 18, bottom: 48 };
const scenarioLegend = {
  height: 48,
  iconType: "line",
  wrapperStyle: { fontSize: 12, fontWeight: 600, paddingTop: 18 },
};

const scenarioName = (s, t) => (s === "all" ? t("allScenarios") : s === "rcp45" ? "RCP4.5" : "RCP8.5");

function fmt(v, digits = 2) {
  return v == null ? "-" : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function measurementAxis(unit) {
  if (unit === "°C") return "Temperature (°C)";
  if (unit === "%") return "Humidity (%)";
  if (unit === "mm/min") return "Rainfall Intensity (mm/min)";
  if (unit === "mm") return "Rainfall (mm)";
  if (unit === "m") return "Water Level (m)";
  if (unit === "hPa") return "Pressure (hPa)";
  if (unit === "W/m²") return "Solar Radiation (W/m²)";
  if (unit === "m/s") return "Wind Speed (m/s)";
  if (unit === "°") return "Wind Direction (°)";
  return unit ? `Value (${unit})` : "Value";
}

function yLabel(unit) {
  return {
    value: measurementAxis(unit),
    angle: -90,
    position: "insideLeft",
    offset: 8,
    style: { textAnchor: "middle", fill: AXIS, fontSize: 12, fontWeight: 600 },
  };
}

function xLabel(value) {
  return {
    value,
    position: "insideBottom",
    offset: -4,
    style: { textAnchor: "middle", fill: AXIS, fontSize: 12, fontWeight: 600 },
  };
}

// Drag-to-zoom for a Recharts LineChart. Operates on data indices so it works
// for both categorical (month name) and numeric (year) x-axes. Drag across the
// plot to select a horizontal range; release to zoom into it.
function useChartZoom(data, dataKey) {
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [range, setRange] = useState(null); // { start, end } indices into data

  const indexOf = (label) => data.findIndex((d) => String(d[dataKey]) === String(label));

  const onMouseDown = (e) => {
    if (e && e.activeLabel != null) {
      setLeft(e.activeLabel);
      setRight(e.activeLabel);
    }
  };
  const onMouseMove = (e) => {
    if (left != null && e && e.activeLabel != null) setRight(e.activeLabel);
  };
  const onMouseUp = () => {
    if (left != null && right != null && String(left) !== String(right)) {
      let a = indexOf(left);
      let b = indexOf(right);
      if (a > b) [a, b] = [b, a];
      if (a >= 0 && b >= 0) setRange({ start: a, end: b });
    }
    setLeft(null);
    setRight(null);
  };
  const reset = () => {
    setRange(null);
    setLeft(null);
    setRight(null);
  };

  const displayData = range ? data.slice(range.start, range.end + 1) : data;
  const refArea =
    left != null && right != null && String(left) !== String(right) ? (
      <ReferenceArea x1={left} x2={right} strokeOpacity={0.3} fill="#6b5bb5" fillOpacity={0.12} />
    ) : null;

  return {
    displayData,
    isZoomed: range != null,
    reset,
    refArea,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp },
  };
}

function ResetZoomButton({ show, onClick, t }) {
  if (!show) return null;
  return (
    <button type="button" className="zoom-reset" onClick={onClick}>
      {t("resetZoom")}
    </button>
  );
}

export default function ScenarioChart({ meas, scenario = "rcp85", t, unit }) {
  const scen = useMemo(() => scenarioClimatology(meas, scenario), [meas, scenario]);
  const annual = useMemo(() => longTermProjection(meas), [meas]);
  const fc = useMemo(() => forecast(meas, 5), [meas]);

  const climData = scen.lines[0].data.map((_, i) => {
    const row = { month: t("months")[i] };
    scen.lines.forEach((ln) => (row[ln.period] = ln.data[i].v));
    return row;
  });

  const climZoom = useChartZoom(climData, "month");
  const annualZoom = useChartZoom(annual.rows, "year");
  const yearTicks = [2021, 2026, 2030, 2035, 2040, 2045, 2050];
  const annualData = annualZoom.displayData;
  const yearDomain = annualZoom.isZoomed
    ? [annualData[0]?.year, annualData[annualData.length - 1]?.year]
    : [2021, 2050];
  let visibleYearTicks = yearTicks.filter((y) => y >= yearDomain[0] && y <= yearDomain[1]);
  // when a zoom window falls between the fixed ticks, label the window edges instead
  if (annualZoom.isZoomed && visibleYearTicks.length < 2) {
    visibleYearTicks = [...new Set([yearDomain[0], ...visibleYearTicks, yearDomain[1]])].sort((a, b) => a - b);
  }

  return (
    <div className="card">
      <div className="section-title">
        <h2>{t("scenarioTitle")}</h2>
        <span className="badge meteo">{scenarioName(scenario, t)}</span>
        <span className="zoom-hint">{t("zoomHint")}</span>
        <ResetZoomButton show={climZoom.isZoomed} onClick={climZoom.reset} t={t} />
      </div>

      <div className="scenario-chart-block">
        <ResponsiveContainer width="100%" height={270}>
        <LineChart data={climZoom.displayData} margin={scenarioChartMargin} {...climZoom.handlers}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} label={xLabel(t("month"))} allowDataOverflow />
          <YAxis tick={{ fontSize: 12 }} width={58} label={yLabel(unit)} />
          <Tooltip formatter={(v) => `${fmt(v)} ${unit}`} />
          <Legend {...scenarioLegend} />
          {climZoom.refArea}
          {scen.lines.map((ln) => (
            <Line
              key={ln.period}
              type="monotone"
              dataKey={ln.period}
              name={ln.period === "historic" ? t("historic") : ln.label}
              stroke={ln.color}
              strokeWidth={ln.period === "historic" ? 3.2 : 1.8}
              strokeOpacity={ln.period === "historic" ? 1 : 0.72}
              dot={false}
              activeDot={{ r: ln.period === "historic" ? 4 : 3 }}
              connectNulls
            />
          ))}
        </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="section-title">
        <h2>{t("longTermProjection")}</h2>
        <span className="zoom-hint">{t("zoomHint")}</span>
        <ResetZoomButton show={annualZoom.isZoomed} onClick={annualZoom.reset} t={t} />
      </div>
      <div className="scenario-chart-block">
        <ResponsiveContainer width="100%" height={270}>
        <LineChart data={annualData} margin={scenarioChartMargin} {...annualZoom.handlers}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis
            dataKey="year"
            type="number"
            domain={yearDomain}
            ticks={visibleYearTicks}
            allowDataOverflow
            tick={{ fontSize: 11 }}
            label={xLabel(t("year"))}
          />
          <YAxis tick={{ fontSize: 12 }} width={58} label={yLabel(unit)} />
          <Tooltip formatter={(v) => `${fmt(v)} ${unit}`} />
          <Legend {...scenarioLegend} />
          {annualZoom.refArea}
          <Line type="monotone" dataKey="observed" name={t("observed")} stroke="#6b5bb5" strokeWidth={3.2} dot={false} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="rcp45" name="RCP4.5" stroke="#2bb6d8" strokeWidth={1.9} strokeOpacity={0.78} strokeDasharray="5 4" dot={false} activeDot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="rcp85" name="RCP8.5" stroke="#d6453d" strokeWidth={1.9} strokeOpacity={0.78} strokeDasharray="2 4" dot={false} activeDot={{ r: 3 }} connectNulls />
        </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="section-title">
        <h2>{t("forecastTitle")}</h2>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={fc.rows} margin={scenarioChartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={24} label={xLabel(t("month"))} />
          <YAxis tick={{ fontSize: 12 }} width={58} label={yLabel(unit)} />
          <Tooltip formatter={(v) => `${fmt(v)} ${unit}`} />
          <Legend {...scenarioLegend} />
          <Line type="monotone" dataKey="actual" name={t("observed")} stroke="#1f6b35" strokeWidth={3} dot={false} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="rcp45" name="RCP4.5" stroke="#2bb6d8" strokeWidth={1.8} strokeOpacity={0.72} strokeDasharray="5 4" dot={false} activeDot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="rcp85" name="RCP8.5" stroke="#d6453d" strokeWidth={1.8} strokeOpacity={0.72} strokeDasharray="5 4" dot={false} activeDot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
