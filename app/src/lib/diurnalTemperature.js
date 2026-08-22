// Temperatura 3 (proposal): the daily temperature cycle split by season.
//
// The review made the case directly: a single "annual average" diurnal curve
// hides that the day–night amplitude in summer is far larger than in winter, so
// each season gets its own curve, and each curve carries a spread band showing
// how much individual days vary around it.
import { SEASON_DEFINITIONS, seasonOf } from "./seasons.js";
import { mean, readHourly, standardDeviation } from "./dailyTemperature.js";

function summarise(values) {
  if (!values.length) return { mean: null, low: null, high: null, count: 0 };
  const average = mean(values);
  const spread = standardDeviation(values);
  return {
    mean: +average.toFixed(2),
    low: +(average - spread).toFixed(2),
    high: +(average + spread).toFixed(2),
    spread: +spread.toFixed(2),
    count: values.length,
  };
}

function profileFrom(buckets, hourKey) {
  const hours = [];
  for (let hour = 0; hour < 24; hour += 1) {
    hours.push({ hour, ...summarise(buckets.get(hourKey(hour)) ?? []) });
  }
  const withValues = hours.filter((row) => row.mean != null);
  return {
    hours,
    peak: withValues.reduce((best, row) => (best == null || row.mean > best.mean ? row : best), null),
    trough: withValues.reduce((best, row) => (best == null || row.mean < best.mean ? row : best), null),
  };
}

function emptyResult() {
  return { seasons: [], annual: { hours: [], peak: null, trough: null }, count: 0, years: [] };
}

export function calculateDiurnalTemperature(hourlyRecords) {
  const hourly = readHourly(hourlyRecords);
  if (!hourly.length) return emptyResult();

  const seasonBuckets = new Map();
  const annualBuckets = new Map();
  const years = new Set();

  for (const row of hourly) {
    const hour = row.timestamp.getHours();
    const season = seasonOf(row.timestamp.getMonth() + 1);
    if (!season) continue;
    years.add(row.timestamp.getFullYear());
    const seasonKey = `${season.id}:${hour}`;
    seasonBuckets.set(seasonKey, [...(seasonBuckets.get(seasonKey) ?? []), row.temperature]);
    annualBuckets.set(hour, [...(annualBuckets.get(hour) ?? []), row.temperature]);
  }

  const seasons = SEASON_DEFINITIONS.map((season) => {
    const profile = profileFrom(seasonBuckets, (hour) => `${season.id}:${hour}`);
    const values = profile.hours.filter((row) => row.mean != null).map((row) => row.mean);
    return {
      season: season.id,
      color: season.color,
      ...profile,
      // the number the review was really after: how far the day swings
      amplitude: values.length ? +(Math.max(...values) - Math.min(...values)).toFixed(2) : null,
    };
  });

  return {
    seasons,
    annual: profileFrom(annualBuckets, (hour) => hour),
    count: hourly.length,
    years: [...years].sort(),
  };
}
