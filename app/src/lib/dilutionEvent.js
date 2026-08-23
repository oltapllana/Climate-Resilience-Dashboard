// Chart A of the salinity / TDS / conductivity specs: the flood event replayed
// with the water-quality series against water level on a second axis. Rising
// flow diluting the river is a physical relationship between two independent
// sensors, so the chart doubles as a data-quality cross-check — if the dip does
// not appear, one of the two instruments is wrong.
import { readSeries } from "./seriesUtils.js";

const DAY_MS = 86400000;

function emptyResult() {
  return { series: [], peak: null, minimum: null, windowStart: null, windowEnd: null };
}

function toDate(key) {
  const [datePart, timePart = "00:00"] = key.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}

export function calculateDilutionEvent(qualityRecords, levelRecords, { windowDays = 3 } = {}) {
  const quality = readSeries(qualityRecords);
  const level = readSeries(levelRecords);
  if (!quality.length || !level.length) return emptyResult();

  // the event is defined by the level series, so both panels of the review's
  // water story (hydrograph and dilution) point at the same storm
  const peakRow = level.reduce((best, row) => (row.value > best.value ? row : best), level[0]);
  const peakTime = toDate(peakRow.key).getTime();
  const windowStart = peakTime - windowDays * DAY_MS;
  const windowEnd = peakTime + windowDays * DAY_MS;
  const inWindow = (row) => {
    const time = toDate(row.key).getTime();
    return time >= windowStart && time <= windowEnd;
  };

  const merged = new Map();
  for (const row of quality.filter(inWindow)) {
    merged.set(row.key, { key: row.key, time: toDate(row.key).getTime(), value: row.value, level: null });
  }
  for (const row of level.filter(inWindow)) {
    const existing = merged.get(row.key);
    if (existing) existing.level = row.value;
    else merged.set(row.key, { key: row.key, time: toDate(row.key).getTime(), value: null, level: row.value });
  }

  const series = [...merged.values()].sort((a, b) => a.time - b.time);
  const measured = series.filter((row) => row.value != null);
  if (!measured.length) return emptyResult();
  const minimum = measured.reduce((best, row) => (row.value < best.value ? row : best), measured[0]);

  return {
    series,
    peak: { key: peakRow.key, time: peakTime, value: peakRow.value },
    minimum,
    windowStart,
    windowEnd,
  };
}
