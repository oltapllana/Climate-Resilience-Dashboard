// Shared hourly -> daily reduction for the temperature indicators. Daily min,
// mean and max all come from the same pass so the three temperature charts
// cannot disagree about what a given day recorded.
export function parseTimestamp(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const text = String(value).trim();
  if (!text) return null;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):?(\d{2})?(?::?(\d{2}))?)?/);
  if (!match) return null;
  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  const local = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return Number.isNaN(local.getTime()) ? null : local;
}

export function parseTemperature(value) {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function readHourly(hourlyRecords) {
  if (!Array.isArray(hourlyRecords)) return [];
  return hourlyRecords
    .map((row) => {
      const timestamp = parseTimestamp(row?.d ?? row?.timestamp ?? row?.ts ?? row?.date);
      const temperature = parseTemperature(row?.v ?? row?.value ?? row?.temp ?? row?.temperature);
      return timestamp && temperature != null ? { timestamp, temperature } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function toDaily(hourly) {
  const byDate = new Map();
  for (const row of hourly) {
    const date = localDate(row.timestamp);
    const current = byDate.get(date) ?? { date, min: Infinity, max: -Infinity, sum: 0, count: 0 };
    current.min = Math.min(current.min, row.temperature);
    current.max = Math.max(current.max, row.temperature);
    current.sum += row.temperature;
    current.count += 1;
    byDate.set(date, current);
  }
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, min, max, sum, count }) => ({
      date,
      min: +min.toFixed(2),
      max: +max.toFixed(2),
      mean: +(sum / count).toFixed(2),
      observations: count,
    }));
}

export function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function standardDeviation(values) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

// The 97.5th percentile of Student's t, so a two-sided 95 % interval can be
// formed without shipping a statistics library. Cornish-Fisher expansion around
// the normal quantile; well under a thousandth out for the tens of degrees of
// freedom a monthly record supplies.
function tCritical(df) {
  if (!(df > 0)) return null;
  const z = 1.959964;
  return (
    z +
    (z ** 3 + z) / (4 * df) +
    (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2) +
    (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / (384 * df ** 3)
  );
}

// Monthly anomalies are not independent draws: a warm month tends to follow a
// warm month, so the record carries fewer independent observations than it has
// points. Left uncorrected, the ordinary standard error of the slope is too
// small and a trend looks better established than the data can support. The
// usual remedy is to discount the sample by the lag-1 autocorrelation of the
// residuals, n_eff = n (1 - r1) / (1 + r1), and spend the degrees of freedom
// from that instead. Points must arrive in time order for the lag to mean
// anything, which is how the callers build them.
function effectiveSampleSize(residuals) {
  const n = residuals.length;
  if (n < 4) return { effective: n, lag1: 0 };
  let lagged = 0;
  let total = 0;
  for (let index = 0; index < n; index += 1) {
    total += residuals[index] ** 2;
    if (index > 0) lagged += residuals[index] * residuals[index - 1];
  }
  if (total === 0) return { effective: n, lag1: 0 };
  // negative autocorrelation would inflate the sample rather than discount it;
  // that is not a claim worth making, so it is floored at independence
  const lag1 = Math.min(Math.max(lagged / total, 0), 0.99);
  return { effective: Math.max(3, (n * (1 - lag1)) / (1 + lag1)), lag1 };
}

// Ordinary least squares against decimal year; returns the slope in units/year,
// with the interval that says whether the slope is separable from zero at all.
// R² answers a different question — how much of the scatter the line accounts
// for — and on a short record it can be tiny while the slope is still real, or
// respectable while the slope is not. The interval is the one to read first.
export function linearTrend(points) {
  if (points.length < 3) return { slopePerYear: null, intercept: null, r2: null, interval: null };
  const meanX = mean(points.map((point) => point.x));
  const meanY = mean(points.map((point) => point.y));
  let numerator = 0;
  let denominator = 0;
  for (const { x, y } of points) {
    numerator += (x - meanX) * (y - meanY);
    denominator += (x - meanX) ** 2;
  }
  if (denominator === 0) return { slopePerYear: null, intercept: null, r2: null, interval: null };
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  const totalSquares = points.reduce((sum, { y }) => sum + (y - meanY) ** 2, 0);
  const residuals = points.map(({ x, y }) => y - (slope * x + intercept));
  const residualSquares = residuals.reduce((sum, value) => sum + value ** 2, 0);
  return {
    slopePerYear: +slope.toFixed(4),
    intercept,
    r2: totalSquares === 0 ? null : +(1 - residualSquares / totalSquares).toFixed(3),
    interval: slopeInterval(slope, residuals, residualSquares, denominator),
  };
}

function slopeInterval(slope, residuals, residualSquares, sxx) {
  const { effective, lag1 } = effectiveSampleSize(residuals);
  const df = effective - 2;
  const critical = tCritical(df);
  if (!(df > 0) || critical == null || residualSquares === 0) return null;
  const standardError = Math.sqrt(residualSquares / df / sxx);
  const margin = critical * standardError;
  return {
    low: +(slope - margin).toFixed(3),
    high: +(slope + margin).toFixed(3),
    // an interval straddling zero means the record cannot separate this slope
    // from no trend at all — the statement the reader actually needs
    separableFromZero: slope - margin > 0 || slope + margin < 0,
    lag1: +lag1.toFixed(2),
    effectiveN: Math.round(effective),
    observations: residuals.length,
  };
}
