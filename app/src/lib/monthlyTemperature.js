// Temperatura 1, 2 and 3.
//
//  1 — monthly mean series with a fitted linear trend (°C/year) and a 0 °C line
//  2 — mean monthly maxima and minima
//  3 — the same, plus the between-year spread of each so a single flat average
//      is not mistaken for a stable value
import { linearTrend, mean, readHourly, toDaily } from "./dailyTemperature.js";

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function emptyResult() {
  return {
    daily: [], monthly: [], climatology: [], trend: { slopePerYear: null, r2: null, grandMean: null, meanX: null },
    warmestMonth: null, coldestMonth: null, firstDate: null, lastDate: null,
  };
}

export function calculateMonthlyTemperature(hourlyRecords) {
  const hourly = readHourly(hourlyRecords);
  if (!hourly.length) return emptyResult();
  const daily = toDaily(hourly);

  const byMonth = new Map();
  for (const row of daily) {
    const key = row.date.slice(0, 7);
    const bucket = byMonth.get(key) ?? { key, days: [] };
    bucket.days.push(row);
    byMonth.set(key, bucket);
  }

  const monthly = [...byMonth.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, days }) => {
      const year = Number(key.slice(0, 4));
      const monthNumber = Number(key.slice(5, 7));
      return {
        month: key,
        year,
        monthNumber,
        mean: +mean(days.map((day) => day.mean)).toFixed(2),
        meanMax: +mean(days.map((day) => day.max)).toFixed(2),
        meanMin: +mean(days.map((day) => day.min)).toFixed(2),
        absoluteMax: +Math.max(...days.map((day) => day.max)).toFixed(2),
        absoluteMin: +Math.min(...days.map((day) => day.min)).toFixed(2),
        observedDays: days.length,
        // a half-observed month is a real observation but not a comparable
        // monthly normal, so it is excluded from the climatology and the trend
        complete: days.length === daysInMonth(year, monthNumber),
      };
    });

  const completeMonths = monthly.filter((row) => row.complete);

  // The trend is fitted on deseasonalized anomalies (each month minus its own
  // calendar-month normal), not on the raw means. Regressing the raw series
  // lets the annual cycle correlate with time and invent a slope that is not
  // there — the same reason projection.js deseasonalizes before fitting.
  const normals = new Map();
  for (let monthNumber = 1; monthNumber <= 12; monthNumber += 1) {
    const rows = completeMonths.filter((row) => row.monthNumber === monthNumber);
    if (rows.length) normals.set(monthNumber, mean(rows.map((row) => row.mean)));
  }
  const anomalyPoints = completeMonths
    .filter((row) => normals.has(row.monthNumber))
    .map((row) => ({ x: row.year + (row.monthNumber - 0.5) / 12, y: row.mean - normals.get(row.monthNumber) }));
  const fit = linearTrend(anomalyPoints);
  // the anomaly fit passes through zero, so the drawn line is re-centred on the
  // level of the observed series
  const grandMean = completeMonths.length ? mean(completeMonths.map((row) => row.mean)) : null;
  const meanX = anomalyPoints.length ? mean(anomalyPoints.map((point) => point.x)) : null;
  const trend = { ...fit, grandMean, meanX };

  const climatology = [];
  for (let monthNumber = 1; monthNumber <= 12; monthNumber += 1) {
    const rows = completeMonths.filter((row) => row.monthNumber === monthNumber);
    if (!rows.length) {
      climatology.push({ monthNumber, meanMax: null, meanMin: null, meanMean: null, yearCount: 0, years: [] });
      continue;
    }
    climatology.push({
      monthNumber,
      meanMean: +mean(rows.map((row) => row.mean)).toFixed(2),
      meanMax: +mean(rows.map((row) => row.meanMax)).toFixed(2),
      meanMin: +mean(rows.map((row) => row.meanMin)).toFixed(2),
      // between-year spread of the monthly figure — the "shtrirja mes viteve" band
      maxLow: +Math.min(...rows.map((row) => row.meanMax)).toFixed(2),
      maxHigh: +Math.max(...rows.map((row) => row.meanMax)).toFixed(2),
      minLow: +Math.min(...rows.map((row) => row.meanMin)).toFixed(2),
      minHigh: +Math.max(...rows.map((row) => row.meanMin)).toFixed(2),
      absoluteMax: +Math.max(...rows.map((row) => row.absoluteMax)).toFixed(2),
      absoluteMin: +Math.min(...rows.map((row) => row.absoluteMin)).toFixed(2),
      yearCount: rows.length,
      years: rows.map((row) => row.year).sort(),
    });
  }

  const rankable = monthly.filter((row) => row.complete);
  const pool = rankable.length ? rankable : monthly;

  return {
    daily,
    monthly,
    climatology,
    trend,
    completeMonthCount: completeMonths.length,
    warmestMonth: pool.reduce((best, row) => (best == null || row.mean > best.mean ? row : best), null),
    coldestMonth: pool.reduce((best, row) => (best == null || row.mean < best.mean ? row : best), null),
    firstDate: daily[0].date,
    lastDate: daily.at(-1).date,
  };
}
