const MIN_THRESHOLD = -2.2;
const MAX_THRESHOLD = 0;

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

function monthStart(year, month) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function monthEnd(year, month) {
  const day = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${day}`;
}

const emptyResult = () => ({ hourly: [], daily: [], yearly: [], availableStart: null, availableEnd: null });

export function calculateFreezeThawCycles(hourlyRecords) {
  if (!Array.isArray(hourlyRecords)) return emptyResult();
  const hourly = hourlyRecords
    .map((row) => {
      const timestamp = parseTimestamp(row?.d ?? row?.timestamp ?? row?.ts ?? row?.date);
      const temperature = parseTemperature(row?.v ?? row?.value ?? row?.temp ?? row?.temperature);
      return timestamp && temperature != null ? { timestamp, temperature } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (!hourly.length) return emptyResult();

  const byDate = new Map();
  for (const observation of hourly) {
    const date = localDate(observation.timestamp);
    const current = byDate.get(date) || { date, dailyMin: Infinity, dailyMax: -Infinity };
    current.dailyMin = Math.min(current.dailyMin, observation.temperature);
    current.dailyMax = Math.max(current.dailyMax, observation.temperature);
    byDate.set(date, current);
  }
  const daily = [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ ...row, qualifying: row.dailyMin < MIN_THRESHOLD && row.dailyMax > MAX_THRESHOLD }));
  const availableStart = daily[0].date;
  const availableEnd = daily.at(-1).date;
  const firstYear = Number(availableStart.slice(0, 4));
  const lastYear = Number(availableEnd.slice(0, 4));
  const yearly = [];

  for (let year = firstYear; year <= lastYear; year += 1) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const coveredStart = availableStart > yearStart ? availableStart : yearStart;
    const coveredEnd = availableEnd < yearEnd ? availableEnd : yearEnd;
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const start = monthStart(year, month);
      const end = monthEnd(year, month);
      const available = start <= coveredEnd && end >= coveredStart;
      if (!available) return { month, count: null, available: false, isPartial: false };
      const count = daily.filter((row) => row.date >= start && row.date <= end && row.qualifying).length;
      return { month, count, available: true, isPartial: coveredStart > start || coveredEnd < end };
    });
    const monthlyCounts = months.map((month) => month.count);
    yearly.push({
      year,
      monthlyCounts,
      months,
      annualTotal: monthlyCounts.reduce((sum, count) => sum + (count ?? 0), 0),
      availableStart: coveredStart,
      availableEnd: coveredEnd,
      isPartial: coveredStart !== yearStart || coveredEnd !== yearEnd,
    });
  }

  return { hourly, daily, yearly, availableStart, availableEnd };
}
