// Shtypja 2: the monthly maximum/minimum envelope of a measurement.
//
// Extremes come from the daily lo/hi fields, which hold the true minimum and
// maximum of the raw samples for that day. Using the daily mean instead would
// report a monthly "maximum" that no instrument ever recorded.
function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult() {
  return { monthly: [], absoluteMax: null, absoluteMin: null, widest: null, observedDays: 0, firstDate: null, lastDate: null };
}

export function calculateMonthlyExtremes(dailyRecords) {
  if (!Array.isArray(dailyRecords)) return emptyResult();

  const rows = dailyRecords
    .map((row) => {
      const mean = parseValue(row?.v);
      const low = parseValue(row?.lo);
      const high = parseValue(row?.hi);
      return {
        date: String(row?.d ?? ""),
        // a series without a recorded daily range collapses to its mean
        min: low ?? mean,
        max: high ?? mean,
      };
    })
    .filter((row) => /^\d{4}-\d{2}-\d{2}/.test(row.date) && row.min != null && row.max != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) return emptyResult();

  const byMonth = new Map();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    const bucket = byMonth.get(key) ?? { month: key, max: -Infinity, min: Infinity, maxDate: null, minDate: null, observedDays: 0 };
    if (row.max > bucket.max) {
      bucket.max = row.max;
      bucket.maxDate = row.date;
    }
    if (row.min < bucket.min) {
      bucket.min = row.min;
      bucket.minDate = row.date;
    }
    bucket.observedDays += 1;
    byMonth.set(key, bucket);
  }

  const monthly = [...byMonth.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((bucket) => ({
      ...bucket,
      max: +bucket.max.toFixed(2),
      min: +bucket.min.toFixed(2),
      range: +(bucket.max - bucket.min).toFixed(2),
    }));

  const absoluteMax = monthly.reduce((best, row) => (best == null || row.max > best.max ? row : best), null);
  const absoluteMin = monthly.reduce((best, row) => (best == null || row.min < best.min ? row : best), null);
  // the most unsettled month — the widest gap between the extremes
  const widest = monthly.reduce((best, row) => (best == null || row.range > best.range ? row : best), null);

  return {
    monthly,
    absoluteMax: { value: absoluteMax.max, month: absoluteMax.month, date: absoluteMax.maxDate },
    absoluteMin: { value: absoluteMin.min, month: absoluteMin.month, date: absoluteMin.minDate },
    widest: { range: widest.range, month: widest.month },
    observedDays: rows.length,
    firstDate: rows[0].date,
    lastDate: rows.at(-1).date,
  };
}
