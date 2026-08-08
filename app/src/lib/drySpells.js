import { reconstructHourlyRainfall } from "./landslideRainfall.js";

const SEASON_START_MONTH = 4;
const SEASON_START_DAY = 1;
const SEASON_END_MONTH = 9;
const SEASON_END_DAY = 30;

function localDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calendarDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function countCalendarDays(start, end) {
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  let count = 0;
  while (cursor <= last) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function closeRun(runs, run) {
  if (!run) return null;
  runs.push({
    startDate: run.startDate,
    endDate: run.endDate,
    length: run.length,
    classification: run.length >= 7 ? "≥7 days" : run.length >= 5 ? "5–6 days" : "under 5 days",
  });
  return null;
}

export function calculateDrySpells(hourlyRecords) {
  const hourly = reconstructHourlyRainfall(hourlyRecords);
  if (!hourly.length) return { hourly: [], daily: [], yearly: [] };

  const dailyByDate = new Map();
  hourly.forEach((row) => {
    const date = localDay(row.timestamp);
    const daily = dailyByDate.get(date) || { date, total: 0 };
    daily.total += row.depthMm;
    dailyByDate.set(date, daily);
  });

  const daily = [...dailyByDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ ...row, isDry: row.total < 1 }));
  const firstDate = daily[0].date;
  const lastDate = daily.at(-1).date;
  const firstYear = Number(firstDate.slice(0, 4));
  const lastYear = Number(lastDate.slice(0, 4));
  const yearly = [];

  for (let year = firstYear; year <= lastYear; year += 1) {
    const fullStart = calendarDate(year, SEASON_START_MONTH, SEASON_START_DAY);
    const fullEnd = calendarDate(year, SEASON_END_MONTH, SEASON_END_DAY);
    const availableStart = firstDate > fullStart ? firstDate : fullStart;
    const availableEnd = lastDate < fullEnd ? lastDate : fullEnd;
    if (availableStart > availableEnd) continue;

    const seasonalDays = daily.filter((row) => row.date >= availableStart && row.date <= availableEnd);
    const runs = [];
    let run = null;
    seasonalDays.forEach((row) => {
      if (row.isDry) {
        run = run
          ? { ...run, endDate: row.date, length: run.length + 1 }
          : { startDate: row.date, endDate: row.date, length: 1 };
      } else {
        run = closeRun(runs, run);
      }
    });
    closeRun(runs, run);

    yearly.push({
      year,
      availableStart,
      availableEnd,
      availableSeasonalDays: countCalendarDays(availableStart, availableEnd),
      runs,
      daysAtLeast5: runs.filter((item) => item.length >= 5).reduce((sum, item) => sum + item.length, 0),
      daysAtLeast7: runs.filter((item) => item.length >= 7).reduce((sum, item) => sum + item.length, 0),
      isPartial: availableStart !== fullStart || availableEnd !== fullEnd,
    });
  }

  return { hourly, daily, yearly };
}
