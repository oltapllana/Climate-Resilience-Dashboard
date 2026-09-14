// Stable semantic order, independent of translated labels and insertion order.
// Unknown measurement IDs follow the known groups in ID order.
const ORDER = ["air_temp", "humidity", "pressure", "rainfall", "rain_intensity", "solar", "wind_speed", "wind_dir", "water_level", "water_temp", "conductivity", "salinity", "tds"];

export function orderedMeasurementIds(measurements, hidden = new Set()) {
  const rank = (id) => {
    const index = ORDER.indexOf(id);
    return index < 0 ? ORDER.length : index;
  };
  return Object.keys(measurements).filter((id) => !hidden.has(id)).sort((a, b) =>
    rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0),
  );
}
