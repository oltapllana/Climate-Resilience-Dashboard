// Temperatura 4 and 5.
//
//  4 — days per year in each heat-stress class, from the thresholds given in
//      the review, plus runs of >=3 consecutive days at Tmax >= 35 °C (the
//      example the reviewer gave for a heat-wave count)
//  5 — the separate low-value chart the review asked for: days below 0 °C
import { readHourly, toDaily } from "./dailyTemperature.js";

// Classes are exclusive and read off the daily maximum, so each day lands in at
// most one of them and the yearly counts add up.
export const HEAT_STRESS_BANDS = [
  { id: "moderate", label: "26–32 °C", min: 26, max: 32, color: "#f0c04a" },
  { id: "strong", label: "32–38 °C", min: 32, max: 38, color: "#e08a2b" },
  { id: "veryStrong", label: "38–46 °C", min: 38, max: 46, color: "#c63a2b" },
  { id: "extreme", label: "> 46 °C", min: 46, max: Infinity, color: "#7d1d13" },
];

// Episode definitions as stated on the reference chart: a heat wave is at least
// three consecutive days with a daily maximum of 30 °C or more; a cold period is
// at least five consecutive days with a daily minimum of -3 °C or below.
export const HEAT_WAVE_THRESHOLD_C = 30;
export const HEAT_WAVE_MIN_DAYS = 3;
export const COLD_PERIOD_THRESHOLD_C = -3;
export const COLD_PERIOD_MIN_DAYS = 5;

export function bandOf(dailyMax) {
  return HEAT_STRESS_BANDS.find((band) => dailyMax >= band.min && dailyMax < band.max) ?? null;
}

function emptyResult() {
  return { daily: [], yearly: [], heatWaves: [], coldPeriods: [], episodes: [], bands: HEAT_STRESS_BANDS, firstDate: null, lastDate: null };
}

// Consecutive-day runs meeting a condition; `peak` is the most extreme value
// reached inside the run, which is what makes one episode worse than another of
// the same length.
function findRuns(daily, { qualifies, valueOf, extremeOf, minDays, type }) {
  const runs = [];
  let run = null;
  for (const row of daily) {
    if (qualifies(row)) {
      const value = valueOf(row);
      run = run
        ? { ...run, endDate: row.date, length: run.length + 1, peak: extremeOf(run.peak, value) }
        : { type, startDate: row.date, endDate: row.date, length: 1, peak: value };
    } else if (run) {
      if (run.length >= minDays) runs.push(run);
      run = null;
    }
  }
  if (run && run.length >= minDays) runs.push(run);
  return runs;
}

function findHeatWaves(daily) {
  return findRuns(daily, {
    type: "heat",
    qualifies: (row) => row.max >= HEAT_WAVE_THRESHOLD_C,
    valueOf: (row) => row.max,
    extremeOf: Math.max,
    minDays: HEAT_WAVE_MIN_DAYS,
  });
}

function findColdPeriods(daily) {
  return findRuns(daily, {
    type: "cold",
    qualifies: (row) => row.min <= COLD_PERIOD_THRESHOLD_C,
    valueOf: (row) => row.min,
    extremeOf: Math.min,
    minDays: COLD_PERIOD_MIN_DAYS,
  });
}

export function calculateHeatStress(hourlyRecords) {
  const hourly = readHourly(hourlyRecords);
  if (!hourly.length) return emptyResult();

  const daily = toDaily(hourly).map((row) => ({
    ...row,
    band: bandOf(row.max)?.id ?? null,
    isFrostDay: row.min < 0,
    isIceDay: row.max < 0,
  }));

  const firstDate = daily[0].date;
  const lastDate = daily.at(-1).date;
  const firstYear = Number(firstDate.slice(0, 4));
  const lastYear = Number(lastDate.slice(0, 4));
  const heatWaves = findHeatWaves(daily);
  const coldPeriods = findColdPeriods(daily);
  // longest first within each type, heat before cold — the reading order of the
  // reference chart
  const episodes = [
    ...[...heatWaves].sort((a, b) => b.length - a.length || a.startDate.localeCompare(b.startDate)),
    ...[...coldPeriods].sort((a, b) => b.length - a.length || a.startDate.localeCompare(b.startDate)),
  ];

  const yearly = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    const rows = daily.filter((row) => Number(row.date.slice(0, 4)) === year);
    if (!rows.length) continue;
    const availableStart = firstDate > `${year}-01-01` ? firstDate : `${year}-01-01`;
    const availableEnd = lastDate < `${year}-12-31` ? lastDate : `${year}-12-31`;
    const classCounts = Object.fromEntries(
      HEAT_STRESS_BANDS.map((band) => [band.id, rows.filter((row) => row.band === band.id).length]),
    );
    yearly.push({
      year,
      ...classCounts,
      // classes are exclusive, so the stack total is the year's heat-stress days
      heatStressTotal: Object.values(classCounts).reduce((sum, count) => sum + count, 0),
      frostDays: rows.filter((row) => row.isFrostDay).length,
      iceDays: rows.filter((row) => row.isIceDay).length,
      heatWaveCount: heatWaves.filter((wave) => Number(wave.startDate.slice(0, 4)) === year).length,
      heatWaveDays: heatWaves
        .filter((wave) => Number(wave.startDate.slice(0, 4)) === year)
        .reduce((sum, wave) => sum + wave.length, 0),
      coldPeriodCount: coldPeriods.filter((period) => Number(period.startDate.slice(0, 4)) === year).length,
      warmestDay: rows.reduce((best, row) => (row.max > best.max ? row : best), rows[0]),
      coldestDay: rows.reduce((best, row) => (row.min < best.min ? row : best), rows[0]),
      observedDays: rows.length,
      availableStart,
      availableEnd,
      isPartial: availableStart !== `${year}-01-01` || availableEnd !== `${year}-12-31`,
    });
  }

  return { daily, yearly, heatWaves, coldPeriods, episodes, bands: HEAT_STRESS_BANDS, firstDate, lastDate };
}
