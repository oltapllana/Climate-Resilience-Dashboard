// Statistical projection from observed sensor data.
//
// IMPORTANT: we do NOT have IPCC climate-model output. We only have a few years
// of local sensor measurements. So "RCP4.5 / RCP8.5" here are SIMPLIFIED
// scenarios built by extrapolating the observed annual trend forward, with a
// stronger multiplier for the high-emission pathway. This mirrors the visual
// style of the reference dashboard but is an illustrative statistical
// projection, not a climate model. Adjust the factors below as needed.

export const SCENARIOS = {
  rcp85: { factor: 1.8, label: "RCP8.5" }, // worst-case (high emissions) — the headline scenario
  rcp45: { factor: 1.0, label: "RCP4.5" },
  all: { factor: 1.4, label: "All scenarios" }, // median-ish of the two
};

// Future periods. The historic line is the period of record (~2021–2026); the
// projection fans out across three near-term bands up to 2050, per the project
// spec (2026–2030 / 2031–2040 / 2041–2050).
export const PERIODS = [
  { id: "p2030", midYear: 2028, label: "2026–2030", color: "#4a9d4a" },
  { id: "p2040", midYear: 2035, label: "2031–2040", color: "#e0a52b" },
  { id: "p2050", midYear: 2045, label: "2041–2050", color: "#d6453d" },
];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// ---- helpers --------------------------------------------------------------
function climMap(climatology) {
  const m = {};
  (climatology || []).forEach((c) => (m[c.month] = c.v));
  return m;
}

// annual aggregate from monthly series (mean for avg-kind, sum for sum-kind)
export function annualSeries(monthly, kind) {
  const byYear = {};
  (monthly || []).forEach((row) => {
    if (row.v == null) return;
    const y = Number(row.m.slice(0, 4));
    (byYear[y] = byYear[y] || []).push(row.v);
  });
  return Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b)
    .map((y) => {
      const arr = byYear[y];
      const v = kind === "sum" ? arr.reduce((a, b) => a + b, 0) : arr.reduce((a, b) => a + b, 0) / arr.length;
      return { year: y, v };
    });
}

// Deseasonalized trend (units per year). We subtract the climatological monthly
// value from each month (removing the seasonal cycle) and regress the resulting
// anomalies against decimal-year. This is robust to partial years / short
// records — a naive year-mean slope is biased when years are incomplete.
export function trendPerYear(monthly, climatology) {
  const cm = {};
  (climatology || []).forEach((c) => (cm[c.month] = c.v));
  const pts = [];
  (monthly || []).forEach((r) => {
    const mo = Number(r.m.slice(5, 7));
    if (r.v == null || cm[mo] == null) return;
    const x = Number(r.m.slice(0, 4)) + (mo - 0.5) / 12;
    pts.push([x, r.v - cm[mo]]);
  });
  const n = pts.length;
  if (n < 4) return 0;
  const mx = pts.reduce((a, p) => a + p[0], 0) / n;
  const my = pts.reduce((a, p) => a + p[1], 0) / n;
  let num = 0,
    den = 0;
  pts.forEach(([x, y]) => {
    num += (x - mx) * (y - my);
    den += (x - mx) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

// seasonal amplitude of the climatology — used to keep projections physically
// plausible (the projected delta is clamped to a fraction of this).
function climAmplitude(climatology) {
  const vs = (climatology || []).map((c) => c.v).filter((v) => v != null);
  if (!vs.length) return 1;
  const amp = Math.max(...vs) - Math.min(...vs);
  if (amp > 0) return amp;
  const mean = vs.reduce((a, b) => a + b, 0) / vs.length;
  return Math.max(Math.abs(mean), 1);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function periodOfRecord(monthly) {
  if (!monthly || !monthly.length) return { startYear: null, endYear: null, baseYear: null };
  const startYear = Number(monthly[0].m.slice(0, 4));
  const endYear = Number(monthly[monthly.length - 1].m.slice(0, 4));
  return { startYear, endYear, baseYear: Math.round((startYear + endYear) / 2) };
}

// ---- scenario monthly climatology (1..12 profile) -------------------------
// Returns { historicLabel, slope, lines: [{period, label, color, data:[{month,v}]}] }
export function scenarioClimatology(meas, scenario = "all") {
  const cm = climMap(meas.climatology);
  const slope = trendPerYear(meas.monthly, meas.climatology);
  const { startYear, endYear, baseYear } = periodOfRecord(meas.monthly);
  const factor = (SCENARIOS[scenario] || SCENARIOS.all).factor;

  // Total change reached at the farthest horizon (2100), capped to ~1/3 of the
  // seasonal amplitude so the projection stays physically believable; nearer
  // periods are weighted proportionally so the lines fan out progressively.
  const farYear = PERIODS[PERIODS.length - 1].midYear;
  const capFar = 0.35 * climAmplitude(meas.climatology);
  const fullChange = clamp(slope * factor * (farYear - baseYear), -capFar, capFar);

  const historic = {
    period: "historic",
    label: `${startYear}–${endYear}`,
    color: "#6b5bb5",
    data: MONTHS.map((mo) => ({ month: mo, v: cm[mo] ?? null })),
  };

  const projected = PERIODS.map((p) => {
    const weight = (p.midYear - baseYear) / (farYear - baseYear);
    const delta = fullChange * weight;
    return {
      period: p.id,
      label: p.label,
      color: p.color,
      data: MONTHS.map((mo) => ({
        month: mo,
        v: cm[mo] == null ? null : +(cm[mo] + delta).toFixed(3),
      })),
    };
  });

  return { historicLabel: `${startYear}–${endYear}`, slope, baseYear, lines: [historic, ...projected] };
}

// ---- short-term forecast: next N months -----------------------------------
// Builds recent history + a forecast for each scenario, using the
// climatological value of each upcoming calendar month plus the trend offset.
export function forecast(meas, nMonths = 5, historyMonths = 30) {
  const cm = climMap(meas.climatology);
  const slope = trendPerYear(meas.monthly, meas.climatology);
  const { baseYear } = periodOfRecord(meas.monthly);
  const cap = 0.5 * climAmplitude(meas.climatology);

  const monthly = meas.monthly || [];
  const history = monthly.slice(-historyMonths).map((r) => ({ m: r.m, actual: r.v }));

  if (!monthly.length) return { rows: [], slope };

  // start from the last recorded month
  const last = monthly[monthly.length - 1].m;
  let y = Number(last.slice(0, 4));
  let mo = Number(last.slice(5, 7));

  const future = [];
  for (let i = 0; i < nMonths; i++) {
    mo += 1;
    if (mo > 12) {
      mo = 1;
      y += 1;
    }
    const base = cm[mo];
    const yearsAhead = y + (mo - 1) / 12 - baseYear;
    const mk = (factor) =>
      base == null ? null : +(base + clamp(slope * factor * yearsAhead, -cap, cap)).toFixed(3);
    future.push({
      m: `${y}-${String(mo).padStart(2, "0")}`,
      rcp45: mk(SCENARIOS.rcp45.factor),
      rcp85: mk(SCENARIOS.rcp85.factor),
    });
  }

  // stitch: history rows + forecast rows on a shared month axis
  const rows = [
    ...history.map((h) => ({ m: h.m, actual: h.actual })),
    // bridge point so the dashed forecast connects to the last actual
    ...(history.length
      ? [{ m: history[history.length - 1].m, actual: history[history.length - 1].actual, rcp45: history[history.length - 1].actual, rcp85: history[history.length - 1].actual }]
      : []),
    ...future,
  ];
  return { rows, slope, future };
}
