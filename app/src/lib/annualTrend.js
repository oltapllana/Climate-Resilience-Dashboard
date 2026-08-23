// Chart B of the water-quality and water-temperature specs: annual mean with
// the min–max range behind it and a linear trend fitted on complete years only.
// A partial year's mean is not comparable with a full year's — a record that
// stops in April is a mean of winter — so those years are drawn but excluded
// from the fit.
import { linearFit, parseValue, readSeries, yearCoverage, yearOf } from "./seriesUtils.js";

function emptyResult() {
  return { years: [], trend: null, completeYears: 0, start: null, end: null };
}

export function calculateAnnualTrend(dailyRecords) {
  const rows = readSeries(dailyRecords);
  if (!rows.length) return emptyResult();

  const coverage = yearCoverage(rows);
  const byYear = new Map();
  for (const record of dailyRecords) {
    const key = String(record?.d ?? "");
    if (!/^\d{4}-\d{2}-\d{2}/.test(key)) continue;
    const mean = parseValue(record?.v);
    if (mean == null) continue;
    const year = yearOf(key);
    const bucket = byYear.get(year) ?? { year, sum: 0, days: 0, min: Infinity, max: -Infinity };
    bucket.sum += mean;
    bucket.days += 1;
    // the daily band, where the source has one, so the annual range is the real
    // extreme the sensor saw rather than the most extreme daily average
    bucket.min = Math.min(bucket.min, parseValue(record?.lo) ?? mean);
    bucket.max = Math.max(bucket.max, parseValue(record?.hi) ?? mean);
    byYear.set(year, bucket);
  }

  const years = [...byYear.values()]
    .sort((a, b) => a.year - b.year)
    .map((bucket) => ({
      year: bucket.year,
      mean: bucket.sum / bucket.days,
      min: bucket.min,
      max: bucket.max,
      range: bucket.max - bucket.min,
      observedDays: bucket.days,
      partial: coverage.get(bucket.year)?.partial ?? false,
    }));

  const complete = years.filter((row) => !row.partial);
  const fit = complete.length >= 2 ? linearFit(complete.map((row) => ({ x: row.year, y: row.mean }))) : null;
  const withFit = years.map((row) => ({ ...row, fit: fit ? fit.at(row.year) : null }));

  return {
    years: withFit,
    trend: fit ? { slope: fit.slope, intercept: fit.intercept } : null,
    completeYears: complete.length,
    start: rows[0].key.slice(0, 10),
    end: rows.at(-1).key.slice(0, 10),
  };
}
