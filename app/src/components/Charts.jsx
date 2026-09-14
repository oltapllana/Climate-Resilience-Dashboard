import ChartFrame from "./ChartFrame.jsx";
import { useId } from "react";
import {
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { effectiveClimatology, monthlyAnomalies } from "../lib/climatology.js";
import { COMPASS_TICKS, axisScale, circularMeanDeg, compassLabel, formatForAxis } from "../lib/chartAxis.js";
import { EdgeLabel } from "./chartLabels.jsx";

import { CHART_PALETTE, REFERENCE_DASH } from "../lib/chartPalette.js";

const GREEN = "#4a9d4a";
const GREEN_DARK = "#2f7d32";
const BLUE = CHART_PALETTE.rainfall;
const RED = "#d6453d";
const AXIS = "#475569";
const GRID = "#edf2f7";

function fmt(t, v, digits = 2) {
  return v == null ? "-" : t.number(Number(v), { maximumFractionDigits: digits });
}

function measurementAxis(unit, t) {
  const key = {
    "Â°C": "measurementAxisTemperature",
    "%": "measurementAxisHumidity",
    "mm/h": "measurementAxisRainIntensity",
    mm: "measurementAxisRainfall",
    m: "measurementAxisWaterLevel",
    hPa: "measurementAxisPressure",
    "W/mÂ²": "measurementAxisSolar",
    "m/s": "measurementAxisWindSpeed",
    "Â°": "measurementAxisWindDirection",
  }[unit];
  const label = key ? t(key) : t("measurementAxisValue");
  return unit && !key ? `${label} (${unit})` : label;
}

function yLabel(unit, t) {
  return {
    value: measurementAxis(unit, t),
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

const chartMargin = { top: 8, right: 18, left: 18, bottom: 28 };

// Keeps the first and last category off the plot edge, so their labels are not
// half-drawn over the y axis and its ticks.
const edgePadding = { left: 16, right: 16 };

function mean(values) {
  const nums = values.filter((v) => v != null && Number.isFinite(Number(v)));
  if (!nums.length) return null;
  return nums.reduce((s, v) => s + Number(v), 0) / nums.length;
}

// The ETL vector-averages wind direction; the chart layer did not, so the line
// marked "Mean: 166Â°" on the direction panels was an ordinary average of
// bearings â€” the average of 1Â° and 359Â° computed as 180Â°, the opposite way.
function seriesMean(values, circular) {
  return circular ? circularMeanDeg(values) : mean(values);
}

// A bearing axis always spans the full circle and is read in compass points, so
// that a month averaging 2Â° and a month averaging 358Â° both read as north
// instead of landing at opposite ends of the axis.
const COMPASS_SCALE = { domain: [0, 360], ticks: COMPASS_TICKS, decimals: 0 };

function scaleFor(values, options) {
  return options.circular ? COMPASS_SCALE : axisScale(values, options);
}

function tickFor(t, scale, circular) {
  return circular ? compassLabel : (value) => formatForAxis(value, scale.decimals, t.locale);
}

// Dashed horizontal line marking the average of the plotted values. Plain
// function (not a component) so Recharts receives a real ReferenceLine child.
function meanLine(value, t, unit, decimals = 2, format = (v, d) => formatForAxis(v, d, t.locale)) {
  if (value == null) return null;
  return (
    <ReferenceLine
      y={value}
      stroke={CHART_PALETTE.reference}
      strokeDasharray={REFERENCE_DASH}
      strokeWidth={1.2}
      // "insideTopRight" let Recharts draw the text past the plot edge, and
      // every panel in the review lost the end of its own number.
      label={<EdgeLabel text={`${t("mean")}: ${format(value, decimals)} ${unit}`} topLimit={chartMargin.top + 11} />}
    />
  );
}

// Recharts' own legend sits under the plot by default; the review asked for it
// above the drawing so it is read before the lines rather than after them.
const legendStyle = { fontSize: 12, paddingBottom: 6 };

// A note under a chart whose baseline is not zero. Truncating an axis is the
// right call when the signal is a 5 hPa wobble around 930, but it has to be
// said out loud rather than left for the reader to notice.
function AxisNote({ show, t }) {
  if (!show) return null;
  return <p className="chart-axis-note">{t("axisTruncatedNote")}</p>;
}

export function ClimatologyChart({ series, t, unit, isSum }) {
  const estimatedPattern = useId().replaceAll(":", "");
  // effectiveClimatology fills months the record only covers partially with a
  // pro-rated estimate (flagged est) â€” drawn as lighter bars
  const data = effectiveClimatology(series).map((c) => ({
    month: t("months")[c.month - 1],
    v: c.v,
    est: !!c.est,
    available: c.available,
  }));

  // A bar of a monthly *total* has to grow from zero â€” its length is the
  // quantity. A bar of a monthly *mean* that sits at 930 hPa does not: framed
  // from zero, twelve months of pressure or humidity look identical.
  const circular = !!series.circular;
  const scale = scaleFor(data.map((d) => d.v), { unit, includeZero: isSum, circular });
  const truncated = !circular && scale.domain[0] > 0;
  const tickFormat = tickFor(t, scale, circular);

  return (
    <>
      <ChartFrame t={t} rows={data} columns={[{"key":"month","label":"Month"},{"key":"v","label":"Value"},{"key":"est","label":"Estimated"},{"key":"available","label":"Available"},{key:"unit",label:"Unit",value:()=>unit}]} indicator="monthly-climatology" width="100%" height={250}>
        {/* A bar cannot carry a bearing: a month averaging north sits at 0,
            which draws as no bar at all. Direction gets markers on a compass
            axis instead, and the rose above is the chart that reads properly. */}
        <ComposedChart data={data} margin={chartMargin}>
          <defs><pattern id={estimatedPattern} width="7" height="7" patternUnits="userSpaceOnUse">
            <rect width="7" height="7" fill={unit === "mm" || unit === "mm/h" ? BLUE : GREEN_DARK} />
            <path d="M-1 1L1 -1M0 7L7 0M6 8L8 6" stroke="white" strokeWidth="2" />
          </pattern></defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="month" interval={0} tickFormatter={label => `${data.find(row => row.month === label)?.available ? "" : "× "}${label}`} tick={{ fontSize: 12 }} padding={edgePadding} label={xLabel(t("month"))} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={58}
            domain={scale.domain}
            ticks={scale.ticks}
            tickFormatter={tickFormat}
            allowDataOverflow
            label={yLabel(unit, t)}
          />
          <Tooltip
            filterNull={false}
            formatter={(v) => [v == null ? t("chartMissingValue") : `${fmt(t, v)} ${unit}`, isSum ? t("total") : t("mean")]}
            labelFormatter={(label, payload) =>
              payload?.[0]?.payload?.est ? `${label} ${t("estMonthNote")}` : label
            }
          />
          <Legend verticalAlign="top" height={26} wrapperStyle={legendStyle} />
          {circular ? (
            <Line
              type="monotone"
              dataKey="v"
              name={t("monthlyValueLegend")}
              stroke="none"
              dot={{ r: 4, fill: GREEN }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          ) : (
            <Bar
              dataKey="v"
              name={isSum ? t("monthlyTotalLegend") : t("monthlyValueLegend")}
              fill={unit === "mm" || unit === "mm/h" ? CHART_PALETTE.rainfall : GREEN}
              radius={[4, 4, 0, 0]}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.est ? `url(#${estimatedPattern})` : undefined} />
              ))}
            </Bar>
          )}
          {/* last child on purpose: Recharts paints in JSX order, so
              the mean line and its label sit on top of the series
              rather than behind it */}
          {meanLine(seriesMean(data.map((d) => d.v), circular), t, unit, scale.decimals, circular ? compassLabel : undefined)}
        </ComposedChart>
      </ChartFrame>
      {data.some(row => !row.available) && <p className="chart-axis-note">{t("missingMonthNote")}</p>}
      {data.some((row) => row.est) && <p className="chart-axis-note">{t("estimatedBarsNote")}</p>}
      <AxisNote show={truncated} t={t} />
      {circular && <p className="chart-axis-note">{t("directionRoseHint")} {t("circularMeanNote")}</p>}
    </>
  );
}

export function EvolutionChart({ series, t, unit, isSum, color = BLUE }) {
  const data = (series.monthly || []).map((m) => ({ m: m.m, v: m.v }));
  const circular = !!series.circular;
  const scale = scaleFor(data.map((d) => d.v), { unit, includeZero: isSum, circular });
  const truncated = !circular && scale.domain[0] > 0;
  const tickFormat = tickFor(t, scale, circular);

  return (
    <>
      <ChartFrame t={t} rows={data} columns={[{"key":"m","label":"Month"},{"key":"v","label":"Value"},{key:"unit",label:"Unit",value:()=>unit}]} indicator="monthly-evolution" width="100%" height={250}>
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={28} padding={edgePadding} label={xLabel(t("month"))} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={58}
            domain={scale.domain}
            ticks={scale.ticks}
            tickFormatter={tickFormat}
            allowDataOverflow
            label={yLabel(unit, t)}
          />
          <Tooltip formatter={(v) => [`${fmt(t, v)} ${unit}`, isSum ? t("total") : t("mean")]} />
          <Legend verticalAlign="top" height={26} wrapperStyle={legendStyle} />
          <Line
            type="monotone"
            dataKey="v"
            name={isSum ? t("monthlyTotalLegend") : t("monthlyValueLegend")}
            stroke={unit === "mm" || unit === "mm/h" ? CHART_PALETTE.rainfall : color}
            strokeWidth={2.8}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {/* last child on purpose: Recharts paints in JSX order, so
              the mean line and its label sit on top of the series
              rather than behind it */}
          {meanLine(seriesMean(data.map((d) => d.v), circular), t, unit, scale.decimals, circular ? compassLabel : undefined)}
        </LineChart>
      </ChartFrame>
      <AxisNote show={truncated} t={t} />
      {circular && <p className="chart-axis-note">{t("circularMeanNote")}</p>}
    </>
  );
}

export function AnomaliesChart({ series, t, unit }) {
  const data = monthlyAnomalies(series);
  if (!data.some(row => row.available)) {
    return <p className="chart-axis-note">{t("anomaliesRequiresYears").replace("{n}", 2)}</p>;
  }

  // An anomaly is a signed departure, so the axis has to be free to go negative
  // whatever the unit is, and it reads honestly only when the two directions
  // get the same amount of room.
  const scale = axisScale(data.map((d) => d.anom), { symmetric: true, allowNegative: true });

  // The review asked for the standout months to be named rather than left for
  // the reader to find: the -8 hPa spike at the start of 2026 was the single
  // most conspicuous thing on the pressure panel and nothing said what it was.
  const observed = data.filter((d) => d.anom != null);
  const strongestUp = observed.reduce((best, d) => (best == null || d.anom > best.anom ? d : best), null);
  const strongestDown = observed.reduce((best, d) => (best == null || d.anom < best.anom ? d : best), null);
  const signed = (value) => `${value > 0 ? "+" : ""}${formatForAxis(value, scale.decimals, t.locale)} ${unit}`;
  // "2026-02" is a key, not a date a reader says out loud
  const monthName = (key) => {
    const index = Number(String(key).slice(5, 7)) - 1;
    const name = t("months")[index];
    return name ? `${name} ${String(key).slice(0, 4)}` : key;
  };

  return (
    <>
    <ChartFrame t={t} rows={data} columns={[{"key":"m","label":"Month"},{"key":"anom","label":"Anomaly"},{"key":"available","label":"Available"},{"key":"referenceYears","label":"Reference years"},{"key":"partial","label":"Partial month"},{key:"unit",label:"Unit",value:()=>unit}]} indicator="monthly-anomalies" width="100%" height={250}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={28} padding={edgePadding} label={xLabel(t("month"))} />
        <YAxis
          tick={{ fontSize: 12 }}
          width={58}
          domain={scale.domain}
          ticks={scale.ticks}
          tickFormatter={(v) => formatForAxis(v, scale.decimals, t.locale)}
          allowDataOverflow
          label={yLabel(unit, t)}
        />
        <Tooltip formatter={(v) => [`${v > 0 ? "+" : ""}${fmt(t, v)} ${unit}`, v >= 0 ? t("anomalyAbove") : t("anomalyBelow")]} />
        <Legend
          verticalAlign="top"
          height={26}
          wrapperStyle={legendStyle}
          payload={[
            { value: t("anomalyAboveLegend"), type: "square", color: RED, id: "above" },
            { value: t("anomalyBelowLegend"), type: "square", color: BLUE, id: "below" },
          ]}
        />
        <ReferenceLine y={0} stroke="#9ca3af" />
        <Bar dataKey="anom">
          {data.map((d, i) => (
            <Cell key={i} fill={d.anom >= 0 ? RED : BLUE} />
          ))}
        </Bar>
        {/* last child on purpose: Recharts paints in JSX order, so
            the mean line and its label sit on top of the series
            rather than behind it */}
        {meanLine(mean(data.map((d) => d.anom)), t, unit, scale.decimals)}
      </BarChart>
    </ChartFrame>
      {data.some(row => !row.available) && <p className="chart-axis-note">{t("anomaliesRequiresYears").replace("{n}", 2)}</p>}
      {strongestUp && strongestDown && (
        <p className="chart-axis-note">
          {t("largestAnomalies")
            .replace("{up}", signed(strongestUp.anom))
            .replace("{upMonth}", monthName(strongestUp.m))
            .replace("{down}", signed(strongestDown.anom))
            .replace("{downMonth}", monthName(strongestDown.m))}
        </p>
      )}
    </>
  );
}

export function WindRoseChart({ series, t, color = GREEN_DARK }) {
  // Wind speed distribution by speed categories
  if (!series.daily || !series.daily.length) return null;

  const speedBins = { calm: 0, s1: 0, s2: 0, s3: 0, s4: 0, s5: 0 };
  (series.daily || []).forEach((d) => {
    const speed = Number(d.v) || 0;
    if (speed < 0.5) speedBins.calm++;
    else if (speed < 3) speedBins.s1++;
    else if (speed < 5) speedBins.s2++;
    else if (speed < 7) speedBins.s3++;
    else if (speed < 10) speedBins.s4++;
    else speedBins.s5++;
  });

  const data = [
    { name: "Calm", value: speedBins.calm, fill: "#f0f0f0" },
    { name: "0-3 m/s", value: speedBins.s1, fill: "#d1f5ff" },
    { name: "3-5 m/s", value: speedBins.s2, fill: "#7ed321" },
    { name: "5-7 m/s", value: speedBins.s3, fill: "#ffc53d" },
    { name: "7-10 m/s", value: speedBins.s4, fill: "#ff85c0" },
    { name: ">10 m/s", value: speedBins.s5, fill: "#f5222d" },
  ];

  return (
    <ChartFrame t={t} rows={data} columns={[{"key":"name","label":"Speed category"},{"key":"value","label":"Days"}]} indicator="wind-speed-distribution" width="100%" height={250}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(value) => t.number(value)} tick={{ fontSize: 12 }} width={58} />
        <Tooltip formatter={(v) => [`${v} days`, "Count"]} />
        <Bar dataKey="value" fill={color}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
