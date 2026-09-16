// stats.end is the last valid observation's calendar date, not an ingestion time.
export function latestObservationDate(stations) {
  let latest = null;
  for (const station of stations) {
    for (const measurement of Object.values(station.measurements ?? {})) {
      const day = measurement.stats?.end;
      if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      const parsed = new Date(`${day}T00:00:00Z`);
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) continue;
      if (!latest || day > latest) latest = day;
    }
  }
  return latest;
}

function validObservationTimestamp(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?)?$/);
  if (!match) return null;
  const normalized = match[2] ? `${match[1]}T${match[2]}` : match[1];
  const parsed = new Date(`${normalized}${match[2] ? ":00" : "T00:00:00"}Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === match[1] ? normalized : null;
}

function latestSeriesTimestamp(rows) {
  if (!Array.isArray(rows)) return null;
  let latest = null;
  for (const row of rows) {
    const value = validObservationTimestamp(row?.d ?? row?.date);
    if (value && (!latest || value > latest)) latest = value;
  }
  return latest;
}

// Prefer an actual observation timestamp, falling back to the date-only
// summary when a source does not retain hourly timestamps.
export function latestObservationTimestamp(stations) {
  let latest = null;
  for (const station of stations) {
    for (const measurement of Object.values(station.measurements ?? {})) {
      const candidates = [
        latestSeriesTimestamp(measurement.hourly),
        latestSeriesTimestamp(measurement.daily),
        validObservationTimestamp(measurement.stats?.end),
      ];
      for (const candidate of candidates) {
        if (candidate && (!latest || candidate > latest)) latest = candidate;
      }
    }
  }
  return latest;
}

export function displayObservationTimestamp(value) {
  return value?.includes("T") ? value.replace("T", " ") : value;
}
