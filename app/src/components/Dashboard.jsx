import { useEffect, useState } from "react";
import { ClimatologyChart, EvolutionChart, AnomaliesChart, DailyChart } from "./Charts.jsx";
import ScenarioChart from "./ScenarioChart.jsx";

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

export default function Dashboard({ data, lang, t }) {
  const [measId, setMeasId] = useState(null);

  useEffect(() => {
    if (!data) return;
    const ids = Object.keys(data.measurements);
    setMeasId((prev) => (prev && ids.includes(prev) ? prev : ids[0]));
  }, [data]);

  if (!data) {
    return (
      <div className="card">
        <div className="empty">{t("selectStationHint")}</div>
      </div>
    );
  }

  const name = lang === "sq" ? data.name_sq : data.name_en;
  const measIds = Object.keys(data.measurements);
  const m = data.measurements[measId] || data.measurements[measIds[0]];
  const label = lang === "sq" ? m.label_sq : m.label_en;
  const isSum = m.kind === "sum";
  const unit = m.unit;
  const accent = data.type === "hydro" ? "#2b7fc4" : "#2f7d32";

  return (
    <div>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="section-title">
          <h2>{name}</h2>
          <span className={`badge ${data.type}`}>{t(data.type)}</span>
          {data.imported && <span className="badge meteo">{t("imported")}</span>}
        </div>
        <p className="desc">
          {t("period")}: {m.stats.start} → {m.stats.end}
        </p>

        <div className="controls">
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

        <StatCards stats={m.stats} unit={unit} isSum={isSum} t={t} />
      </div>

      <ScenarioChart meas={m} t={t} unit={unit} label={label} />

      <div className="charts">
        <div className="card chart-card">
          <h2>{t("climatology")}</h2>
          <p className="desc">{t("climatologyDesc")} · {label} ({unit})</p>
          <ClimatologyChart series={m} t={t} unit={unit} isSum={isSum} />
        </div>

        <div className="card chart-card">
          <h2>{t("evolution")}</h2>
          <p className="desc">{t("evolutionDesc")} · {label} ({unit})</p>
          <EvolutionChart series={m} t={t} unit={unit} isSum={isSum} color={accent} />
        </div>

        <div className="card chart-card">
          <h2>{t("anomalies")}</h2>
          <p className="desc">{t("anomaliesDesc")} · {label} ({unit})</p>
          <AnomaliesChart series={m} t={t} unit={unit} />
        </div>

        <div className="card chart-card">
          <h2>{t("daily")}</h2>
          <p className="desc">{t("dailyDesc")} · {label} ({unit})</p>
          <DailyChart series={m} t={t} unit={unit} isSum={isSum} color={accent} />
        </div>
      </div>
    </div>
  );
}
