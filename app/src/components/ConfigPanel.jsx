// Left-hand configuration panel: pick a station, a measurement, and the
// emission scenario. The map (right) and charts (below) react to these.

function StatCards({ stats, unit, isSum, t }) {
  const cards = [
    { k: t("records"), v: stats.count.toLocaleString() },
    { k: isSum ? t("total") : t("mean"), v: stats.overall, u: unit },
    { k: t("min"), v: stats.min, u: unit },
    { k: t("max"), v: stats.max, u: unit },
  ];
  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <div className="stat" key={c.k}>
          <div className="k">{c.k}</div>
          <div className="v">{c.v}</div>
          <div className="u">{c.u || ""}</div>
        </div>
      ))}
    </div>
  );
}

export default function ConfigPanel({
  markers,
  selectedId,
  onSelect,
  data,
  measId,
  setMeasId,
  scenario,
  setScenario,
  lang,
  t,
  onImportClick,
  importing,
  removeImported,
}) {
  const m = data && (data.measurements[measId] || Object.values(data.measurements)[0]);
  const measIds = data ? Object.keys(data.measurements) : [];

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
          <button className="import-btn import-btn-block" onClick={onImportClick} disabled={importing}>
            {importing ? t("importing") : `⬆ ${t("importData")}`}
          </button>
        </div>

        {/* 2. Measurement */}
        {data && (
          <div className="cfg-block">
            <label className="cfg-label">{t("measurement")}</label>
            <div className="seg">
              {measIds.map((id) => {
                const mm = data.measurements[id];
                return (
                  <button key={id} className={id === measId ? "active" : ""} onClick={() => setMeasId(id)}>
                    {lang === "sq" ? mm.label_sq : mm.label_en}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Scenario */}
        <div className="cfg-block">
          <label className="cfg-label">{t("scenario")}</label>
          <div className="seg">
            {["rcp85", "rcp45", "all"].map((s) => (
              <button key={s} className={scenario === s ? "active" : ""} onClick={() => setScenario(s)}>
                {s === "all" ? t("allScenarios") : s === "rcp45" ? "RCP4.5" : "RCP8.5"}
              </button>
            ))}
          </div>
          <p className="cfg-hint">{scenario === "rcp85" ? t("rcp85Hint") : ""}</p>
        </div>

        {/* 4. Stats for the selected measurement */}
        {m && (
          <div className="cfg-block">
            <label className="cfg-label">
              {t("period")}: {m.stats.start} → {m.stats.end}
            </label>
            <StatCards stats={m.stats} unit={m.unit} isSum={m.kind === "sum"} t={t} />
          </div>
        )}
      </div>
    </aside>
  );
}
