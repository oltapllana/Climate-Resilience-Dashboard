import { calculateDrySpells } from "./drySpells.js";
import { calculateHotDays } from "./hotDays.js";

function expandRun(run) {
  const dates = [];
  const cursor = new Date(`${run.startDate}T12:00:00`);
  const end = new Date(`${run.endDate}T12:00:00`);
  while (cursor <= end) {
    dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function emptyResult(drySpells, hotDays) {
  return { drySpells, hotDays, yearly: [] };
}

export function calculateHotDaysInDrySpells(rainfallHourly, temperatureHourly) {
  const drySpells = calculateDrySpells(rainfallHourly);
  const hotDays = calculateHotDays(temperatureHourly);
  if (!drySpells.yearly.length || !hotDays.daily.length) return emptyResult(drySpells, hotDays);

  const temperatureByDate = new Map(hotDays.daily.map((item) => [item.date, item.dailyMax]));
  const yearly = drySpells.yearly.flatMap((dryYear) => {
    const year = dryYear.year;
    const seasonStart = `${year}-04-01`;
    const seasonEnd = `${year}-09-30`;
    const temperatureDates = hotDays.daily
      .map((item) => item.date)
      .filter((date) => date >= seasonStart && date <= seasonEnd && Number(date.slice(0, 4)) === year);
    if (!temperatureDates.length) return [];

    const availableCommonStart = dryYear.availableStart > temperatureDates[0] ? dryYear.availableStart : temperatureDates[0];
    const availableCommonEnd = dryYear.availableEnd < temperatureDates.at(-1) ? dryYear.availableEnd : temperatureDates.at(-1);
    if (availableCommonStart > availableCommonEnd) return [];

    const inCommonCoverage = (date) => date >= availableCommonStart && date <= availableCommonEnd;
    const hotDayDates = hotDays.daily
      .filter((item) => item.dailyMax >= 30 && inCommonCoverage(item.date))
      .map((item) => item.date);
    const hotSet = new Set(hotDayDates);
    const qualifyingRuns = dryYear.runs.filter((run) => run.length >= 5 && run.endDate >= availableCommonStart && run.startDate <= availableCommonEnd);
    const drySpell5Dates = [...new Set(qualifyingRuns.flatMap(expandRun).filter(inCommonCoverage))].sort();
    const drySpell7Dates = [...new Set(qualifyingRuns.filter((run) => run.length >= 7).flatMap(expandRun).filter(inCommonCoverage))].sort();
    const compound5Dates = drySpell5Dates.filter((date) => hotSet.has(date));
    const compound7Dates = drySpell7Dates.filter((date) => hotSet.has(date));
    const totalHotDays = hotDayDates.length;

    return [{
      year,
      totalHotDays,
      hotDayDates,
      hotDayTemperatures: Object.fromEntries(hotDayDates.map((date) => [date, temperatureByDate.get(date)])),
      drySpell5Dates,
      drySpell7Dates,
      compound5Dates,
      compound7Dates,
      compound5Count: compound5Dates.length,
      compound7Count: compound7Dates.length,
      compound5Share: totalHotDays ? compound5Dates.length / totalHotDays * 100 : 0,
      availableCommonStart,
      availableCommonEnd,
      isPartial: availableCommonStart !== seasonStart || availableCommonEnd !== seasonEnd,
      dryRuns: qualifyingRuns,
    }];
  });

  return { drySpells, hotDays, yearly };
}
