// Rrezatimi 3: the days with the highest and lowest values on record.
//
// Ranked on the daily maximum (the `hi` field), not the daily mean: a day's
// solar potential is set by what it peaked at, and a mean would blend the peak
// with the night-time zeros either side of it.
export const DEFAULT_EXTREME_DAY_COUNT = 15;

function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult() {
  return { highest: [], lowest: [], observedDays: 0, firstDate: null, lastDate: null };
}

export function calculateExtremeValueDays(dailyRecords, { count = DEFAULT_EXTREME_DAY_COUNT, field = "hi" } = {}) {
  if (!Array.isArray(dailyRecords)) return emptyResult();

  const rows = dailyRecords
    .map((row) => ({
      date: String(row?.d ?? ""),
      // a series without a recorded daily range falls back to its mean
      value: parseValue(row?.[field]) ?? parseValue(row?.v),
    }))
    .filter((row) => /^\d{4}-\d{2}-\d{2}/.test(row.date) && row.value != null);
  if (!rows.length) return emptyResult();

  const dates = rows.map((row) => row.date).sort();
  // ties broken by date so the ranking is stable rather than input-order dependent
  const descending = [...rows].sort((a, b) => b.value - a.value || a.date.localeCompare(b.date));

  return {
    highest: descending.slice(0, count),
    lowest: [...rows]
      .sort((a, b) => a.value - b.value || a.date.localeCompare(b.date))
      .slice(0, count),
    observedDays: rows.length,
    firstDate: dates[0],
    lastDate: dates.at(-1),
  };
}
