import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "./components/MapView.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ConfigPanel from "./components/ConfigPanel.jsx";
import { makeT } from "./i18n.js";
import { importWorkbook, dedupeMeasurements, KNOWN_STATIONS } from "./lib/importExcel.js";
import { geocodePlace } from "./lib/geocode.js";
import { loadSavedStations, saveStation, deleteStation } from "./lib/stationsStore.js";
import { supabaseEnabled } from "./lib/supabase.js";
import { useAuth } from "./lib/useAuth.js";
import AuthBar from "./components/AuthBar.jsx";

// Podujevë municipality center: fallback when a station name cannot be geocoded
const FALLBACK = { lat: 42.911, lon: 21.193 };

// a station is "unlocated" when it has no coordinates or is still parked on
// the fallback spot (saved before its name could be geocoded successfully)
const unlocated = (s) =>
  !Number.isFinite(s.lat) ||
  !Number.isFinite(s.lon) ||
  (s.lat === FALLBACK.lat && s.lon === FALLBACK.lon);

export default function App() {
  const [lang, setLang] = useState("en");
  const [imported, setImported] = useState([]); // full station objects (all data is uploaded)
  const [selectedId, setSelectedId] = useState(null);
  const [measId, setMeasId] = useState(null);
  const [scenario, setScenario] = useState("rcp85"); // worst-case is the default headline
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef(null);
  const { session } = useAuth();
  // uploading requires sign-in; if Supabase isn't configured, allow local-only imports
  const canUpload = !supabaseEnabled || Boolean(session);

  const baseT = useMemo(() => makeT(lang), [lang]);
  const t = (k) => baseT(k);

  // load previously saved (user-imported) stations from Supabase on startup.
  // Known stations are snapped to their fixed catalogue coordinates/names (so
  // once-bad geocodes can't stick); unknown ones get a geocoding retry if they
  // are still parked on the fallback spot.
  useEffect(() => {
    let cancelled = false;
    const catalogue = new Map(KNOWN_STATIONS.map((k) => [k.id, k]));
    loadSavedStations().then(async (saved) => {
      if (cancelled || !saved.length) return;
      const list = saved.map((s) => {
        // fold stale "wind_dir_2"-style duplicates from older imports back
        // into their base measurement
        const measurements = dedupeMeasurements(s.measurements);
        if (measurements !== s.measurements) s = { ...s, measurements };
        // The landslide-indicator specification defines rainfall intensity as
        // mm/h. Correct legacy saved metadata that used the old mm/min label;
        // values themselves were never converted during import.
        if (s.measurements?.rain_intensity && s.measurements.rain_intensity.unit !== "mm/h") {
          s = {
            ...s,
            measurements: {
              ...s.measurements,
              rain_intensity: {
                ...s.measurements.rain_intensity,
                unit: "mm/h",
              },
            },
          };
        }
        const k = catalogue.get(s.id);
        if (k)
          return {
            ...s,
            name_en: k.name_en,
            name_sq: k.name_sq,
            municipality: k.municipality,
            settlement: k.settlement,
            lat: k.lat,
            lon: k.lon,
          };
        return unlocated(s) ? { ...s, ...FALLBACK } : s;
      });
      setImported(list);
      setSelectedId((prev) => prev ?? list[0].id);
      // persist any corrections so they survive without a re-upload
      list.forEach((s, i) => {
        const o = saved[i];
        if (
          s.lat !== o.lat ||
          s.lon !== o.lon ||
          s.name_en !== o.name_en ||
          s.settlement !== o.settlement ||
          s.measurements !== o.measurements
        )
          saveStation(s);
      });
      for (const s of list) {
        if (catalogue.has(s.id) || !unlocated(s)) continue;
        const geo = await geocodePlace(s.name_en);
        if (cancelled) return;
        if (geo) {
          setImported((prev) =>
            prev.map((x) => (x.id === s.id ? { ...x, lat: geo.lat, lon: geo.lon } : x))
          );
          saveStation({ ...s, lat: geo.lat, lon: geo.lon });
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // all station data lives in memory (uploaded or loaded from Supabase)
  const activeData = useMemo(
    () => imported.find((s) => s.id === selectedId) || null,
    [imported, selectedId]
  );

  // keep the selected measurement valid for the active station
  useEffect(() => {
    if (!activeData) return;
    const ids = Object.keys(activeData.measurements);
    setMeasId((prev) => (prev && ids.includes(prev) ? prev : ids[0]));
  }, [activeData]);

  // station entries: the full list feeds the sidebar; the map only gets the
  // ones that already have coordinates (Leaflet needs finite lat/lon)
  const markers = useMemo(
    () =>
      imported
        .map((s) => ({
          id: s.id,
          name_en: s.name_en,
          name_sq: s.name_sq,
          // municipality/settlement drive the settlement-boundary overlay
          municipality: s.municipality,
          settlement: s.settlement,
          lat: s.lat,
          lon: s.lon,
          type: s.type,
          imported: true,
          measCount: Object.keys(s.measurements).length,
        }))
        // most measurements first; alphabetical among equals
        .sort((a, b) => b.measCount - a.measCount || a.name_en.localeCompare(b.name_en)),
    [imported]
  );
  const mapMarkers = useMemo(
    () => markers.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)),
    [markers]
  );

  async function onFile(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImporting(true);
    setImportError("");
    // work on a local copy so several files can merge into the same station
    let list = imported;
    const touched = new Set(); // station ids changed in this batch
    const errors = [];
    for (const file of files) {
      try {
        const station = await importWorkbook(file);
        // Group by station: the file name is matched to one of the known
        // stations (Lluzhan, Turiqicë/Orllan, Lupç, Milloshevë, Batllavë,
        // Kërpimeh, Podujevë, Pollatë, Shajkoc), so every file for the same
        // place merges into one station instead of adding a second marker.
        const existing = list.find((s) => s.id === station.id);
        let merged;
        if (existing) {
          const measurements = { ...existing.measurements, ...station.measurements };
          // drop leftover "wind_dir_2"-style duplicates from older imports once
          // a re-upload delivers the consolidated base measurement
          for (const key of Object.keys(measurements)) {
            const m = key.match(/^(.+)_\d+$/);
            if (m && station.measurements[m[1]] && !station.measurements[key]) {
              delete measurements[key];
            }
          }
          const cleaned = dedupeMeasurements(measurements);
          merged = {
            ...existing,
            // refresh names + settlement metadata so catalogue updates reach saved stations
            name_en: station.name_en,
            name_sq: station.name_sq,
            municipality: station.municipality,
            settlement: station.settlement,
            measurements: cleaned,
            type: Object.values(cleaned).some((m) => m.cat === "hydro") ? "hydro" : "meteo",
          };
          if (Number.isFinite(station.lat) && Number.isFinite(station.lon)) {
            // known station: snap to the fixed catalogue coordinates
            merged.lat = station.lat;
            merged.lon = station.lon;
          } else if (unlocated(merged)) {
            // retry geocoding for stations still parked on the fallback spot
            const geo = await geocodePlace(merged.name_en);
            if (geo) {
              merged.lat = geo.lat;
              merged.lon = geo.lon;
            }
          }
        } else if (Number.isFinite(station.lat) && Number.isFinite(station.lon)) {
          // known station: fixed catalogue coordinates, no geocoding needed
          merged = station;
        } else {
          // Auto-locate: geocode the station name; fall back to Podujevë center if not found.
          const geo = await geocodePlace(station.name_en);
          merged = {
            ...station,
            lat: geo ? geo.lat : FALLBACK.lat,
            lon: geo ? geo.lon : FALLBACK.lon,
          };
        }
        list = [...list.filter((s) => s.id !== merged.id), merged];
        touched.add(merged.id);
        setImported(list);
        setSelectedId(merged.id);
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }
    // persist each changed station to Supabase once (no-op if unconfigured)
    for (const id of touched) {
      const st = list.find((s) => s.id === id);
      if (st) {
        const saveError = await saveStation(st);
        if (saveError) errors.push(`${st.name_en}: ${saveError.message}`);
      }
    }
    if (errors.length) setImportError(`${t("importError")}: ${errors.join(" · ")}`);
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImported(id) {
    const remaining = imported.filter((s) => s.id !== id);
    setImported(remaining);
    deleteStation(id); // remove from Supabase too (no-op if unconfigured)
    if (selectedId === id) setSelectedId(remaining[0]?.id ?? null);
  }

  return (
    <>
      <div className="topbar" />
      <div className="app">
        <header className="masthead">
          <div className="title">
            <h1>{t("appTitle")}</h1>
            <p>{t("appSubtitle")}</p>
          </div>
          <div className="header-right">
            <AuthBar session={session} t={t} />
            <div className="lang-toggle">
              <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
              <button className={lang === "sq" ? "active" : ""} onClick={() => setLang("sq")}>SQ</button>
            </div>
          </div>
        </header>

        {importError && <div className="error-banner">{importError}</div>}

        {/* top row: configuration panel (left) + map (right) */}
        <div className="top-row">
          <ConfigPanel
            markers={markers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            lang={lang}
            t={t}
            onImportClick={() => fileRef.current?.click()}
            importing={importing}
            removeImported={removeImported}
            canUpload={canUpload}
          />
          <MapView stations={mapMarkers} selectedId={selectedId} onSelect={setSelectedId} t={t} lang={lang} />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.txt,.csv"
          multiple
          style={{ display: "none" }}
          onChange={onFile}
        />

        {/* charts span the full width below */}
        <main className="charts-area">
          <Dashboard
            data={activeData}
            measId={measId}
            setMeasId={setMeasId}
            scenario={scenario}
            setScenario={setScenario}
            lang={lang}
            t={t}
          />
        </main>

      </div>
    </>
  );
}
