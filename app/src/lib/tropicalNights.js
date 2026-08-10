const THRESHOLD_C = 20;

function parseTimestamp(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const text = String(value).trim();
  if (!text) return null;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):?(\d{2})?(?::?(\d{2}))?)?/);
  if (!match) return null;
  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  const local = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return Number.isNaN(local.getTime()) ? null : local;
}

function parseTemperature(value) {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function emptyResult() {
  return {
    dailyMinimumSeries: [], qualifyingDates: [], monthlyCounts: [], annualCounts: [], totalCount: 0,
    warmestNight: { date: null, temperature: null }, firstObservationDate: null, lastObservationDate: null,
  };
}

export function calculateTropicalNights(hourlyRecords) {
  if (!Array.isArray(hourlyRecords)) return emptyResult();

  const observations = hourlyRecords
    .map((row) => {
      const timestamp = parseTimestamp(row?.d ?? row?.timestamp ?? row?.ts ?? row?.date);
      const temperature = parseTemperature(row?.v ?? row?.value ?? row?.temp ?? row?.temperature);
      return timestamp && temperature != null ? { timestamp, temperature } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (!observations.length) return emptyResult();

  const byDate = new Map();
  for (const observation of observations) {
    const date = localDate(observation.timestamp);
    const dailyMinimum = Math.min(byDate.get(date)?.dailyMinimum ?? Infinity, observation.temperature);
    byDate.set(date, { date, dailyMinimum });
  }
  const dailyMinimumSeries = [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ ...row, qualifying: row.dailyMinimum > THRESHOLD_C }));
  const qualifyingDates = dailyMinimumSeries.filter((row) => row.qualifying).map((row) => row.date);
  const firstObservationDate = dailyMinimumSeries[0].date;
  const lastObservationDate = dailyMinimumSeries.at(-1).date;
  const firstYear = Number(firstObservationDate.slice(0, 4));
  const lastYear = Number(lastObservationDate.slice(0, 4));

  const monthlyCounts = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const key = monthKey(year, month);
      if (key < firstObservationDate.slice(0, 7) || key > lastObservationDate.slice(0, 7)) continue;
      monthlyCounts.push({
        month: key,
        year,
        monthNumber: month,
        count: qualifyingDates.filter((date) => date.startsWith(key)).length,
      });
    }
  }

  const annualCounts = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const availableStart = firstObservationDate > yearStart ? firstObservationDate : yearStart;
    const availableEnd = lastObservationDate < yearEnd ? lastObservationDate : yearEnd;
    const months = monthlyCounts.filter((row) => row.year === year);
    annualCounts.push({
      year,
      count: months.reduce((sum, row) => sum + row.count, 0),
      availableStart,
      availableEnd,
      isPartial: availableStart !== yearStart || availableEnd !== yearEnd,
      monthlyCounts: months,
    });
  }

  const warmestNight = dailyMinimumSeries.reduce(
    (warmest, row) => warmest.temperature == null || row.dailyMinimum > warmest.temperature
      ? { date: row.date, temperature: row.dailyMinimum }
      : warmest,
    { date: null, temperature: null },
  );

  return {
    dailyMinimumSeries,
    qualifyingDates,
    monthlyCounts,
    annualCounts,
    totalCount: qualifyingDates.length,
    warmestNight,
    firstObservationDate,
    lastObservationDate,
  };
}
