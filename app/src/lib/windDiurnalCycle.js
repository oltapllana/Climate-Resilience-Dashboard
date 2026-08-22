// Era 1: diurnal wind-speed cycle — mean speed by hour of day, averaged across
// the whole record. Requires hourly wind-speed observations.
function parseHour(timestamp) {
  const match = String(timestamp ?? "").match(/T(\d{2}):/);
  return match ? Number(match[1]) : null;
}

function parseSpeed(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult() {
  return { hourly: [], overallMean: null, peakHour: null, troughHour: null, count: 0 };
}

export function calculateWindDiurnalCycle(hourlyRecords) {
  if (!Array.isArray(hourlyRecords) || !hourlyRecords.length) return emptyResult();

  const sums = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));
  let total = 0;
  let count = 0;

  for (const row of hourlyRecords) {
    const hour = parseHour(row?.d);
    const speed = parseSpeed(row?.v);
    if (hour == null || speed == null) continue;
    sums[hour].sum += speed;
    sums[hour].count += 1;
    total += speed;
    count += 1;
  }
  if (!count) return emptyResult();

  const hourly = sums.map((bucket, hour) => ({
    hour,
    mean: bucket.count ? +(bucket.sum / bucket.count).toFixed(3) : null,
    count: bucket.count,
  }));

  const withValues = hourly.filter((row) => row.mean != null);
  const peakHour = withValues.reduce((best, row) => (best == null || row.mean > best.mean ? row : best), null);
  const troughHour = withValues.reduce((best, row) => (best == null || row.mean < best.mean ? row : best), null);

  return {
    hourly,
    overallMean: +(total / count).toFixed(3),
    peakHour,
    troughHour,
    count,
  };
}
