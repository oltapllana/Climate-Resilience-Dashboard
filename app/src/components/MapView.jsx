import { createInitialViewController } from "../lib/mapViewPolicy.js";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, GeoJSON, Marker, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
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

function FlyToStation({ station }) {
  const map = useMap();
  const previousId = useRef(null);
  useEffect(() => {
    if (!station || previousId.current === station.id) return;
    const initial = previousId.current == null;
    previousId.current = station.id;
    const lat = station.displayLat ?? station.lat;
    const lon = station.displayLon ?? station.lon;
    // Loading settlement geometry or switching language is not a new selection.
    if (!initial && Number.isFinite(lat) && Number.isFinite(lon)) map.flyTo([lat, lon], 12, { duration: 0.7, animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  }, [station, map]);
  return null;
}

function FitStudyArea({ boundary, stations, boundaryReady, selectedId }) {
  const map = useMap();
  const controller = useRef(createInitialViewController());
  const previousSelection = useRef(null);
  useEffect(() => {
    const container = map.getContainer();
    const interact = () => controller.current.interact();
    const events = ["pointerdown", "wheel", "keydown"];
    events.forEach(event => container.addEventListener(event, interact, { capture: true, passive: true }));
    return () => events.forEach(event => container.removeEventListener(event, interact, true));
  }, [map]);
  useEffect(() => {
    if (previousSelection.current != null && selectedId !== previousSelection.current) controller.current.interact();
    previousSelection.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    controller.current.fit(map, boundary, stations, boundaryReady);
  }, [map, boundary, stations, boundaryReady]);
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

export default function MapView({ stations, selectedId, onSelect, t, lang }) {
  const [studyAreaBoundary, setStudyAreaBoundary] = useState(null);
  const [boundaryReady, setBoundaryReady] = useState(false);
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
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setStudyAreaBoundary)
      .catch(() => setStudyAreaBoundary(null))
      .finally(() => setBoundaryReady(true));
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
          "[GIS warning] Real village/settlement borders require public/settlements-kosovo.geojson. The map will keep named station markers available, but it will not draw invented settlement polygons.",
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
      <MapContainer center={STUDY_AREA_CENTER} zoom={11} zoomSnap={0.25} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeHandler />
        <FitStudyArea boundary={studyAreaBoundary} stations={displayStations} boundaryReady={boundaryReady} selectedId={selectedId} />
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
        <CircleMarker
          center={PODUJEVE_CITY}
          radius={18}
          pathOptions={CITY_HALO_STYLE}
        />
        <FlyToStation station={displayStations.find((s) => s.id === selectedId)} />
        {displayStations.map((s) => {
          const active = s.id === selectedId;
          const name = lang === "sq" ? s.name_sq : s.name_en;
          const size = active ? 22 : 16;
          return (
            <Marker
              key={s.id + ":" + lang}
              position={[s.displayLat, s.displayLon]}
              title={name} alt={name} keyboard={true}
              icon={divIcon({ html: "", className: `station-map-icon ${s.type === "hydro" ? "hydro" : "meteo"} ${active ? "active" : ""}`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })}
              eventHandlers={{ click: () => onSelect(s.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <strong>{lang === "sq" ? s.name_sq : s.name_en}</strong>
                <br />
                {s.measCount} {t("measurements")}
              </Tooltip>
              <Popup><strong>{name}</strong><br />{s.measCount} {t("measurements")}</Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="map-legend">
        <span><i className="legend-swatch boundary" /> {t("legendMunicipality")}</span>
        <span><i className="legend-swatch city" /> {t("legendSettlements")}</span>
        <span><i className="legend-swatch station" /> {t("legendStations")}</span>
      </div>
    </div>
  );
}
