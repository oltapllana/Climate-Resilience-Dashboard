const TEXT_FOLD_MAP = {
  "\u00eb": "e",
  "\u00cb": "e",
  "\u00e7": "c",
  "\u00c7": "c",
};

const BOUNDARY_FIELD_CANDIDATES = {
  municipality: [
    "municipality",
    "municipality_name",
    "komuna",
    "komuna_name",
    "mun_name",
    "admin2",
    "adm2_name",
  ],
  settlement: [
    "settlement",
    "settlement_name",
    "village",
    "village_name",
    "name",
    "name_sq",
    "vendbanimi",
    "place",
  ],
  id: ["id", "osm_id", "settlement_id", "boundary_id"],
};

const NORMALIZED_NAME_ALIASES = {
  obilic: "obiliq",
  podujevo: "podujeve",
  milosheve: "millosheve",
  turucice: "turiqice",
};

export function normalizeName(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/[\u00eb\u00cb\u00e7\u00c7]/g, (char) => TEXT_FOLD_MAP[char] || char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized
    .split(" ")
    .map((part) => (part === "lupq" ? "lupc" : part))
    .join(" ")
    .replace(/\b(oblic|obilic|podujevo|milosheve|turucice)\b/g, (part) => NORMALIZED_NAME_ALIASES[part] || part);
}

export function settlementKey(municipality, settlement) {
  const normalizedMunicipality = normalizeName(municipality);
  const normalizedSettlement = normalizeName(settlement);
  if (!normalizedMunicipality || !normalizedSettlement) return null;
  return `${normalizedMunicipality}::${normalizedSettlement}`;
}

function firstProperty(properties, candidates) {
  for (const key of candidates) {
    const value = properties?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return "";
}

export function getBoundaryProperties(feature) {
  const properties = feature?.properties || {};
  return {
    id: firstProperty(properties, BOUNDARY_FIELD_CANDIDATES.id),
    municipality: firstProperty(properties, BOUNDARY_FIELD_CANDIDATES.municipality),
    settlement: firstProperty(properties, BOUNDARY_FIELD_CANDIDATES.settlement),
  };
}

export function buildSettlementBoundaryIndex(boundaries) {
  const index = new Map();
  const features = Array.isArray(boundaries?.features) ? boundaries.features : [];

  features.forEach((feature) => {
    const props = getBoundaryProperties(feature);
    const key = settlementKey(props.municipality, props.settlement);
    if (key && !index.has(key)) index.set(key, feature);
  });

  return index;
}

export function matchStationsToSettlementBoundaries(stations, boundaryIndex) {
  const matched = new Map();
  const unmatched = [];

  stations.forEach((station) => {
    const key = settlementKey(station.municipality, station.settlement);
    const feature = key ? boundaryIndex.get(key) : null;

    if (feature) {
      const existing = matched.get(key);
      if (existing) {
        existing.stations.push(station);
      } else {
        matched.set(key, {
          key,
          feature,
          label: station.settlement || getBoundaryProperties(feature).settlement,
          municipality: station.municipality || getBoundaryProperties(feature).municipality,
          stations: [station],
        });
      }
      return;
    }

    unmatched.push({
      id: station.id,
      name: station.name_en || station.name_sq || station.id,
      municipality: station.municipality || "",
      settlement: station.settlement || "",
      lat: station.lat,
      lon: station.lon,
    });
  });

  return {
    matchedFeatureCollection: {
      type: "FeatureCollection",
      features: Array.from(matched.values()).map((item) => item.feature),
    },
    matchedSettlements: Array.from(matched.values()),
    unmatched,
  };
}
