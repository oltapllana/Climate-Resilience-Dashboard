import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "./components/MapView.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ConfigPanel from "./components/ConfigPanel.jsx";
import { makeT } from "./i18n.js";
import { importWorkbook } from "./lib/importExcel.js";
import { geocodePlace } from "./lib/geocode.js";

export default function App() {
  const [lang, setLang] = useState("en");
  const [builtin, setBuiltin] = useState([]); // index entries from stations.json
  const [imported, setImported] = useState([]); // full station objects
  const [selectedId, setSelectedId] = useState(null);
  const [activeData, setActiveData] = useState(null);
  const [measId, setMeasId] = useState(null);
  const [scenario, setScenario] = useState("rcp85"); // worst-case is the default headline
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const cache = useRef({}); // id -> full station data (built-in)
  const fileRef = useRef(null);

  const baseT = useMemo(() => makeT(lang), [lang]);
  const t = (k) => baseT(k);

  // Load station index with explicit GIS metadata. Built-in stations should carry
  // municipality, settlement, lat, and lon; geocoding is only a fallback for imports.
  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/stations.json`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const stations = Array.isArray(d.stations) ? d.stations : [];
        setBuiltin(stations);
        const def = stations.find((s) => s.id === "podujeve") || stations[0];
        setSelectedId(def?.id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // resolve full data for the selected station (imported in-memory, else fetch)
  useEffect(() => {
    if (!selectedId) {
      setActiveData(null);
      return;
    }
    const imp = imported.find((s) => s.id === selectedId);
    if (imp) {
      setActiveData(imp);
      return;
    }
    if (cache.current[selectedId]) {
      setActiveData(cache.current[selectedId]);
      return;
    }
    setActiveData(null);
    fetch(`${import.meta.env.BASE_URL}data/${selectedId}.json`)
      .then((r) => r.json())
      .then((d) => {
        cache.current[selectedId] = d;
        setActiveData(d);
      });
  }, [selectedId, imported]);

  // keep the selected measurement valid for the active station
  useEffect(() => {
    if (!activeData) return;
    const ids = Object.keys(activeData.measurements);
    setMeasId((prev) => (prev && ids.includes(prev) ? prev : ids[0]));
  }, [activeData]);

  // combined markers for map + list
  const markers = useMemo(
    () =>
      [
        ...builtin.map((s) => ({ ...s, measCount: s.measurements.length })),
        ...imported.map((s) => ({
          id: s.id,
          name_en: s.name_en,
          name_sq: s.name_sq,
          municipality: s.municipality,
          settlement: s.settlement,
          lat: s.lat,
          lon: s.lon,
          type: s.type,
          imported: true,
          measCount: Object.keys(s.measurements).length,
        })),
      ].filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)),
    [builtin, imported]
  );

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError("");
    try {
      const station = await importWorkbook(file);
      // Imported files may not include GIS metadata. Keep geocoding as a best-effort
      // fallback, but built-in station coordinates come from stations.json.
      if (!Number.isFinite(station.lat) || !Number.isFinite(station.lon)) {
        const geo = await geocodePlace(station.name_en);
        if (geo) {
          station.lat = geo.lat;
          station.lon = geo.lon;
        }
      }
      if (!station.settlement) station.settlement = station.name_en;
      if (!station.municipality) station.municipality = "";
      setImported((prev) => {
        const others = prev.filter((s) => s.id !== station.id);
        return [...others, station];
      });
      setSelectedId(station.id);
    } catch (err) {
      setImportError(`${t("importError")}: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImported(id) {
    setImported((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) {
      const def = builtin.find((s) => s.id === "podujeve") || builtin[0];
      setSelectedId(def?.id ?? null);
    }
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
          <div className="lang-toggle">
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "sq" ? "active" : ""} onClick={() => setLang("sq")}>SQ</button>
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
          />
          <MapView stations={markers} selectedId={selectedId} onSelect={setSelectedId} t={t} lang={lang} />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.txt,.csv"
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
