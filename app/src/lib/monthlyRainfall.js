// Reshje 1: mean monthly rainfall with between-year variability.
//
// The reviewer rejected the earlier version of this chart because it summed raw
// intensity readings (mm/h) as if they were depths, producing ~7000 mm months.
// Depths here come from the same hourly reconstruction the landslide indicator
// uses: one clock-hour of mm/h equals mm of depth.
import { reconstructHourlyRainfall } from "./landslideRainfall.js";
import { SEASON_DEFINITIONS, seasonOf as seasonDefinitionOf } from "./seasons.js";

export const MIN_QUARTILE_YEARS = 3;

export const SEASONS = Object.fromEntries(
  SEASON_DEFINITIONS.map(({ id, months, color }) => [id, { months, color }]),
);

export function seasonOf(month) {
  return seasonDefinitionOf(month)?.id ?? null;
}

/**
 * Linear-interpolated quantile of a set of values.
 */
export function quantile(values, p) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * p;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

/**
 * The arm lengths [down, up] running from the mean bar out to the quartiles.
 *
 * This chart used to whisker one standard deviation either side of the mean,
 * which fails twice on monthly rainfall. A standard deviation assumes the years
 * sit symmetrically around their mean, and rainfall totals do not: five wet
 * Septembers of 25, 37, 116, 175 and 301 mm are a long right tail. So the arm
 * ran wider than the mean itself in four months and put January's lower end at
 * -6.9 mm, on a quantity that cannot go below zero; and the upward arm reached
 * 286 mm against a tallest bar of 172, leaving the bars in the bottom 60% of
 * the plot with the whiskers towering over them.
 *
 * Quartiles are read off the observed totals instead. They cannot fall outside
 * the range actually recorded, so the axis keeps its floor at zero without
 * being clamped, and the top drops from 286 mm to 240 mm.
 */
export function whiskerSpread(mean, q1, q3) {
  if (![mean, q1, q3].every(Number.isFinite)) return null;
  // A long enough right tail can drag the mean past Q3; an arm is a length, so
  // it stops at the bar rather than turning back on itself.
  return [Math.max(0, mean - q1), Math.max(0, q3 - mean)];
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function emptyResult() {
  return { monthly: [], monthTotals: [], wettestMonth: null, driestMonth: null, annualMean: null };
}

// Only calendar months the sensor covered in full contribute to the mean — a
// half-observed month reads as a dry month and would drag the normal down.
export function calculateMonthlyRainfall(hourlyRecords) {
  const hourly = reconstructHourlyRainfall(Array.isArray(hourlyRecords)
    ? hourlyRecords.filter((row) => row?.v != null && String(row.v).trim() !== "")
    : []);
  if (!hourly.length) return emptyResult();

  // Retain within-month zero reconstruction, but track whether any real
  // observation exists so entirely absent months cannot become dry months.
  const spanned = new Map();
  for (const row of hourly) {
    const key = `${row.timestamp.getFullYear()}-${String(row.timestamp.getMonth() + 1).padStart(2, "0")}`;
    const bucket = spanned.get(key) ?? { days: new Set(), total: 0, hasObservation: false };
    bucket.days.add(row.timestamp.getDate());
    bucket.total += row.depthMm;
    bucket.hasObservation ||= !row.filled;
    spanned.set(key, bucket);
  }

  const monthTotals = [...spanned.entries()]
    .map(([key, bucket]) => {
      const year = Number(key.slice(0, 4));
      const month = Number(key.slice(5, 7));
      return {
        key,
        year,
        month,
        total: +bucket.total.toFixed(2),
        observedDays: bucket.days.size,
        complete: bucket.hasObservation && bucket.days.size === daysInMonth(year, month),
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  // Keep the existing within-month reconstruction, but never count a wholly
  // unobserved month (or a year containing one) as complete history.
  const completeYears = [...new Set(monthTotals.map((row) => row.year))].filter(
    (year) => monthTotals.filter((row) => row.year === year && row.complete).length === 12,
  );
  const monthly = [];
  for (let month = 1; month <= 12; month += 1) {
    const complete = monthTotals.filter((row) => row.month === month && row.complete);
    const values = complete.map((row) => row.total);
    const history = complete.filter((row) => completeYears.includes(row.year)).map((row) => row.total);
    const hasQuartiles = history.length >= MIN_QUARTILE_YEARS;
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    monthly.push({
      month,
      season: seasonOf(month),
      mean: mean == null ? null : +mean.toFixed(1),
      stdDev: values.length ? +standardDeviation(values).toFixed(1) : null,
      q1: hasQuartiles ? +quantile(history, 0.25).toFixed(1) : null,
      q3: hasQuartiles ? +quantile(history, 0.75).toFixed(1) : null,
      quartileYearCount: history.length,
      lowest: values.length ? +Math.min(...values).toFixed(1) : null,
      highest: values.length ? +Math.max(...values).toFixed(1) : null,
      years: complete.map((row) => row.year),
      yearCount: values.length,
    });
  }

  const withValues = monthly.filter((row) => row.mean != null);
  const wettestMonth = withValues.reduce((best, row) => (best == null || row.mean > best.mean ? row : best), null);
  const driestMonth = withValues.reduce((best, row) => (best == null || row.mean < best.mean ? row : best), null);
  const annualMean = withValues.length === 12
    ? +withValues.reduce((sum, row) => sum + row.mean, 0).toFixed(1)
    : null;

  return { monthly, monthTotals, wettestMonth, driestMonth, annualMean };
}
