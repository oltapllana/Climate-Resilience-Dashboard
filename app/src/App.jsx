import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "./components/MapView.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { makeT } from "./i18n.js";
import { importWorkbook } from "./lib/importExcel.js";

export default function App() {
  const [lang, setLang] = useState("en");
  const [builtin, setBuiltin] = useState([]); // index entries from stations.json
  const [imported, setImported] = useState([]); // full station objects
  const [selectedId, setSelectedId] = useState(null);
  const [activeData, setActiveData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const cache = useRef({}); // id -> full station data (built-in)
  const fileRef = useRef(null);

  const baseT = useMemo(() => makeT(lang), [lang]);
  const t = (k) => baseT(k);

  // load station index
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/stations.json`)
      .then((r) => r.json())
      .then((d) => {
        setBuiltin(d.stations);
        const def = d.stations.find((s) => s.id === "podujeve") || d.stations[0];
        setSelectedId(def?.id ?? null);
      });
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

  // combined markers for map + list
  const markers = useMemo(
    () => [
      ...builtin.map((s) => ({ ...s, measCount: s.measurements.length })),
      ...imported.map((s) => ({
        id: s.id,
        name_en: s.name_en,
        name_sq: s.name_sq,
        lat: s.lat,
        lon: s.lon,
        type: s.type,
        imported: true,
        measCount: Object.keys(s.measurements).length,
      })),
    ],
    [builtin, imported]
  );

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError("");
    try {
      const station = await importWorkbook(file);
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
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button className="import-btn" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? t("importing") : `⬆ ${t("importData")}`}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.txt,.csv"
              style={{ display: "none" }}
              onChange={onFile}
            />
            <div className="lang-toggle">
              <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
              <button className={lang === "sq" ? "active" : ""} onClick={() => setLang("sq")}>SQ</button>
            </div>
          </div>
        </header>

        {importError && <div className="error-banner">{importError}</div>}

        <div className="layout">
          <aside>
            <MapView stations={markers} selectedId={selectedId} onSelect={setSelectedId} t={t} lang={lang} />

            <div className="card" style={{ marginTop: 18 }}>
              <h2>{t("stations")}</h2>
              <p className="desc">{t("importHint")}</p>
              <div className="station-list">
                {markers.map((s) => (
                  <div key={s.id} className={`station-item ${s.id === selectedId ? "active" : ""}`}>
                    <button className="station-pick" onClick={() => setSelectedId(s.id)}>
                      <span className={`dot ${s.type}`} />
                      <span style={{ flex: 1 }}>
                        <span className="nm">{lang === "sq" ? s.name_sq : s.name_en}</span>
                        <br />
                        <span className="meta">
                          {s.measCount} {t("measurements")} · {t(s.type)}
                          {s.imported ? ` · ${t("imported")}` : ""}
                        </span>
                      </span>
                    </button>
                    {s.imported && (
                      <button className="remove-btn" title={t("removeStation")} onClick={() => removeImported(s.id)}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main>
            <Dashboard data={activeData} lang={lang} t={t} />
          </main>
        </div>

        <footer className="foot">{t("dataNote")}</footer>
      </div>
    </>
  );
}
