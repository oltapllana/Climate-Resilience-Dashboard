// Chart E of the water-quality and water-temperature specs: how often each year
// sat above a threshold. Reported as a percentage of monitored days rather than
// a raw count, so a year the sensor was down for half of does not read as a
// calm year — the single most direct year-over-year signal in this set.
import { percentile, readSeries, yearCoverage, yearOf } from "./seriesUtils.js";

function emptyResult() {
  return { threshold: null, years: [], count: 0, start: null, end: null };
}

/**
 * @param percentile rank of the record used as the threshold. A placeholder:
 *        an operational indicator needs the regulator's own limit here, and the
 *        chart says so.
 */
export function calculateExceedanceDays(dailyRecords, { percentile: rank = 90 } = {}) {
  const rows = readSeries(dailyRecords);
  if (!rows.length) return emptyResult();

  const threshold = percentile(rows.map((row) => row.value), rank);
  const coverage = yearCoverage(rows);
  const byYear = new Map();
  for (const row of rows) {
    const year = yearOf(row.key);
    const bucket = byYear.get(year) ?? { year, monitoredDays: 0, exceedingDays: 0 };
    bucket.monitoredDays += 1;
    if (row.value > threshold) bucket.exceedingDays += 1;
    byYear.set(year, bucket);
  }

  const years = [...byYear.values()]
    .sort((a, b) => a.year - b.year)
    .map((bucket) => ({
      ...bucket,
      share: (bucket.exceedingDays / bucket.monitoredDays) * 100,
      partial: coverage.get(bucket.year)?.partial ?? false,
    }));

  return { threshold, years, count: rows.length, start: rows[0].key.slice(0, 10), end: rows.at(-1).key.slice(0, 10) };
}
