// Geocoding: turn a place name into coordinates via OpenStreetMap Nominatim.
// Free, no API key. Biased to Kosovo so local village/town names resolve well.
// Returns { lat, lon } on success, or null if nothing matched / the call failed.
const ENDPOINT = "https://nominatim.openstreetmap.org/search";

export async function geocodePlace(name, { country = "Kosovo" } = {}) {
  const cleaned = String(name || "")
    .replace(/\(.*?\)/g, " ") // drop parentheticals like "(town)" / "(reservoir)"
    .split("/")[0] // take the first of "Turiqicë / Orllan"
    .replace(/[_]+/g, " ")
    .trim();
  if (!cleaned) return null;
  const q = `${cleaned}, ${country}`;
  const url = `${ENDPOINT}?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const hits = await res.json();
    if (!Array.isArray(hits) || !hits.length) return null;
    const lat = parseFloat(hits[0].lat);
    const lon = parseFloat(hits[0].lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    return null;
  } catch {
    return null;
  }
}
