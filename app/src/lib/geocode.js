// Geocoding: turn a place name into coordinates via OpenStreetMap Nominatim.
// Free, no API key. Biased to Kosovo so local village/town names resolve well.
// Returns { lat, lon } on success, or null if nothing matched / the call failed.
//
// Successful lookups are cached in localStorage so the map fills instantly on
// repeat visits, and network requests are throttled here (Nominatim allows
// ~1 req/s) so callers don't have to pace themselves.
const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const CACHE_PREFIX = "geocode:";

function cacheGet(q) {
  try {
    const v = localStorage.getItem(CACHE_PREFIX + q);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function cacheSet(q, val) {
  try {
    localStorage.setItem(CACHE_PREFIX + q, JSON.stringify(val));
  } catch {
    /* storage full / unavailable: just skip caching */
  }
}

// each network call reserves the next 1.1s slot; cache hits skip this entirely
let nextSlot = 0;
async function lookup(q) {
  const wait = Math.max(0, nextSlot - Date.now());
  nextSlot = Date.now() + wait + 1100;
  if (wait) await new Promise((r) => setTimeout(r, wait));
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

export async function geocodePlace(name, { country = "Kosovo" } = {}) {
  // "Turiqicë / Orllan" -> try "Turiqicë", then "Orllan"; drop "(town)" etc.
  const parts = String(name || "")
    .replace(/\(.*?\)/g, " ")
    .split("/")
    .map((p) => p.replace(/[_]+/g, " ").trim())
    .filter(Boolean);
  for (const part of parts) {
    const q = `${part}, ${country}`;
    const cached = cacheGet(q);
    if (cached) return cached;
    const hit = await lookup(q);
    if (hit) {
      cacheSet(q, hit);
      return hit;
    }
  }
  return null;
}
