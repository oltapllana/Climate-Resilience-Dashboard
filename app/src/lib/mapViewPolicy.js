function boundsOf(points) {
  const valid = points.filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180);
  if (!valid.length) return null;
  let south = 90, west = 180, north = -90, east = -180;
  for (const [lat, lon] of valid) {
    south = Math.min(south, lat); north = Math.max(north, lat);
    west = Math.min(west, lon); east = Math.max(east, lon);
  }
  return [[south, west], [north, east]];
}

export function initialMapBounds(boundary, stations = []) {
  const points = [];
  function coordinates(value) {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") points.push([value[1], value[0]]);
    else value.forEach(coordinates);
  }
  function geometry(value) {
    if (!value) return;
    if (value.type === "FeatureCollection") { if (Array.isArray(value.features)) value.features.forEach(geometry); }
    else if (value.type === "Feature") geometry(value.geometry);
    else if (value.type === "GeometryCollection") { if (Array.isArray(value.geometries)) value.geometries.forEach(geometry); }
    else coordinates(value.coordinates);
  }
  geometry(boundary);
  return boundsOf(points) ?? boundsOf(stations.map(s => [s.displayLat ?? s.lat, s.displayLon ?? s.lon]));
}

// A delayed boundary response must never override a user's pan/zoom/selection.
export function createInitialViewController() {
  let finished = false;
  return {
    interact() { finished = true; },
    fit(map, boundary, stations, boundaryReady) {
      if (finished || !boundaryReady) return false;
      const bounds = initialMapBounds(boundary, stations);
      if (!bounds) return false; // Keep existing center/zoom until reliable data arrives.
      map.fitBounds(bounds, { padding: [16, 16], maxZoom: 12, animate: false });
      finished = true;
      return true;
    },
  };
}
