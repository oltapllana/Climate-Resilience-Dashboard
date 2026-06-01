import { ClimatologyChart, EvolutionChart, AnomaliesChart, DailyChart } from "./Charts.jsx";
import ScenarioChart from "./ScenarioChart.jsx";

// Charts area (right/below the map). Station + measurement + scenario are now
// chosen in the left ConfigPanel and passed in as props.
export default function Dashboard({ data, measId, scenario, lang, t }) {
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
          <span className="active-meas">· {label} ({unit})</span>
        </div>
        <p className="desc">
          {t("period")}: {m.stats.start} → {m.stats.end}
        </p>
      </div>

      <ScenarioChart meas={m} scenario={scenario} t={t} unit={unit} label={label} />

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
