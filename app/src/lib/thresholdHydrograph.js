// Water-level 1 (stage hydrograph with flood-alert bands) and water-temperature
// Chart A (thermal-stress hydrograph). Both replay the record's most extreme
// event over shaded threshold bands; only where the band edges come from
// differs — percentiles of the record for water level, fixed aquatic-life
// guidance for temperature.
import { percentile, readSeries } from "./seriesUtils.js";

const DAY_MS = 86400000;

function emptyResult() {
  return { series: [], boundaries: [], peak: null, windowStart: null, windowEnd: null, count: 0, start: null, end: null };
}

function toDate(key) {
  const [datePart, timePart = "00:00"] = key.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}

/**
 * @param records hourly (preferred) or daily rows from a measurement
 * @param mode    "percentile" — stops are percentile ranks, and the record
 *                maximum is appended as the top band edge
 *                "fixed" — stops are already values in the measurement's unit
 * @param stops   band edges, low to high
 */
export function calculateThresholdHydrograph(records, { windowDays = 5, mode = "fixed", stops = [] } = {}) {
  const rows = readSeries(records);
  if (!rows.length) return emptyResult();

  const values = rows.map((row) => row.value);
  const recordMax = Math.max(...values);
  const boundaries = mode === "percentile"
    ? [...stops.map((rank) => percentile(values, rank)), recordMax]
    : [...stops];

  const peakRow = rows.reduce((best, row) => (row.value > best.value ? row : best), rows[0]);
  const peakTime = toDate(peakRow.key);
  const windowStart = new Date(peakTime.getTime() - windowDays * DAY_MS);
  const windowEnd = new Date(peakTime.getTime() + windowDays * DAY_MS);

  const series = rows
    .filter((row) => {
      const time = toDate(row.key);
      return time >= windowStart && time <= windowEnd;
    })
    .map((row) => ({ key: row.key, time: toDate(row.key).getTime(), value: row.value }));

  return {
    series,
    // duplicate edges (a percentile that lands on the maximum in a flat record)
    // would draw zero-height bands, so collapse them
    boundaries: boundaries.filter((value, index) => value != null && (index === 0 || value > boundaries[index - 1])),
    peak: { key: peakRow.key, time: peakTime.getTime(), value: peakRow.value },
    windowStart: windowStart.getTime(),
    windowEnd: windowEnd.getTime(),
    count: rows.length,
    start: rows[0].key.slice(0, 10),
    end: rows.at(-1).key.slice(0, 10),
  };
}
