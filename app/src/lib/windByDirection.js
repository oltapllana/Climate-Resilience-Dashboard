// Era 4: mean wind speed per compass direction. The reviewer asked for the
// prevailing strong-wind direction to be highlighted rather than left to the
// reader, so the strongest sector is returned separately.
import { degreesToDirection } from "./windRose.js";

export const DIRECTIONS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult() {
  return { directions: [], strongest: null, count: 0 };
}

// Direction and speed are two separate measurements: pair them on the shared
// timestamp key so a reading only counts when both sensors reported.
export function calculateWindByDirection(directionSeries, speedSeries, key = "hourly") {
  const directionRows = directionSeries?.[key];
  const speedRows = speedSeries?.[key];
  if (!Array.isArray(directionRows) || !Array.isArray(speedRows)) return emptyResult();

  const speedByTime = new Map();
  for (const row of speedRows) {
    const speed = parseValue(row?.v);
    if (row?.d && speed != null) speedByTime.set(row.d, speed);
  }

  const buckets = new Map(DIRECTIONS.map((dir) => [dir, { sum: 0, count: 0, max: 0 }]));
  let count = 0;

  for (const row of directionRows) {
    const bearing = parseValue(row?.v);
    if (bearing == null || !row?.d) continue;
    const speed = speedByTime.get(row.d);
    if (speed == null) continue;
    const bucket = buckets.get(degreesToDirection(bearing));
    if (!bucket) continue;
    bucket.sum += speed;
    bucket.count += 1;
    bucket.max = Math.max(bucket.max, speed);
    count += 1;
  }
  if (!count) return emptyResult();

  const directions = DIRECTIONS.map((direction) => {
    const bucket = buckets.get(direction);
    return {
      direction,
      meanSpeed: bucket.count ? +(bucket.sum / bucket.count).toFixed(2) : null,
      maxSpeed: bucket.count ? +bucket.max.toFixed(1) : null,
      count: bucket.count,
      share: +((bucket.count / count) * 100).toFixed(1),
    };
  });

  const strongest = directions
    .filter((row) => row.meanSpeed != null)
    .reduce((best, row) => (best == null || row.meanSpeed > best.meanSpeed ? row : best), null);

  return { directions, strongest, count };
}
