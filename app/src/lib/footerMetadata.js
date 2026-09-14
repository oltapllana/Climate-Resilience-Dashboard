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
