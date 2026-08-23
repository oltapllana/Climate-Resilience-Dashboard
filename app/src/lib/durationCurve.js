// Water-level 3 and the Chart D of every water-quality dataset: what fraction
// of the time a value is equalled or exceeded, for an early and a recent window
// of the record. A recent curve sitting above the earlier one across most of
// its length is a shift in the whole regime, not a single extreme event.
import { percentile, readSeries, yearOf } from "./seriesUtils.js";

function emptyResult() {
  return { grid: [], periods: [], markers: [], count: 0, start: null, end: null };
}

// Exceedance rank r out of n plots at r / (n + 1) — the Weibull position, so
// neither the record maximum nor the minimum lands on 0 % or 100 %.
function valueAtExceedance(sortedDescending, percent) {
  const n = sortedDescending.length;
  if (!n) return null;
  const rank = (percent / 100) * (n + 1);
  if (rank <= 1) return sortedDescending[0];
  if (rank >= n) return sortedDescending[n - 1];
  const lower = Math.floor(rank);
  const fraction = rank - lower;
  return sortedDescending[lower - 1] + (sortedDescending[lower] - sortedDescending[lower - 1]) * fraction;
}

/**
 * @param markers exceedance percentages to annotate — [10, 95] for water level
 *                (high water / low water), [10, 90] for the quality series
 * @param steps   resolution of the shared x grid the two periods are sampled
 *                onto; both periods must share an x axis to be drawn together
 */
export function calculateDurationCurve(dailyRecords, { markers = [10, 95], steps = 200 } = {}) {
  const rows = readSeries(dailyRecords);
  if (rows.length < 2) return emptyResult();

  const years = [...new Set(rows.map((row) => yearOf(row.key)))].sort((a, b) => a - b);
  // one year of record cannot be split into an early and a recent window; it is
  // still a valid duration curve, just a single one
  const splitIndex = Math.ceil(years.length / 2);
  const earlyYears = years.length > 1 ? years.slice(0, splitIndex) : years;
  const recentYears = years.length > 1 ? years.slice(splitIndex) : [];

  const periodRows = (yearList) => rows.filter((row) => yearList.includes(yearOf(row.key))).map((row) => row.value);
  const label = (yearList) =>
    yearList.length ? (yearList[0] === yearList.at(-1) ? `${yearList[0]}` : `${yearList[0]}–${yearList.at(-1)}`) : "";

  const periods = [
    { id: "early", years: earlyYears, values: periodRows(earlyYears).sort((a, b) => b - a) },
    { id: "recent", years: recentYears, values: periodRows(recentYears).sort((a, b) => b - a) },
  ]
    .filter((period) => period.values.length > 1)
    .map((period) => ({ id: period.id, label: label(period.years), days: period.values.length, values: period.values }));

  const grid = [];
  for (let step = 0; step <= steps; step += 1) {
    const x = (step / steps) * 100;
    const point = { x: +x.toFixed(2) };
    for (const period of periods) point[period.id] = valueAtExceedance(period.values, x);
    grid.push(point);
  }

  const fullRecord = rows.map((row) => row.value).sort((a, b) => b - a);
  const markerPoints = markers.map((percent) => ({ percent, value: valueAtExceedance(fullRecord, percent) }));

  return {
    grid,
    periods: periods.map(({ values, ...rest }) => rest),
    markers: markerPoints,
    median: percentile(fullRecord, 50),
    count: rows.length,
    start: rows[0].key.slice(0, 10),
    end: rows.at(-1).key.slice(0, 10),
  };
}
