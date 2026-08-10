import { reconstructHourlyRainfall } from "./landslideRainfall.js";

const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const monthKey = (date) => date.slice(0, 7);
const monthStart = (year, month) => `${year}-${String(month).padStart(2, "0")}-01`;
const monthEnd = (year, month) => dayKey(new Date(year, month, 0, 12));

function emptyResult() {
  return { dailyRainfall: [], dailyTemperature: [], joinedDaily: [], events: [], monthlyCounts: [], annualTotals: [], commonCoverage: [], yearly: [] };
}

function unpack(input) {
  if (Array.isArray(input)) return { stationId: null, hourly: input };
  return { stationId: input?.stationId ?? null, hourly: Array.isArray(input?.hourly) ? input.hourly : [] };
}

export function calculateHeavySnowfall(rainfallInput, temperatureInput) {
  const rainfall = unpack(rainfallInput);
  const temperature = unpack(temperatureInput);
  if (rainfall.stationId && temperature.stationId && rainfall.stationId !== temperature.stationId) {
    throw new Error("Heavy snowfall requires rainfall and temperature from the same station.");
  }

  const reconstructed = reconstructHourlyRainfall(rainfall.hourly);
  const temperatureRows = temperature.hourly.flatMap((row) => {
    const timestamp = new Date(row?.d);
    const value = Number(row?.v);
    return Number.isNaN(timestamp.getTime()) || !Number.isFinite(value) ? [] : [{ timestamp, value }];
  });
  if (!reconstructed.length || !temperatureRows.length) return emptyResult();

  const rainByDay = new Map();
  reconstructed.forEach((row) => {
    const date = dayKey(row.timestamp);
    rainByDay.set(date, (rainByDay.get(date) ?? 0) + row.depthMm);
  });
  const dailyRainfall = [...rainByDay].map(([date, precipitation]) => ({ date, precipitation })).sort((a, b) => a.date.localeCompare(b.date));

  const temperatureByDay = new Map();
  temperatureRows.forEach(({ timestamp, value }) => {
    const date = dayKey(timestamp);
    const bucket = temperatureByDay.get(date) ?? { sum: 0, count: 0 };
    bucket.sum += value;
    bucket.count += 1;
    temperatureByDay.set(date, bucket);
  });
  const dailyTemperature = [...temperatureByDay].map(([date, bucket]) => ({ date, meanTemperature: bucket.sum / bucket.count })).sort((a, b) => a.date.localeCompare(b.date));

  const commonStart = dailyRainfall[0].date > dailyTemperature[0].date ? dailyRainfall[0].date : dailyTemperature[0].date;
  const commonEnd = dailyRainfall.at(-1).date < dailyTemperature.at(-1).date ? dailyRainfall.at(-1).date : dailyTemperature.at(-1).date;
  if (commonStart > commonEnd) return { ...emptyResult(), dailyRainfall, dailyTemperature };

  const rainLookup = new Map(dailyRainfall.map((row) => [row.date, row.precipitation]));
  const joinedDaily = dailyTemperature.flatMap((row) => {
    if (row.date < commonStart || row.date > commonEnd || !rainLookup.has(row.date)) return [];
    return [{ date: row.date, precipitation: rainLookup.get(row.date), meanTemperature: row.meanTemperature }];
  });
  const events = joinedDaily.filter((row) => row.precipitation > 10 && row.meanTemperature < 0);
  const eventCounts = new Map();
  events.forEach((row) => eventCounts.set(monthKey(row.date), (eventCounts.get(monthKey(row.date)) ?? 0) + 1));

  const firstYear = Number(commonStart.slice(0, 4));
  const lastYear = Number(commonEnd.slice(0, 4));
  const yearly = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    const availableStart = commonStart > `${year}-01-01` ? commonStart : `${year}-01-01`;
    const availableEnd = commonEnd < `${year}-12-31` ? commonEnd : `${year}-12-31`;
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const start = monthStart(year, month);
      const end = monthEnd(year, month);
      const available = start <= availableEnd && end >= availableStart;
      return {
        month,
        count: available ? (eventCounts.get(start.slice(0, 7)) ?? 0) : null,
        available,
        isPartial: available && (availableStart > start || availableEnd < end),
      };
    });
    const monthlyCounts = months.map((item) => item.count);
    yearly.push({
      year,
      months,
      monthlyCounts,
      annualTotal: monthlyCounts.reduce((sum, value) => sum + (value ?? 0), 0),
      availableStart,
      availableEnd,
      isPartial: availableStart !== `${year}-01-01` || availableEnd !== `${year}-12-31`,
    });
  }

  return {
    dailyRainfall,
    dailyTemperature,
    joinedDaily,
    events,
    monthlyCounts: yearly.map(({ year, monthlyCounts }) => ({ year, counts: monthlyCounts })),
    annualTotals: yearly.map(({ year, annualTotal }) => ({ year, total: annualTotal })),
    commonCoverage: yearly.map(({ year, availableStart, availableEnd, isPartial }) => ({ year, start: availableStart, end: availableEnd, isPartial })),
    yearly,
  };
}
