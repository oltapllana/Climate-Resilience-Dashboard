// Shared engine for the "daily series + 30-day rolling mean + long-term mean"
// charts: Rrezatimi 1 (solar radiation) and Shtypja 1 (air pressure). Both were
// marked OK by the reviewer apart from titling, so the same construction serves
// each and only labels differ at the component level.
const ROLLING_WINDOW_DAYS = 30;

function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult() {
  return { daily: [], longTermMean: null, maximum: null, minimum: null, count: 0 };
}

export function calculateDailyTrend(dailyRecords, { window = ROLLING_WINDOW_DAYS } = {}) {
  if (!Array.isArray(dailyRecords)) return emptyResult();

  const rows = dailyRecords
    .map((row) => ({ date: String(row?.d ?? ""), value: parseValue(row?.v) }))
    .filter((row) => row.date && row.value != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) return emptyResult();

  const daily = rows.map((row, index) => {
    const start = Math.max(0, index - window + 1);
    const slice = rows.slice(start, index + 1);
    return {
      date: row.date,
      value: row.value,
      // a partial window at the start of the record would read as a spurious
      // trend, so the rolling line only begins once a full window exists
      rolling: slice.length === window
        ? +(slice.reduce((sum, item) => sum + item.value, 0) / window).toFixed(2)
        : null,
    };
  });

  const values = rows.map((row) => row.value);
  const longTermMean = +(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);
  const maximum = rows.reduce((best, row) => (row.value > best.value ? row : best), rows[0]);
  const minimum = rows.reduce((best, row) => (row.value < best.value ? row : best), rows[0]);

  return { daily, longTermMean, maximum, minimum, count: rows.length };
}
