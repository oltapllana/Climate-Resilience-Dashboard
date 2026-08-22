// Reshje 1: mean monthly rainfall with between-year variability.
//
// The reviewer rejected the earlier version of this chart because it summed raw
// intensity readings (mm/h) as if they were depths, producing ~7000 mm months.
// Depths here come from the same hourly reconstruction the landslide indicator
// uses: one clock-hour of mm/h equals mm of depth.
import { reconstructHourlyRainfall } from "./landslideRainfall.js";

export const SEASONS = {
  winter: { months: [12, 1, 2], color: "#2b7fc4" },
  spring: { months: [3, 4, 5], color: "#4a9d4a" },
  summer: { months: [6, 7, 8], color: "#d6453d" },
  autumn: { months: [9, 10, 11], color: "#e0a52b" },
};

export function seasonOf(month) {
  return Object.keys(SEASONS).find((season) => SEASONS[season].months.includes(month)) ?? null;
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
  const hourly = reconstructHourlyRainfall(hourlyRecords);
  if (!hourly.length) return emptyResult();

  // hourly is a continuous grid, so a month present in it is covered end to end
  // even where individual hours were reconstructed as zero
  const spanned = new Map();
  for (const row of hourly) {
    const key = `${row.timestamp.getFullYear()}-${String(row.timestamp.getMonth() + 1).padStart(2, "0")}`;
    const bucket = spanned.get(key) ?? { days: new Set(), total: 0 };
    bucket.days.add(row.timestamp.getDate());
    bucket.total += row.depthMm;
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
        complete: bucket.days.size === daysInMonth(year, month),
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  const monthly = [];
  for (let month = 1; month <= 12; month += 1) {
    const complete = monthTotals.filter((row) => row.month === month && row.complete);
    const values = complete.map((row) => row.total);
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    monthly.push({
      month,
      season: seasonOf(month),
      mean: mean == null ? null : +mean.toFixed(1),
      stdDev: values.length ? +standardDeviation(values).toFixed(1) : null,
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
