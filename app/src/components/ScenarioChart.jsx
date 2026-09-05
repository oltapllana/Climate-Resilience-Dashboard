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
  ReferenceLine,
} from "recharts";
import { scenarioClimatology, forecast, longTermProjection } from "../lib/projection.js";
import { axisScale, formatForAxis } from "../lib/chartAxis.js";
import { EdgeLabel } from "./chartLabels.jsx";

const AXIS = "#475569";
const GRID = "#edf2f7";
const scenarioChartMargin = { top: 6, right: 18, left: 18, bottom: 48 };
const scenarioLegend = {
  verticalAlign: "top",
  height: 30,
  iconType: "line",
  wrapperStyle: { fontSize: 12, fontWeight: 600, paddingBottom: 6 },
};

const scenarioName = (s, t) => (s === "all" ? t("allScenarios") : s === "rcp45" ? "RCP4.5" : "RCP8.5");

function fmt(v, digits = 2) {
  return v == null ? "-" : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function measurementAxis(unit) {
  if (unit === "°C") return "Temperature (°C)";
  if (unit === "%") return "Humidity (%)";
  if (unit === "mm/h") return "Rainfall Intensity (mm/h)";
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

function mean(values) {
  const nums = values.filter((v) => v != null && Number.isFinite(Number(v)));
  if (!nums.length) return null;
  return nums.reduce((s, v) => s + Number(v), 0) / nums.length;
}

function formatRecordStart(start, months) {
  if (!start) return null;
  const parts = String(start).slice(0, 10).split("-");
  if (parts.length < 2) return null;
  const year = parts[0];
  const monthIndex = Number(parts[1]) - 1;
  if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return year;
  return `${months[monthIndex]} ${year}`;
}

function annualTooltipLabel(label, payload, t, recordStart) {
  const row = payload?.[0]?.payload;
  if (!row?.partial || !recordStart) return label;
  return `${label} · ${t("partialDataNote").replace("{start}", recordStart)}`;
}

// Dashed horizontal line marking the average of the observed/historic series.
// Plain function (not a component) so Recharts receives a real ReferenceLine child.
// `what` names the series being averaged: "Mean: 11.59 °C" on a chart carrying
// four periods left the reader guessing which of them it belonged to.
function meanLine(value, t, unit, what, decimals = 2) {
  if (value == null) return null;
  return (
    <ReferenceLine
      y={value}
      stroke="#64748b"
      strokeDasharray="6 4"
      strokeWidth={1.2}
      label={<EdgeLabel text={`${what} ${t("mean").toLowerCase()}: ${formatForAxis(value, decimals)} ${unit}`} topLimit={scenarioChartMargin.top + 11} />}
    />
  );
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
    const row = { month: t("months")[i], est: scen.lines[0].data[i].est };
    scen.lines.forEach((ln) => (row[ln.period] = ln.data[i].v));
    return row;
  });

  // Averages of the observed/historic series (full record, unaffected by zoom).
  const histLine = scen.lines.find((ln) => ln.period === "historic") || scen.lines[0];
  const climAvg = mean(histLine.data.map((d) => d.v));
  const annualObserved = annual.rows.filter((r) => r.observed != null && !r.partial).map((r) => r.observed);
  const annualAvg = mean(annualObserved.length ? annualObserved : annual.rows.map((r) => r.observed));
  const fcAvg = mean(fc.rows.map((r) => r.actual));
  const recordStart = formatRecordStart(meas?.stats?.start, t("months"));

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

  // Every one of these three plots framed itself from zero, which left the
  // scenarios stacked in the top fifth of the chart and the differences between
  // them — the whole point of drawing both — too small to see.
  const climScale = axisScale(
    climData.flatMap((row) => scen.lines.map((ln) => row[ln.period])).concat(climAvg ?? []),
    { unit }
  );
  const annualScale = axisScale(
    annual.rows.flatMap((row) => [row.observed, row.observedPartial, row.rcp45, row.rcp85]).concat(annualAvg ?? []),
    { unit }
  );
  const fcScale = axisScale(
    fc.rows.flatMap((row) => [row.actual, row.rcp45, row.rcp85]).concat(fcAvg ?? []),
    { unit }
  );

  // The forecast rows carry a few months of projection at the end of a record
  // that runs for years; unmarked, the dashed lines read as missing rather than
  // as future. Shading the window says which part of the chart is a projection.
  const lastObservedMonth = fc.rows.filter((row) => row.actual != null).at(-1)?.m ?? null;
  const lastForecastMonth = fc.rows.at(-1)?.m ?? null;

  // "2021-06", "2021-10", ... at every gridline is unreadable; a year label at
  // each January and nothing in between carries the same information.
  const monthTick = (value) => (String(value).endsWith("-01") ? String(value).slice(0, 4) : "");

  const digits = unit === "mm" ? 0 : 1;

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
          <YAxis
            tick={{ fontSize: 12 }}
            width={58}
            domain={climScale.domain}
            ticks={climScale.ticks}
            tickFormatter={(v) => formatForAxis(v, climScale.decimals)}
            allowDataOverflow
            label={yLabel(unit)}
          />
          <Tooltip
            formatter={(v) => `${fmt(v)} ${unit}`}
            labelFormatter={(label, payload) =>
              payload?.[0]?.payload?.est ? `${label} ${t("estMonthNote")}` : label
            }
          />
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
              // no connectNulls: a station with a short record has no data at
              // all for some calendar months — bridging them would fabricate a
              // curve there. Small dots keep isolated months visible; hollow
              // dots mark months estimated from a partly observed month.
              dot={(props) => {
                const { cx, cy, payload, value, index } = props;
                if (cx == null || cy == null || value == null) return <g key={`d-${ln.period}-${index}`} />;
                const r = ln.period === "historic" ? 2.6 : 1.8;
                return payload.est ? (
                  <circle key={`d-${ln.period}-${index}`} cx={cx} cy={cy} r={r + 1.4} fill="#fff" stroke={ln.color} strokeWidth={1.6} />
                ) : (
                  <circle key={`d-${ln.period}-${index}`} cx={cx} cy={cy} r={r} fill={ln.color} />
                );
              }}
              activeDot={{ r: ln.period === "historic" ? 4 : 3 }}
            />
          ))}
          {/* last child on purpose: Recharts paints in JSX order, so
              the mean line and its label sit on top of the series
              rather than behind it */}
          {meanLine(climAvg, t, unit, t("historic"), digits)}
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
          <YAxis
            tick={{ fontSize: 12 }}
            width={58}
            domain={annualScale.domain}
            ticks={annualScale.ticks}
            tickFormatter={(v) => formatForAxis(v, annualScale.decimals)}
            allowDataOverflow
            label={yLabel(unit)}
          />
          <Tooltip formatter={(v) => `${fmt(v)} ${unit}`} labelFormatter={(label, payload) => annualTooltipLabel(label, payload, t, recordStart)} />
          <Legend {...scenarioLegend} />
          {annualZoom.refArea}
          <Line type="monotone" dataKey="observed" name={t("observed")} stroke="#6b5bb5" strokeWidth={3.2} dot={false} activeDot={{ r: 4 }} connectNulls />
          {/* A partly observed year is a hollow marker on its own, never a point
              on the observed line: four months of a Kosovo winter averaged as an
              annual mean is the "sharp fall in 2026" the review flagged. */}
          <Line
            type="monotone"
            dataKey="observedPartial"
            name={t("partialYear")}
            stroke="none"
            legendType="circle"
            dot={{ r: 4, fill: "#ffffff", stroke: "#6b5bb5", strokeWidth: 1.8 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line type="monotone" dataKey="rcp45" name="RCP4.5" stroke="#2bb6d8" strokeWidth={2.6} strokeDasharray="7 4" dot={false} activeDot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="rcp85" name="RCP8.5" stroke="#d6453d" strokeWidth={2.6} strokeDasharray="2 4" dot={false} activeDot={{ r: 3 }} connectNulls />
          {/* last child on purpose: Recharts paints in JSX order, so
              the mean line and its label sit on top of the series
              rather than behind it */}
          {meanLine(annualAvg, t, unit, t("observed"), digits)}
        </LineChart>
        </ResponsiveContainer>
        <p className="chart-axis-note">{t("projectionGapNote")}</p>
      </div>

      <div className="section-title">
        <h2>{t("forecastTitle")}</h2>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={fc.rows} margin={scenarioChartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          {/* one label per January rather than one per gridline */}
          <XAxis dataKey="m" tick={{ fontSize: 11 }} interval={0} tickFormatter={monthTick} label={xLabel(t("year"))} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={58}
            domain={fcScale.domain}
            ticks={fcScale.ticks}
            tickFormatter={(v) => formatForAxis(v, fcScale.decimals)}
            allowDataOverflow
            label={yLabel(unit)}
          />
          <Tooltip formatter={(v) => `${fmt(v)} ${unit}`} />
          <Legend {...scenarioLegend} />
          {/* the projected months are a sliver at the right-hand end of a
              multi-year record; shading them says so rather than leaving the
              two dashed lines looking like they failed to draw */}
          {lastObservedMonth && lastForecastMonth && (
            <ReferenceArea
              x1={lastObservedMonth}
              x2={lastForecastMonth}
              fill="#6b5bb5"
              fillOpacity={0.08}
              stroke="none"
              label={{ value: t("scenarioProjectedLabel"), position: "insideTop", fill: "#5b6b78", fontSize: 11, fontWeight: 600 }}
            />
          )}
          {lastObservedMonth && <ReferenceLine x={lastObservedMonth} stroke="#94a3b8" strokeDasharray="3 3" />}
          <Line type="monotone" dataKey="actual" name={t("observed")} stroke="#1f6b35" strokeWidth={3} dot={false} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="rcp45" name="RCP4.5" stroke="#2bb6d8" strokeWidth={2.6} strokeDasharray="7 4" dot={{ r: 2.4, fill: "#2bb6d8" }} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="rcp85" name="RCP8.5" stroke="#d6453d" strokeWidth={2.6} strokeDasharray="2 4" dot={{ r: 2.4, fill: "#d6453d" }} activeDot={{ r: 4 }} connectNulls />
          {/* last child on purpose: Recharts paints in JSX order, so
              the mean line and its label sit on top of the series
              rather than behind it */}
          {meanLine(fcAvg, t, unit, t("observed"), digits)}
        </LineChart>
      </ResponsiveContainer>

      <p className="cfg-hint">{t("projectionNote")}</p>
    </div>
  );
}
