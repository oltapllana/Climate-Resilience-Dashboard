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
    <div className="stat-grid compact">
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

export default function Dashboard({ data, measId, setMeasId, scenario, setScenario, lang, t }) {
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
  const measurementName = lang === "sq" ? m.label_sq : m.label_en;
  const isSum = m.kind === "sum";
  const unit = m.unit;
  const accent = data.type === "hydro" ? "#2b7fc4" : "#2f7d32";

  return (
    <div>
      <div className="card filter-card" style={{ marginBottom: 18 }}>
        <div className="section-title compact">
          <h2>{name}</h2>
          <span className={`badge ${data.type}`}>{t(data.type)}</span>
          {data.imported && <span className="badge meteo">{t("imported")}</span>}
          <span className="active-meas">{measurementName} ({unit})</span>
        </div>

        {/* extracted filters: measurement · scenario · period of record */}
        <div className="filter-bar">
          <div className="filter-sec">
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

          <div className="filter-sec">
            <label className="cfg-label">{t("scenario")}</label>
            <div className="seg">
              {["rcp85", "rcp45", "all"].map((s) => (
                <button key={s} className={scenario === s ? "active" : ""} onClick={() => setScenario(s)}>
                  {s === "all" ? t("allScenarios") : s === "rcp45" ? "RCP4.5" : "RCP8.5"}
                </button>
              ))}
            </div>
            {scenario === "rcp85" && <p className="cfg-hint">{t("rcp85Hint")}</p>}
          </div>

          <div className="filter-sec">
            <label className="cfg-label">
              {t("period")}: {m.stats.start} → {m.stats.end}
            </label>
            <StatCards stats={m.stats} unit={unit} isSum={isSum} t={t} />
          </div>
        </div>
      </div>

      <ScenarioChart meas={m} scenario={scenario} t={t} unit={unit} />

      <div className="charts">
        <div className="card chart-card">
          <h2>{t("climatology")}</h2>
          <ClimatologyChart series={m} t={t} unit={unit} isSum={isSum} />
        </div>

        <div className="card chart-card">
          <h2>{t("evolution")}</h2>
          <EvolutionChart series={m} t={t} unit={unit} isSum={isSum} color={accent} />
        </div>

        <div className="card chart-card">
          <h2>{t("anomalies")}</h2>
          <AnomaliesChart series={m} t={t} unit={unit} />
        </div>

        <div className="card chart-card">
          <h2>{t("daily")}</h2>
          <DailyChart series={m} t={t} unit={unit} isSum={isSum} color={accent} />
        </div>
      </div>
    </div>
  );
}
