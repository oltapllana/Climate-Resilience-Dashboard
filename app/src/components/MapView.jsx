import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useState } from "react";

// Podujevë municipality center (Kosovo). Landing view is focused here.
const PODUJEVE = [42.911, 21.193];

function FlyToStation({ station }) {
  const map = useMap();
  useEffect(() => {
    if (station) map.flyTo([station.lat, station.lon], 12, { duration: 0.7 });
    else map.flyTo(PODUJEVE, 11, { duration: 0.7 });
  }, [station, map]);
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

export default function MapView({ stations, selectedId, onSelect, t, lang }) {
  const [boundary, setBoundary] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}podujeve-boundary.geojson`)
      .then((r) => r.json())
      .then(setBoundary)
      .catch(() => setBoundary(null));
  }, []);

  return (
    <div className="card map-card">
      <div className="map-head">
        <h2>{t("stations")}</h2>
      </div>
      <MapContainer center={PODUJEVE} zoom={11} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeHandler />
        {boundary && (
          <GeoJSON
            data={boundary}
            style={{ color: "#d6453d", weight: 2.5, fillColor: "#d6453d", fillOpacity: 0.04 }}
          />
        )}
        <FlyToStation station={stations.find((s) => s.id === selectedId)} />
        {stations.map((s) => {
          const active = s.id === selectedId;
          const color = s.type === "hydro" ? "#2b7fc4" : "#4a9d4a";
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lon]}
              radius={active ? 11 : 8}
              pathOptions={{
                color: "#fff",
                weight: 2,
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
      </MapContainer>
      <div className="map-legend">
        <span><i className="dot hydro" /> {t("legendHydro")}</span>
        <span><i className="dot meteo" /> {t("legendMeteo")}</span>
        <span><i className="boundary-swatch" /> {t("boundary")}</span>
      </div>
    </div>
  );
}
