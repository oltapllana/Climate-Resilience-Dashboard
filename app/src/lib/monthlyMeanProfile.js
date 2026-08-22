// Rrezatimi 2: mean value per calendar month with the between-year spread.
//
// Two averaging steps, in this order: each month-year is averaged first, then
// those monthly means are averaged across years. Pooling every daily value at
// once would weight a month-year with more observed days more heavily, which is
// a coverage artefact rather than a climate signal.
import { mean, standardDeviation } from "./dailyTemperature.js";

// A month-year built from a handful of days is not a monthly mean; it is a
// sample of whichever days the sensor happened to be running.
export const MIN_DAYS_PER_MONTH = 15;

function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult() {
  return { monthly: [], monthYears: [], max: null, min: null, firstDate: null, lastDate: null, skippedMonths: 0 };
}

export function calculateMonthlyMeanProfile(dailyRecords) {
  if (!Array.isArray(dailyRecords)) return emptyResult();

  const rows = dailyRecords
    .map((row) => ({ date: String(row?.d ?? ""), value: parseValue(row?.v) }))
    .filter((row) => /^\d{4}-\d{2}-\d{2}/.test(row.date) && row.value != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) return emptyResult();

  const byMonthYear = new Map();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    byMonthYear.set(key, [...(byMonthYear.get(key) ?? []), row.value]);
  }

  const monthYears = [];
  let skippedMonths = 0;
  for (const [key, values] of byMonthYear) {
    if (values.length < MIN_DAYS_PER_MONTH) {
      skippedMonths += 1;
      continue;
    }
    monthYears.push({
      key,
      year: Number(key.slice(0, 4)),
      monthNumber: Number(key.slice(5, 7)),
      mean: +mean(values).toFixed(2),
      observedDays: values.length,
    });
  }
  if (!monthYears.length) return { ...emptyResult(), skippedMonths };

  const monthly = [];
  for (let monthNumber = 1; monthNumber <= 12; monthNumber += 1) {
    const entries = monthYears.filter((row) => row.monthNumber === monthNumber);
    if (!entries.length) {
      monthly.push({ monthNumber, mean: null, stdDev: null, yearCount: 0, years: [] });
      continue;
    }
    const means = entries.map((row) => row.mean);
    const average = mean(means);
    const spread = standardDeviation(means);
    monthly.push({
      monthNumber,
      mean: +average.toFixed(1),
      stdDev: +spread.toFixed(1),
      low: +(average - spread).toFixed(1),
      high: +(average + spread).toFixed(1),
      yearCount: entries.length,
      years: entries.map((row) => row.year).sort(),
      observedDays: entries.reduce((sum, row) => sum + row.observedDays, 0),
    });
  }

  const withValues = monthly.filter((row) => row.mean != null);

  return {
    monthly,
    monthYears,
    max: withValues.reduce((best, row) => (best == null || row.mean > best.mean ? row : best), null),
    min: withValues.reduce((best, row) => (best == null || row.mean < best.mean ? row : best), null),
    firstDate: rows[0].date,
    lastDate: rows.at(-1).date,
    skippedMonths,
  };
}
