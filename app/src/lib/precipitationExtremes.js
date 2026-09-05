import { reconstructHourlyRainfall } from "./landslideRainfall.js";

function localDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localYear(day) {
  return Number(day.slice(0, 4));
}

export function linearPercentile(values, q) {
  if (!Array.isArray(values) || !values.length || !Number.isFinite(q)) return null;
  const sorted = values.filter((value) => Number.isFinite(Number(value))).map(Number).sort((a, b) => a - b);
  if (!sorted.length) return null;
  if (q <= 0) return sorted[0];
  if (q >= 1) return sorted[sorted.length - 1];

  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const fraction = position - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}

export function calculatePrecipitationExtremes(hourlyRecords) {
  const hourly = reconstructHourlyRainfall(hourlyRecords);
  if (!hourly.length) {
    return { hourly: [], daily: [], yearly: [], extremeDays: [], threshold: null };
  }

  const dailyByDate = new Map();
  hourly.forEach((row) => {
    const date = localDay(row.timestamp);
    const current = dailyByDate.get(date) || { date, total: 0 };
    current.total += row.depthMm;
    dailyByDate.set(date, current);
  });

  const daily = [...dailyByDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  const threshold = linearPercentile(daily.map((row) => row.total), 0.999);
  const extremeDays = threshold == null ? [] : daily.filter((row) => row.total > threshold);

  const years = [...new Set(daily.map((row) => localYear(row.date)))].sort((a, b) => a - b);
  const yearly = years.map((year) => {
    const rows = daily.filter((row) => localYear(row.date) === year);
    const maxRow = rows.reduce(
      (current, row) => (current == null || row.total > current.total ? row : current),
      null
    );
    // A year the record only half covers cannot be compared with a full one:
    // 2026's "annual maximum" is the wettest day of a winter, and drawn beside
    // five complete years it reads as a collapse in extreme rainfall.
    const observedStart = rows.length ? rows[0].date : null;
    const observedEnd = rows.length ? rows[rows.length - 1].date : null;
    const isPartial =
      observedStart == null || observedStart > `${year}-01-01` || observedEnd < `${year}-12-31`;
    return {
      year,
      maxDate: maxRow ? maxRow.date : null,
      maxTotal: maxRow ? maxRow.total : null,
      exceedsThreshold: maxRow != null && threshold != null && maxRow.total > threshold,
      observedStart,
      observedEnd,
      observedDays: rows.length,
      isPartial,
    };
  });

  return {
    hourly,
    daily,
    yearly,
    extremeDays,
    threshold,
  };
}