// Rrezatimi 5: hourly solar profile by season.
//
// The reviewer asked for the values to be expressed in hours (h) rather than
// W/m². One hour at the WMO reference irradiance of 3600 W/m² accumulates
// 1 solar-hour, so hours = mean W/m² / 3600 for a one-hour interval.
export const SOLAR_HOUR_REFERENCE_W_M2 = 3600;

export const SEASON_DEFINITIONS = [
  { id: "spring", months: [3, 4, 5], color: "#4a9d4a" },
  { id: "summer", months: [6, 7, 8], color: "#c63a2b" },
  { id: "autumn", months: [9, 10, 11], color: "#e0a52b" },
  { id: "winter", months: [12, 1, 2], color: "#2b7fc4" },
];

// The reviewer's proposal marks 09:00–15:00 as the usable window for solar energy.
export const OPTIMAL_WINDOW = { start: 9, end: 15 };

function parseParts(timestamp) {
  const match = String(timestamp ?? "").match(/^(\d{4})-(\d{2})-\d{2}T(\d{2}):/);
  return match ? { month: Number(match[2]), hour: Number(match[3]) } : null;
}

function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function standardDeviation(values, mean) {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function emptyResult() {
  return { seasons: [], peak: null, count: 0 };
}

export function calculateSolarDiurnalProfile(hourlyRecords) {
  if (!Array.isArray(hourlyRecords) || !hourlyRecords.length) return emptyResult();

  const buckets = new Map();
  let count = 0;
  for (const row of hourlyRecords) {
    const parts = parseParts(row?.d);
    const value = parseValue(row?.v);
    if (!parts || value == null) continue;
    const season = SEASON_DEFINITIONS.find((item) => item.months.includes(parts.month));
    if (!season) continue;
    const key = `${season.id}:${parts.hour}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(value);
    buckets.set(key, bucket);
    count += 1;
  }
  if (!count) return emptyResult();

  const seasons = SEASON_DEFINITIONS.map((season) => {
    const hours = [];
    for (let hour = 0; hour < 24; hour += 1) {
      const values = buckets.get(`${season.id}:${hour}`) ?? [];
      if (!values.length) {
        hours.push({ hour, meanWattsPerSquareMetre: null, hoursEquivalent: null, spread: null, count: 0 });
        continue;
      }
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      hours.push({
        hour,
        meanWattsPerSquareMetre: +mean.toFixed(1),
        hoursEquivalent: +(mean / SOLAR_HOUR_REFERENCE_W_M2).toFixed(4),
        spread: +(standardDeviation(values, mean) / SOLAR_HOUR_REFERENCE_W_M2).toFixed(4),
        count: values.length,
      });
    }
    const best = hours
      .filter((item) => item.hoursEquivalent != null)
      .reduce((top, item) => (top == null || item.hoursEquivalent > top.hoursEquivalent ? item : top), null);
    return {
      season: season.id,
      color: season.color,
      hours,
      peakHour: best?.hour ?? null,
      peakHoursEquivalent: best?.hoursEquivalent ?? null,
      dailyTotalHours: +hours.reduce((sum, item) => sum + (item.hoursEquivalent ?? 0), 0).toFixed(3),
    };
  });

  const peak = seasons
    .filter((season) => season.peakHoursEquivalent != null)
    .reduce((top, season) => (top == null || season.peakHoursEquivalent > top.peakHoursEquivalent ? season : top), null);

  return { seasons, peak, count };
}
