import {
  ResponsiveContainer,
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
import { effectiveClimatology } from "../lib/climatology.js";
import { COMPASS_TICKS, axisScale, circularMeanDeg, compassLabel, formatForAxis } from "../lib/chartAxis.js";
import { EdgeLabel } from "./chartLabels.jsx";

const GREEN = "#4a9d4a";
const GREEN_DARK = "#2f7d32";
const BLUE = "#2b7fc4";
const RED = "#d6453d";
const AXIS = "#475569";
const GRID = "#edf2f7";

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

const chartMargin = { top: 8, right: 18, left: 18, bottom: 28 };

function mean(values) {
  const nums = values.filter((v) => v != null && Number.isFinite(Number(v)));
  if (!nums.length) return null;
  return nums.reduce((s, v) => s + Number(v), 0) / nums.length;
}

// The ETL vector-averages wind direction; the chart layer did not, so the line
// marked "Mean: 166°" on the direction panels was an ordinary average of
// bearings — the average of 1° and 359° computed as 180°, the opposite way.
function seriesMean(values, circular) {
  return circular ? circularMeanDeg(values) : mean(values);
}

// A bearing axis always spans the full circle and is read in compass points, so
// that a month averaging 2° and a month averaging 358° both read as north
// instead of landing at opposite ends of the axis.
const COMPASS_SCALE = { domain: [0, 360], ticks: COMPASS_TICKS, decimals: 0 };

function scaleFor(values, options) {
  return options.circular ? COMPASS_SCALE : axisScale(values, options);
}

function tickFor(scale, circular) {
  return circular ? compassLabel : (value) => formatForAxis(value, scale.decimals);
}

// Dashed horizontal line marking the average of the plotted values. Plain
// function (not a component) so Recharts receives a real ReferenceLine child.
function meanLine(value, t, unit, decimals = 2, format = formatForAxis) {
  if (value == null) return null;
  return (
    <ReferenceLine
      y={value}
      stroke="#64748b"
      strokeDasharray="6 4"
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
  // effectiveClimatology fills months the record only covers partially with a
  // pro-rated estimate (flagged est) — drawn as lighter bars
  const data = effectiveClimatology(series).map((c) => ({
    month: t("months")[c.month - 1],
    v: c.v,
    est: !!c.est,
  }));

  // A bar of a monthly *total* has to grow from zero — its length is the
  // quantity. A bar of a monthly *mean* that sits at 930 hPa does not: framed
  // from zero, twelve months of pressure or humidity look identical.
  const circular = !!series.circular;
  const scale = scaleFor(data.map((d) => d.v), { unit, includeZero: isSum, circular });
  const truncated = !circular && scale.domain[0] > 0;
  const tickFormat = tickFor(scale, circular);

  return (
    <>
      <ResponsiveContainer width="100%" height={250}>
        {/* A bar cannot carry a bearing: a month averaging north sits at 0,
            which draws as no bar at all. Direction gets markers on a compass
            axis instead, and the rose above is the chart that reads properly. */}
        <ComposedChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} label={xLabel(t("month"))} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={58}
            domain={scale.domain}
            ticks={scale.ticks}
            tickFormatter={tickFormat}
            allowDataOverflow
            label={yLabel(unit)}
          />
          <Tooltip
            formatter={(v) => [`${fmt(v)} ${unit}`, isSum ? t("total") : t("mean")]}
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
              fill={GREEN}
              radius={[4, 4, 0, 0]}
            >
              {data.map((d, i) => (
                <Cell key={i} fillOpacity={d.est ? 0.45 : 1} />
              ))}
            </Bar>
          )}
          {/* last child on purpose: Recharts paints in JSX order, so
              the mean line and its label sit on top of the series
              rather than behind it */}
          {meanLine(seriesMean(data.map((d) => d.v), circular), t, unit, scale.decimals, circular ? compassLabel : undefined)}
        </ComposedChart>
      </ResponsiveContainer>
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
  const tickFormat = tickFor(scale, circular);

  return (
    <>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={28} label={xLabel(t("month"))} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={58}
            domain={scale.domain}
            ticks={scale.ticks}
            tickFormatter={tickFormat}
            allowDataOverflow
            label={yLabel(unit)}
          />
          <Tooltip formatter={(v) => [`${fmt(v)} ${unit}`, isSum ? t("total") : t("mean")]} />
          <Legend verticalAlign="top" height={26} wrapperStyle={legendStyle} />
          <Line
            type="monotone"
            dataKey="v"
            name={isSum ? t("monthlyTotalLegend") : t("monthlyValueLegend")}
            stroke={color}
            strokeWidth={2.8}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {/* last child on purpose: Recharts paints in JSX order, so
              the mean line and its label sit on top of the series
              rather than behind it */}
          {meanLine(seriesMean(data.map((d) => d.v), circular), t, unit, scale.decimals, circular ? compassLabel : undefined)}
        </LineChart>
      </ResponsiveContainer>
      <AxisNote show={truncated} t={t} />
      {circular && <p className="chart-axis-note">{t("circularMeanNote")}</p>}
    </>
  );
}

export function AnomaliesChart({ series, t, unit }) {
  const clim = {};
  (series.climatology || []).forEach((c) => (clim[c.month] = c.v));
  // a bearing 10° off a 350° normal is +20°, not -340°
  const wrap = (d) => ((d + 540) % 360) - 180;
  const data = (series.monthly || []).map((m) => {
    const month = Number(m.m.slice(5, 7));
    const base = clim[month];
    if (base == null || m.v == null) return { m: m.m, anom: null };
    const d = series.circular ? wrap(m.v - base) : m.v - base;
    // a partly observed month has a partly observed total: its "anomaly" would
    // just measure how much of the month the sensor was running
    return { m: m.m, anom: m.partial ? null : +d.toFixed(3) };
  });

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
  const signed = (value) => `${value > 0 ? "+" : ""}${formatForAxis(value, scale.decimals)} ${unit}`;
  // "2026-02" is a key, not a date a reader says out loud
  const monthName = (key) => {
    const index = Number(String(key).slice(5, 7)) - 1;
    const name = t("months")[index];
    return name ? `${name} ${String(key).slice(0, 4)}` : key;
  };

  return (
    <>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={28} label={xLabel(t("month"))} />
        <YAxis
          tick={{ fontSize: 12 }}
          width={58}
          domain={scale.domain}
          ticks={scale.ticks}
          tickFormatter={(v) => formatForAxis(v, scale.decimals)}
          allowDataOverflow
          label={yLabel(unit)}
        />
        <Tooltip formatter={(v) => [`${v > 0 ? "+" : ""}${fmt(v)} ${unit}`, v >= 0 ? t("anomalyAbove") : t("anomalyBelow")]} />
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
    </ResponsiveContainer>
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
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} width={58} />
        <Tooltip formatter={(v) => [`${v} days`, "Count"]} />
        <Bar dataKey="value" fill={color}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
