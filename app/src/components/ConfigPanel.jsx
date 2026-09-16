// Left-hand configuration panel: pick a station. Measurement and the
// period-of-record stats live in the dashboard's filter bar (Dashboard.jsx).
import { useId } from "react";

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
  const groupId = useId();
  return (
    <aside className="config-panel">
      <div className="card">
        <h2>{t("configTitle")}</h2>

        {/* 1. Station */}
        <fieldset className="cfg-block station-fieldset">
          <legend className="cfg-label">{t("station")}</legend>
          <div className="station-list">
            {markers.map((s, index) => (
              <div key={s.id} className={`station-item ${s.id === selectedId ? "active" : ""}`}>
                <label className="station-pick">
                  <input type="radio" name={groupId} value={s.id} checked={s.id === selectedId}
                    onChange={() => onSelect(s.id)} aria-labelledby={`${groupId}-${index}-name`}
                    aria-describedby={`${groupId}-${index}-meta`} />
                  <span style={{ flex: 1 }}>
                    <span className="nm" id={`${groupId}-${index}-name`}>{lang === "sq" ? s.name_sq : s.name_en}</span>
                    <br />
                    <span className="meta" id={`${groupId}-${index}-meta`}>
                      {s.measCount} {t("measurements")} · {t(s.type)}
                    </span>
                  </span>
                </label>
                {s.imported && (
                  <button
                    type="button"
                    className="remove-btn"
                    aria-label={t("removeStationNamed", { station: lang === "sq" ? s.name_sq : s.name_en })}
                    title={t("removeStationNamed", { station: lang === "sq" ? s.name_sq : s.name_en })}
                    onClick={() => removeImported(s.id)}
                  >
                    <svg className="remove-icon" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                      <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
                    </svg>
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
        </fieldset>
      </div>
    </aside>
  );
}
