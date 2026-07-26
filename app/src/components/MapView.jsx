import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON, Marker, useMap } from "react-leaflet";
import { divIcon, geoJSON } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildSettlementBoundaryIndex,
  matchStationsToSettlementBoundaries,
} from "../lib/gis.js";

// Current study-area view. Settlement highlighting is data-driven and can
// extend beyond this boundary when a Kosovo-wide settlement file is provided.
const STUDY_AREA_CENTER = [42.911, 21.193];
const PODUJEVE_CITY = [42.911, 21.193];
const STUDY_AREA_STYLE = {
  color: "#0f766e",
  weight: 3,
  fillColor: "#14b8a6",
  fillOpacity: 0.08,
};
const SETTLEMENT_STYLE = {
  color: "#0f6f68",
  weight: 2,
  fillColor: "#14b8a6",
  fillOpacity: 0.23,
};
const CITY_HALO_STYLE = {
  color: "#0f766e",
  weight: 1.5,
  fillColor: "#0f766e",
  fillOpacity: 0.12,
};
const STATION_STYLE = {
  color: "#fff",
  weight: 2,
  fillOpacity: 0.85,
};

function FlyToStation({ station }) {
  const map = useMap();
  const hasSeenInitialSelection = useRef(false);
  const lat = station?.displayLat ?? station?.lat;
  const lon = station?.displayLon ?? station?.lon;
  useEffect(() => {
    // The dashboard automatically selects its first station while loading.
    // Keep the complete municipality visible for that initial selection; only
    // zoom after the user chooses another station.
    if (!hasSeenInitialSelection.current && Number.isFinite(lat) && Number.isFinite(lon)) {
      hasSeenInitialSelection.current = true;
      return;
    }

    // fly only when the selected station has coordinates; while it is still
    // being located stay put instead of snapping back to the default view
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], 12, { duration: 0.7 });
    }
  }, [station?.id, lat, lon, map]);
  return null;
}

function FitStudyArea({ boundary }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (!boundary || hasFitted.current) return;

    try {
      const bounds = geoJSON(boundary).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [24, 24],
          animate: false,
        });
        hasFitted.current = true;
      }
    } catch {
      // Retain the MapContainer fallback view if boundary data is malformed.
    }
  }, [boundary, map]);

  return null;
}

// Leaflet renders tiles for the size at mount time; when the map cell stretches
// to fill the row it grows afterwards, leaving grey gaps. Invalidate on resize.
function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    const id = setTimeout(() => map.invalidateSize(), 200);
    return () => {
      ro.disconnect();
      clearTimeout(id);
    };
  }, [map]);
  return null;
}

function createLabelIcon(label, className) {
  return divIcon({
    html: `<div class="${className}">${label}</div>`,
    className: "map-label-icon",
    iconSize: [90, 24],
    iconAnchor: [45, 12],
  });
}

function buildFallbackSettlementLabels(unmatchedStations) {
  const groups = new Map();

  unmatchedStations.forEach((station) => {
    const label = station.settlement || station.name;
    if (!label || !Number.isFinite(station?.lat) || !Number.isFinite(station?.lon)) return;

    const key = `${station.municipality || ""}:${label}`.toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.lat = (existing.lat * (existing.count - 1) + station.lat) / existing.count;
      existing.lon = (existing.lon * (existing.count - 1) + station.lon) / existing.count;
      return;
    }

    groups.set(key, {
      key,
      label,
      lat: station.lat,
      lon: station.lon,
      count: 1,
    });
  });

  return Array.from(groups.values());
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function subtractIntervals(intervals, cuts) {
  let remaining = intervals;
  cuts.forEach(([cutStart, cutEnd]) => {
    const next = [];
    remaining.forEach(([start, end]) => {
      if (cutEnd <= start || cutStart >= end) {
        next.push([start, end]);
        return;
      }
      if (cutStart > start) next.push([start, cutStart]);
      if (cutEnd < end) next.push([cutEnd, end]);
    });
    remaining = next;
  });
  return remaining;
}

function horizontalInteriorIntervals(ring, y) {
  const xs = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y)) {
      xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
    }
  }

  xs.sort((a, b) => a - b);
  const intervals = [];
  for (let i = 0; i + 1 < xs.length; i += 2) {
    if (xs[i + 1] > xs[i]) intervals.push([xs[i], xs[i + 1]]);
  }
  return intervals;
}

function polygonInteriorPoint(polygon) {
  const [outer, ...holes] = polygon || [];
  if (!outer?.length) return null;

  const ys = [...new Set(outer.map((point) => point[1]))].sort((a, b) => a - b);
  const scanYs = [];
  for (let i = 0; i + 1 < ys.length; i += 1) {
    if (ys[i + 1] > ys[i]) scanYs.push((ys[i] + ys[i + 1]) / 2);
  }
  if (!scanYs.length) return null;

  let best = null;
  scanYs.forEach((y) => {
    const holeIntervals = holes.flatMap((hole) => horizontalInteriorIntervals(hole, y));
    const intervals = subtractIntervals(horizontalInteriorIntervals(outer, y), holeIntervals);
    intervals.forEach(([start, end]) => {
      const width = end - start;
      if (!best || width > best.width) {
        best = { lon: (start + end) / 2, lat: y, width };
      }
    });
  });

  return best;
}

function getFeatureInteriorPoint(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return null;

  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];

  let best = null;
  polygons.forEach((polygon) => {
    const point = polygonInteriorPoint(polygon);
    const area = ringArea(polygon?.[0] || []);
    if (point && (!best || area > best.area)) {
      best = { ...point, area };
    }
  });

  return best ? { lat: best.lat, lon: best.lon } : null;
}

function getFeatureBoundsCenter(feature) {
  try {
    const bounds = geoJSON(feature).getBounds();
    if (bounds.isValid()) {
      const center = bounds.getCenter();
      return { lat: center.lat, lon: center.lng };
    }
  } catch {
    return null;
  }
  return null;
}

function buildStationDisplayPositions(matchedSettlements) {
  const positions = new Map();

  matchedSettlements.forEach((settlement) => {
    const point = getFeatureInteriorPoint(settlement.feature);
    if (!point) return;

    settlement.stations.forEach((station) => {
      positions.set(station.id, {
        lat: point.lat,
        lon: point.lon,
        source: "matched-settlement-polygon",
      });
    });
  });

  return positions;
}

function buildMatchedSettlementLabels(matchedSettlements) {
  return matchedSettlements
    .map((settlement) => {
      const center = getFeatureBoundsCenter(settlement.feature);
      if (!center) return null;
      return {
        key: settlement.key,
        label: settlement.label,
        lat: center.lat,
        lon: center.lon,
      };
    })
    .filter(Boolean);
}

export default function MapView({ stations, selectedId, onSelect, t, lang }) {
  const [studyAreaBoundary, setStudyAreaBoundary] = useState(null);
  const [settlementBoundaries, setSettlementBoundaries] = useState(null);
  const [settlementBoundaryStatus, setSettlementBoundaryStatus] = useState("loading");

  const settlementBoundaryIndex = useMemo(
    () => buildSettlementBoundaryIndex(settlementBoundaries),
    [settlementBoundaries]
  );
  const { matchedFeatureCollection, matchedSettlements, unmatched } = useMemo(
    () => matchStationsToSettlementBoundaries(stations, settlementBoundaryIndex),
    [stations, settlementBoundaryIndex]
  );
  const matchedSettlementLabels = useMemo(
    () => buildMatchedSettlementLabels(matchedSettlements),
    [matchedSettlements]
  );
  const fallbackSettlements = useMemo(() => buildFallbackSettlementLabels(unmatched), [unmatched]);
  const stationDisplayPositions = useMemo(
    () => buildStationDisplayPositions(matchedSettlements),
    [matchedSettlements]
  );
  const displayStations = useMemo(
    () =>
      stations.map((station) => {
        const displayPosition = stationDisplayPositions.get(station.id);
        return {
          ...station,
          displayLat: displayPosition?.lat ?? station.lat,
          displayLon: displayPosition?.lon ?? station.lon,
          displayPositionSource: displayPosition?.source ?? "approximate-station-metadata",
        };
      }),
    [stations, stationDisplayPositions]
  );

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}podujeve-boundary.geojson`)
      .then((r) => r.json())
      .then(setStudyAreaBoundary)
      .catch(() => setStudyAreaBoundary(null));
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}settlements-kosovo.geojson`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setSettlementBoundaries(data);
        setSettlementBoundaryStatus("loaded");
      })
      .catch((err) => {
        setSettlementBoundaries(null);
        setSettlementBoundaryStatus("missing");
        console.warn(
          "[GIS warning] Real village/settlement borders require public/settlements-kosovo.geojson. The map will keep station markers visible and show fallback labels, but it will not draw invented settlement polygons.",
          err
        );
      });
  }, []);

  useEffect(() => {
    if (settlementBoundaryStatus !== "loaded") return;
    unmatched.forEach((station) => {
      console.warn(
        "[GIS] No settlement polygon matched station; using approximate lat/lon for display",
        station
      );
    });
    matchedSettlements.forEach((settlement) => {
      settlement.stations.forEach((station) => {
        if (stationDisplayPositions.has(station.id)) return;
        console.warn(
          "[GIS] Matched settlement polygon has no usable interior display point; using approximate lat/lon for display",
          {
            id: station.id,
            municipality: station.municipality,
            settlement: station.settlement,
          }
        );
      });
    });
  }, [settlementBoundaryStatus, unmatched, matchedSettlements, stationDisplayPositions]);

  useEffect(() => {
    stations.forEach((station) => {
      if (!station.municipality || !station.settlement) {
        console.warn("[GIS] Station is missing municipality/settlement metadata", {
          id: station.id,
          name: station.name_en || station.name_sq,
          municipality: station.municipality,
          settlement: station.settlement,
        });
      }
    });
  }, [stations]);

  return (
    <div className="card map-card">
      <div className="map-head">
        <h2>{t("stations")}</h2>
      </div>
      <MapContainer center={STUDY_AREA_CENTER} zoom={11} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeHandler />
        <FitStudyArea boundary={studyAreaBoundary} />
        {studyAreaBoundary && (
          <GeoJSON
            data={studyAreaBoundary}
            style={STUDY_AREA_STYLE}
          />
        )}
        {matchedFeatureCollection.features.length > 0 && (
          <GeoJSON
            data={matchedFeatureCollection}
            style={SETTLEMENT_STYLE}
          />
        )}
        {matchedSettlementLabels.map((settlement) => (
          <Marker
            key={settlement.key}
            position={[settlement.lat, settlement.lon]}
            icon={createLabelIcon(settlement.label, "map-label settlement")}
          />
        ))}
        <CircleMarker
          center={PODUJEVE_CITY}
          radius={18}
          pathOptions={CITY_HALO_STYLE}
        />
        <Marker
          position={PODUJEVE_CITY}
          icon={createLabelIcon(t("city"), "map-label city")}
        />
        <FlyToStation station={displayStations.find((s) => s.id === selectedId)} />
        {displayStations.map((s) => {
          const active = s.id === selectedId;
          const color = s.type === "hydro" ? "#2b7fc4" : "#4a9d4a";
          return (
            <CircleMarker
              key={s.id}
              center={[s.displayLat, s.displayLon]}
              radius={active ? 11 : 8}
              pathOptions={{
                ...STATION_STYLE,
                fillColor: color,
                fillOpacity: active ? 1 : 0.85,
              }}
              eventHandlers={{ click: () => onSelect(s.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <strong>{lang === "sq" ? s.name_sq : s.name_en}</strong>
                <br />
                {s.measCount} {t("measurements")}
              </Tooltip>
            </CircleMarker>
          );
        })}
        {fallbackSettlements.map((settlement) => (
          <Marker
            key={settlement.key}
            position={[settlement.lat, settlement.lon]}
            icon={createLabelIcon(settlement.label, "map-label village")}
          />
        ))}
      </MapContainer>
      <div className="map-legend">
        <span><i className="legend-swatch boundary" /> {t("legendMunicipality")}</span>
        <span><i className="legend-swatch city" /> {t("legendSettlements")}</span>
        <span><i className="legend-swatch village" /> {t("legendFallbackLabels")}</span>
        <span><i className="legend-swatch station" /> {t("legendStations")}</span>
      </div>
    </div>
  );
}
