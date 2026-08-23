// Shared primitives for the water-dataset charts (water level, water
// temperature, salinity, TDS, conductivity). Those five specs reuse the same
// handful of operations — parse, rank, fit, judge a year complete — and letting
// each chart carry its own copy is how two charts end up disagreeing about
// which years are partial.

export function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

// Daily records are { d: "YYYY-MM-DD", v, lo, hi }; hourly ones carry
// "YYYY-MM-DDTHH:00" in the same field. Both arrive sorted by construction, but
// an imported workbook can merge two files, so sort defensively.
export function readSeries(records, { field = "v" } = {}) {
  if (!Array.isArray(records)) return [];
  return records
    .map((row) => {
      const value = parseValue(row?.[field]) ?? parseValue(row?.v);
      return { key: String(row?.d ?? ""), value };
    })
    .filter((row) => /^\d{4}-\d{2}-\d{2}/.test(row.key) && row.value != null)
    .sort((a, b) => a.key.localeCompare(b.key));
}

export const yearOf = (key) => Number(key.slice(0, 4));

// Linear-interpolated percentile of an unsorted sample, matching the
// convention numpy.percentile uses so the numbers here can be checked against
// the Python prototypes the chart specs were written from.
export function percentile(values, rank) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const position = (rank / 100) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function dayOfYear(key) {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

// A calendar year counts as complete when the record reaches into the first
// week of January and the last week of December. The strict "starts 1 Jan, ends
// 31 Dec" test would mark a year partial over a single missing New Year's Day
// reading, which is not what the flag is there to warn about.
export function yearCoverage(rows) {
  const byYear = new Map();
  for (const row of rows) {
    const year = yearOf(row.key);
    const bucket = byYear.get(year) ?? { year, first: row.key, last: row.key, days: new Set() };
    if (row.key < bucket.first) bucket.first = row.key;
    if (row.key > bucket.last) bucket.last = row.key;
    bucket.days.add(row.key.slice(0, 10));
    byYear.set(year, bucket);
  }
  const coverage = new Map();
  for (const bucket of byYear.values()) {
    coverage.set(bucket.year, {
      year: bucket.year,
      first: bucket.first.slice(0, 10),
      last: bucket.last.slice(0, 10),
      observedDays: bucket.days.size,
      partial: dayOfYear(bucket.first) > 7 || dayOfYear(bucket.last) < 359,
    });
  }
  return coverage;
}

// Ordinary least squares of y on x, plus the pieces a prediction interval needs.
export function linearFit(points) {
  const n = points.length;
  if (n < 2) return null;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (const p of points) {
    sxx += (p.x - meanX) ** 2;
    sxy += (p.x - meanX) * (p.y - meanY);
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  let residual = 0;
  for (const p of points) residual += (p.y - (intercept + slope * p.x)) ** 2;
  // two parameters are estimated, so the residual variance loses two degrees of
  // freedom; with n = 2 the fit is exact and there is no spread to report
  const standardError = n > 2 ? Math.sqrt(residual / (n - 2)) : 0;
  return { slope, intercept, meanX, sxx, standardError, n, at: (x) => intercept + slope * x };
}

// Midnight ticks across an event window. Left to itself, a recharts numeric
// axis with a dataKey puts one tick on every sample — 80-odd of them for a
// ten-day window at hourly resolution — and only hides the overlap by
// measuring rendered text. Handing it explicit day boundaries is both
// deterministic and legible.
export function dayTicks(startMs, endMs, maxTicks = 8) {
  const first = new Date(startMs);
  first.setHours(0, 0, 0, 0);
  const days = [];
  for (let time = first.getTime(); time <= endMs; time += 86400000) {
    if (time >= startMs) days.push(time);
  }
  if (days.length <= maxTicks) return days;
  const stride = Math.ceil(days.length / maxTicks);
  return days.filter((_, index) => index % stride === 0);
}
