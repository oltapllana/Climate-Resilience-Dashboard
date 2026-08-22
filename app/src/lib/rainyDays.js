// Reshje 3 + Reshje 5: number of rain days per year, split into the intensity
// bands the reviewer specified (30–50 mm yellow, 50–80 mm orange, >80 mm red).
// A rain day is a calendar day with at least 1 mm — the WMO convention also used
// by the dry-spells indicator, so the two are mutually consistent.
import { reconstructHourlyRainfall } from "./landslideRainfall.js";

export const RAIN_DAY_THRESHOLD_MM = 1;

export const INTENSITY_BANDS = [
  { id: "light", label: "1–30 mm", min: 1, max: 30, color: "#7fb3d5" },
  { id: "moderate", label: "30–50 mm", min: 30, max: 50, color: "#e8c33c" },
  { id: "heavy", label: "50–80 mm", min: 50, max: 80, color: "#e08a2b" },
  { id: "extreme", label: "> 80 mm", min: 80, max: Infinity, color: "#c63a2b" },
];

// The three classified bands. Ordinary 1–30 mm days outnumber them roughly ten
// to one, so stacking all four leaves these three as invisible slivers; they are
// charted on their own and the light-day count is reported alongside.
export const CLASSIFIED_BANDS = INTENSITY_BANDS.filter((band) => band.id !== "light");

export function bandOf(totalMm) {
  return INTENSITY_BANDS.find((band) => totalMm >= band.min && totalMm < band.max) ?? null;
}

function localDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyResult() {
  return { daily: [], yearly: [], monthly: [], totalRainDays: 0 };
}

export function calculateRainyDays(hourlyRecords) {
  const hourly = reconstructHourlyRainfall(hourlyRecords);
  if (!hourly.length) return emptyResult();

  const byDate = new Map();
  for (const row of hourly) {
    const date = localDay(row.timestamp);
    byDate.set(date, (byDate.get(date) ?? 0) + row.depthMm);
  }

  const daily = [...byDate.entries()]
    .map(([date, total]) => ({ date, total: +total.toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ ...row, isRainDay: row.total >= RAIN_DAY_THRESHOLD_MM, band: bandOf(row.total)?.id ?? null }));

  const firstDate = daily[0].date;
  const lastDate = daily.at(-1).date;
  const firstYear = Number(firstDate.slice(0, 4));
  const lastYear = Number(lastDate.slice(0, 4));

  const yearly = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    const rows = daily.filter((row) => Number(row.date.slice(0, 4)) === year);
    if (!rows.length) continue;
    const rainDays = rows.filter((row) => row.isRainDay);
    const counts = Object.fromEntries(
      INTENSITY_BANDS.map((band) => [band.id, rainDays.filter((row) => row.band === band.id).length]),
    );
    const availableStart = firstDate > `${year}-01-01` ? firstDate : `${year}-01-01`;
    const availableEnd = lastDate < `${year}-12-31` ? lastDate : `${year}-12-31`;
    yearly.push({
      year,
      ...counts,
      // days falling in one of the three classified bands (>= 30 mm)
      classifiedDays: CLASSIFIED_BANDS.reduce((sum, band) => sum + counts[band.id], 0),
      rainDays: rainDays.length,
      observedDays: rows.length,
      // a raw count punishes a short year, so also expose the rate
      sharePercent: +((rainDays.length / rows.length) * 100).toFixed(1),
      totalRainfall: +rows.reduce((sum, row) => sum + row.total, 0).toFixed(1),
      availableStart,
      availableEnd,
      isPartial: availableStart !== `${year}-01-01` || availableEnd !== `${year}-12-31`,
    });
  }

  // Monthly rows pool every year of the record: "May" is every May observed,
  // so rainDays can exceed 31. averagePerYear is the per-May figure.
  const monthly = [];
  for (let month = 1; month <= 12; month += 1) {
    const rows = daily.filter((row) => Number(row.date.slice(5, 7)) === month);
    const rainDays = rows.filter((row) => row.isRainDay).length;
    const years = new Set(rows.map((row) => row.date.slice(0, 4)));
    monthly.push({
      month,
      rainDays,
      observedDays: rows.length,
      yearCount: years.size,
      years: [...years].sort(),
      averagePerYear: years.size ? +(rainDays / years.size).toFixed(1) : null,
      sharePercent: rows.length ? +((rainDays / rows.length) * 100).toFixed(1) : null,
    });
  }

  return { daily, yearly, monthly, totalRainDays: daily.filter((row) => row.isRainDay).length };
}
