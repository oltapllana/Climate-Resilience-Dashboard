// Chart C of the water-quality and water-temperature specs: percentile bands by
// day of year built from the earlier years of record, with the current year
// drawn over them. Removing the seasonal cycle this way is what separates
// "unusually high for the season" from "it is August" — the reading a raw time
// series cannot give a non-specialist.
import { percentile, readSeries, yearOf } from "./seriesUtils.js";

const PERCENTILES = [10, 25, 50, 75, 90];

function emptyResult() {
  return { days: [], currentYear: null, historicalYears: [], count: 0 };
}

function dayOfYear(key) {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

export function calculateSeasonalBand(dailyRecords) {
  const rows = readSeries(dailyRecords);
  if (!rows.length) return emptyResult();

  const years = [...new Set(rows.map((row) => yearOf(row.key)))].sort((a, b) => a - b);
  // the last year of record is the one being judged; everything before it is
  // the reference. With a single year there is nothing to compare against.
  const currentYear = years.length > 1 ? years.at(-1) : null;
  const historicalYears = currentYear == null ? years : years.slice(0, -1);

  const historical = new Map();
  const current = new Map();
  for (const row of rows) {
    const slot = dayOfYear(row.key);
    if (yearOf(row.key) === currentYear) current.set(slot, row.value);
    else (historical.get(slot) ?? historical.set(slot, []).get(slot)).push(row.value);
  }

  const days = [];
  for (let slot = 1; slot <= 366; slot += 1) {
    const sample = historical.get(slot) ?? [];
    const currentValue = current.get(slot) ?? null;
    if (!sample.length && currentValue == null) continue;
    const point = { slot, current: currentValue, samples: sample.length };
    for (const rank of PERCENTILES) point[`p${rank}`] = sample.length ? percentile(sample, rank) : null;
    // recharts stacks an area on the one below it, so the bands are carried as
    // widths over the p10 floor rather than as absolute levels
    point.outerBase = point.p10;
    point.outerBand = point.p10 == null ? null : point.p90 - point.p10;
    point.innerBase = point.p25;
    point.innerBand = point.p25 == null ? null : point.p75 - point.p25;
    days.push(point);
  }

  return { days, currentYear, historicalYears, count: rows.length };
}
