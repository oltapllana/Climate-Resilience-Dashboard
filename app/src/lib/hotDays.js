function parseTimestamp(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = String(value).trim();
  if (!text) return null;

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date;

  const match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):?(\d{2})?(?::?(\d{2}))?)?/);
  if (match) {
    const [, day, month, year, hours = "0", minutes = "0", seconds = "0"] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function parseTemperature(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function localDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPartialYear(dateKey, year) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return dateKey < start || dateKey > end;
}

export function calculateHotDays(hourlyRecords) {
  if (!Array.isArray(hourlyRecords)) {
    return { hourly: [], daily: [], yearly: [], recordMax: { date: null, temperature: null } };
  }

  const readings = hourlyRecords
    .map((row) => {
      const timestamp = parseTimestamp(row?.d ?? row?.timestamp ?? row?.ts ?? row?.date);
      const temperature = parseTemperature(row?.v ?? row?.value ?? row?.temp ?? row?.temperature);
      if (!timestamp || temperature == null) return null;
      return { timestamp, temperature };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (!readings.length) {
    return { hourly: [], daily: [], yearly: [], recordMax: { date: null, temperature: null } };
  }

  const dailyMap = new Map();
  for (const reading of readings) {
    const dateKey = localDayKey(reading.timestamp);
    const current = dailyMap.get(dateKey) || { date: dateKey, dailyMax: -Infinity };
    if (reading.temperature > current.dailyMax) {
      current.dailyMax = reading.temperature;
      dailyMap.set(dateKey, current);
    }
  }

  const daily = [...dailyMap.values()].sort((a, b) => (a.date < b.date ? -1 : 1));

  const years = [...new Set(daily.map((row) => Number(row.date.slice(0, 4))))].sort((a, b) => a - b);
  const yearly = years.map((year) => {
    const rows = daily.filter((row) => Number(row.date.slice(0, 4)) === year);
    const days30 = rows.filter((row) => row.dailyMax >= 30).length;
    const days40 = rows.filter((row) => row.dailyMax >= 40).length;
    const firstDate = rows[0]?.date ?? null;
    const lastDate = rows.at(-1)?.date ?? null;
    const isPartial = rows.length ? (firstDate !== `${year}-01-01` || lastDate !== `${year}-12-31`) : false;
    return { year, days30, days40, isPartial };
  });

  const recordMax = daily.reduce(
    (current, row) => (current.temperature == null || row.dailyMax > current.temperature ? { date: row.date, temperature: row.dailyMax } : current),
    { date: null, temperature: null }
  );

  return { hourly: readings, daily, yearly, recordMax };
}
