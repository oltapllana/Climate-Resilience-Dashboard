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

// Ordinary least squares against decimal year; returns the slope in units/year.
export function linearTrend(points) {
  if (points.length < 3) return { slopePerYear: null, intercept: null, r2: null };
  const meanX = mean(points.map((point) => point.x));
  const meanY = mean(points.map((point) => point.y));
  let numerator = 0;
  let denominator = 0;
  for (const { x, y } of points) {
    numerator += (x - meanX) * (y - meanY);
    denominator += (x - meanX) ** 2;
  }
  if (denominator === 0) return { slopePerYear: null, intercept: null, r2: null };
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  const totalSquares = points.reduce((sum, { y }) => sum + (y - meanY) ** 2, 0);
  const residualSquares = points.reduce((sum, { x, y }) => sum + (y - (slope * x + intercept)) ** 2, 0);
  return {
    slopePerYear: +slope.toFixed(4),
    intercept,
    r2: totalSquares === 0 ? null : +(1 - residualSquares / totalSquares).toFixed(3),
  };
}
