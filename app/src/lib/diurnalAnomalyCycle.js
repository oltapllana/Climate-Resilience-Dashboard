// Shtypja 3: the daily pressure cycle by season.
//
// Plotted as the deviation from each day's own mean, not as absolute pressure.
// The atmospheric tide is roughly ±1 hPa while day-to-day synoptic swings are
// ±20 hPa, so averaging absolute values by hour buries the signal completely.
// Removing each day's mean first cancels the synoptic component and leaves the
// tide: pressure builds through the morning and falls through the afternoon.
import { SEASON_DEFINITIONS, seasonOf } from "./seasons.js";
import { localDate, mean, parseTimestamp, standardDeviation } from "./dailyTemperature.js";

// A day missing most of its hours has a mean that is not comparable with a full
// day's, and subtracting it would inject a false deviation.
export const MIN_HOURS_PER_DAY = 20;

function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function summarise(values) {
  if (!values.length) return { deviation: null, low: null, high: null, spread: null, count: 0 };
  const average = mean(values);
  const spread = standardDeviation(values);
  return {
    deviation: +average.toFixed(3),
    low: +(average - spread).toFixed(3),
    high: +(average + spread).toFixed(3),
    spread: +spread.toFixed(3),
    count: values.length,
  };
}

function profile(buckets, key) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, ...summarise(buckets.get(key(hour)) ?? []) }));
  const withValues = hours.filter((row) => row.deviation != null);
  const peak = withValues.reduce((best, row) => (best == null || row.deviation > best.deviation ? row : best), null);
  const trough = withValues.reduce((best, row) => (best == null || row.deviation < best.deviation ? row : best), null);
  return {
    hours,
    peak,
    trough,
    amplitude: peak && trough ? +(peak.deviation - trough.deviation).toFixed(3) : null,
  };
}

function emptyResult() {
  return { seasons: [], annual: { hours: [], peak: null, trough: null, amplitude: null }, days: 0, years: [] };
}

export function calculateDiurnalAnomalyCycle(hourlyRecords) {
  if (!Array.isArray(hourlyRecords)) return emptyResult();

  const byDay = new Map();
  for (const row of hourlyRecords) {
    const timestamp = parseTimestamp(row?.d ?? row?.timestamp ?? row?.ts ?? row?.date);
    const value = parseValue(row?.v ?? row?.value);
    if (!timestamp || value == null) continue;
    const date = localDate(timestamp);
    const bucket = byDay.get(date) ?? [];
    bucket.push({ hour: timestamp.getHours(), month: timestamp.getMonth() + 1, year: timestamp.getFullYear(), value });
    byDay.set(date, bucket);
  }
  if (!byDay.size) return emptyResult();

  const seasonBuckets = new Map();
  const annualBuckets = new Map();
  const years = new Set();
  let days = 0;

  for (const readings of byDay.values()) {
    if (readings.length < MIN_HOURS_PER_DAY) continue;
    const dayMean = mean(readings.map((reading) => reading.value));
    days += 1;
    for (const reading of readings) {
      const season = seasonOf(reading.month);
      if (!season) continue;
      years.add(reading.year);
      const deviation = reading.value - dayMean;
      const seasonKey = `${season.id}:${reading.hour}`;
      seasonBuckets.set(seasonKey, [...(seasonBuckets.get(seasonKey) ?? []), deviation]);
      annualBuckets.set(reading.hour, [...(annualBuckets.get(reading.hour) ?? []), deviation]);
    }
  }
  if (!days) return emptyResult();

  return {
    seasons: SEASON_DEFINITIONS.map((season) => ({
      season: season.id,
      color: season.color,
      ...profile(seasonBuckets, (hour) => `${season.id}:${hour}`),
    })),
    annual: profile(annualBuckets, (hour) => hour),
    days,
    years: [...years].sort(),
  };
}
