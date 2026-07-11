import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";

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

const chartMargin = { top: 8, right: 18, left: 18, bottom: 28 };

function mean(values) {
  const nums = values.filter((v) => v != null && Number.isFinite(Number(v)));
  if (!nums.length) return null;
  return nums.reduce((s, v) => s + Number(v), 0) / nums.length;
}

// Dashed horizontal line marking the average of the plotted values. Plain
// function (not a component) so Recharts receives a real ReferenceLine child.
function meanLine(value, t, unit) {
  if (value == null) return null;
  return (
    <ReferenceLine
      y={value}
      stroke="#64748b"
      strokeDasharray="6 4"
      strokeWidth={1.2}
      label={{
        value: `${t("mean")}: ${fmt(value)} ${unit}`,
        position: "insideTopRight",
        fill: AXIS,
        fontSize: 11,
        fontWeight: 600,
      }}
    />
  );
}

export function ClimatologyChart({ series, t, unit, isSum }) {
  const data = (series.climatology || []).map((c) => ({
    month: t("months")[c.month - 1],
    v: c.v,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} label={xLabel(t("month"))} />
        <YAxis tick={{ fontSize: 12 }} width={58} label={yLabel(unit)} />
        <Tooltip formatter={(v) => [`${fmt(v)} ${unit}`, isSum ? t("total") : t("mean")]} />
        {meanLine(mean(data.map((d) => d.v)), t, unit)}
        <Bar dataKey="v" fill={GREEN} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EvolutionChart({ series, t, unit, isSum, color = BLUE }) {
  const data = (series.monthly || []).map((m) => ({ m: m.m, v: m.v }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={28} label={xLabel(t("month"))} />
        <YAxis tick={{ fontSize: 12 }} width={58} label={yLabel(unit)} />
        <Tooltip formatter={(v) => [`${fmt(v)} ${unit}`, isSum ? t("total") : t("mean")]} />
        {meanLine(mean(data.map((d) => d.v)), t, unit)}
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2.8} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AnomaliesChart({ series, t, unit }) {
  const clim = {};
  (series.climatology || []).forEach((c) => (clim[c.month] = c.v));
  const data = (series.monthly || []).map((m) => {
    const month = Number(m.m.slice(5, 7));
    const base = clim[month];
    return { m: m.m, anom: base != null && m.v != null ? +(m.v - base).toFixed(3) : null };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={28} label={xLabel(t("month"))} />
        <YAxis tick={{ fontSize: 12 }} width={58} label={yLabel(unit)} />
        <Tooltip formatter={(v) => [`${v > 0 ? "+" : ""}${fmt(v)} ${unit}`, v >= 0 ? t("anomalyAbove") : t("anomalyBelow")]} />
        <ReferenceLine y={0} stroke="#9ca3af" />
        {meanLine(mean(data.map((d) => d.anom)), t, unit)}
        <Bar dataKey="anom">
          {data.map((d, i) => (
            <Cell key={i} fill={d.anom >= 0 ? RED : BLUE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DailyChart({ series, t, unit, isSum, color = GREEN_DARK }) {
  const data = (series.daily || []).map((d) => ({
    d: d.d,
    v: d.v,
    lo: d.lo ?? d.v,
    hi: d.hi ?? null,
    band: d.hi != null && d.lo != null ? +(d.hi - d.lo).toFixed(3) : 0,
  }));

  function DailyTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    const hasRange = row.lo != null && row.hi != null;
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #d9e2ec",
          borderRadius: 6,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.14)",
          color: "#1f2937",
          fontSize: 12,
          lineHeight: 1.4,
          padding: "8px 10px",
          pointerEvents: "none",
        }}
      >
        <p style={{ fontWeight: 700, margin: "0 0 6px" }}>{label}</p>
        <p style={{ margin: "2px 0" }}>{isSum ? t("total") : t("mean")}: {fmt(row.v)} {unit}</p>
        {hasRange && <p style={{ margin: "2px 0" }}>{t("min")}: {fmt(row.lo)} {unit}</p>}
        {hasRange && <p style={{ margin: "2px 0" }}>{t("max")}: {fmt(row.hi)} {unit}</p>}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="d" tick={{ fontSize: 11 }} minTickGap={40} label={xLabel(t("date"))} />
        <YAxis tick={{ fontSize: 12 }} width={58} label={yLabel(unit)} />
        <Tooltip content={<DailyTooltip />} />
        {meanLine(mean(data.map((d) => d.v)), t, unit)}
        {!isSum && <Area dataKey="lo" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />}
        {!isSum && <Area dataKey="band" stackId="band" stroke="none" fill={color} fillOpacity={0.12} isAnimationActive={false} />}
        {isSum ? (
          <Bar dataKey="v" fill={color} />
        ) : (
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
