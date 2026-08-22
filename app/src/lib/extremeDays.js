// Temperatura 5: the N coldest and N hottest days on record.
//
// A cold day is ranked by its daily minimum and a hot day by its daily maximum,
// so each bar is the most extreme temperature that day actually reached.
import { readHourly, toDaily } from "./dailyTemperature.js";

export const DEFAULT_EXTREME_COUNT = 5;

function emptyResult() {
  return { coldest: [], hottest: [], rows: [], observedDays: 0, firstDate: null, lastDate: null };
}

export function calculateExtremeDays(hourlyRecords, count = DEFAULT_EXTREME_COUNT) {
  const daily = toDaily(readHourly(hourlyRecords));
  if (!daily.length) return emptyResult();

  const coldest = [...daily].sort((a, b) => a.min - b.min || a.date.localeCompare(b.date)).slice(0, count);
  const hottest = [...daily].sort((a, b) => b.max - a.max || a.date.localeCompare(b.date)).slice(0, count);

  // Plotted in ascending temperature so the chart reads as one ramp from the
  // coldest day on the left to the hottest on the right.
  const rows = [
    ...coldest.map((day) => ({ date: day.date, value: day.min, type: "cold" })),
    ...hottest.map((day) => ({ date: day.date, value: day.max, type: "hot" })),
  ].sort((a, b) => a.value - b.value);

  return {
    coldest,
    hottest,
    rows,
    observedDays: daily.length,
    firstDate: daily[0].date,
    lastDate: daily.at(-1).date,
  };
}
