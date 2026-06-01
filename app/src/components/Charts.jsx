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

function fmt(v, digits = 2) {
  return v == null ? "—" : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });
}

// -- 1. Monthly climatology (month-of-year profile) ------------------------
export function ClimatologyChart({ series, t, unit, isSum }) {
  const data = (series.climatology || []).map((c) => ({
    month: t("months")[c.month - 1],
    v: c.v,
  }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={44} />
        <Tooltip formatter={(v) => [`${fmt(v)} ${unit}`, isSum ? t("total") : t("mean")]} />
        <Bar dataKey="v" fill={GREEN} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// -- 2. Historical evolution (monthly mean/total over time) ----------------
export function EvolutionChart({ series, t, unit, isSum, color = BLUE }) {
  const data = (series.monthly || []).map((m) => ({ m: m.m, v: m.v }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
        <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={28} />
        <YAxis tick={{ fontSize: 12 }} width={44} />
        <Tooltip formatter={(v) => [`${fmt(v)} ${unit}`, isSum ? t("total") : t("mean")]} />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// -- 3. Monthly anomalies (deviation from climatological monthly mean) -------
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
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
        <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={28} />
        <YAxis tick={{ fontSize: 12 }} width={44} />
        <Tooltip formatter={(v) => [`${v > 0 ? "+" : ""}${fmt(v)} ${unit}`, v >= 0 ? t("anomalyAbove") : t("anomalyBelow")]} />
        <ReferenceLine y={0} stroke="#9ca3af" />
        <Bar dataKey="anom">
          {data.map((d, i) => (
            <Cell key={i} fill={d.anom >= 0 ? RED : BLUE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// -- 4. Daily detail with min–max band -------------------------------------
export function DailyChart({ series, t, unit, isSum, color = GREEN_DARK }) {
  // band = [lo, hi-lo] stacked area trick
  const data = (series.daily || []).map((d) => ({
    d: d.d,
    v: d.v,
    lo: d.lo ?? d.v,
    band: d.hi != null && d.lo != null ? +(d.hi - d.lo).toFixed(3) : 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
        <XAxis dataKey="d" tick={{ fontSize: 11 }} minTickGap={40} />
        <YAxis tick={{ fontSize: 12 }} width={44} />
        <Tooltip
          formatter={(v, name) => (name === "v" ? [`${fmt(v)} ${unit}`, isSum ? t("total") : t("mean")] : null)}
          labelStyle={{ fontWeight: 600 }}
        />
        {!isSum && <Area dataKey="lo" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />}
        {!isSum && <Area dataKey="band" stackId="band" stroke="none" fill={color} fillOpacity={0.12} isAnimationActive={false} />}
        {isSum ? (
          <Bar dataKey="v" fill={color} />
        ) : (
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
