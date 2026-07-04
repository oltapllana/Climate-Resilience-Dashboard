// Left-hand configuration panel: pick a station. Measurement, emission
// scenario and the period-of-record stats now live in the dashboard's filter
// bar (Dashboard.jsx). The map (right) and charts (below) react to those.

export default function ConfigPanel({
  markers,
  selectedId,
  onSelect,
  lang,
  t,
  onImportClick,
  importing,
  removeImported,
  canUpload,
}) {
  return (
    <aside className="config-panel">
      <div className="card">
        <h2>{t("configTitle")}</h2>

        {/* 1. Station */}
        <div className="cfg-block">
          <label className="cfg-label">{t("station")}</label>
          <div className="station-list">
            {markers.map((s) => (
              <div key={s.id} className={`station-item ${s.id === selectedId ? "active" : ""}`}>
                <button className="station-pick" onClick={() => onSelect(s.id)}>
                  <span className={`dot ${s.type}`} />
                  <span style={{ flex: 1 }}>
                    <span className="nm">{lang === "sq" ? s.name_sq : s.name_en}</span>
                    <br />
                    <span className="meta">
                      {s.measCount} {t("measurements")} · {t(s.type)}
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
          {canUpload && (
            <button className="import-btn import-btn-block" onClick={onImportClick} disabled={importing}>
              {importing ? t("importing") : `⬆ ${t("importData")}`}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
