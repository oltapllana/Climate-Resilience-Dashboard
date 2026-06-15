import { ClimatologyChart, EvolutionChart, AnomaliesChart, DailyChart } from "./Charts.jsx";
import ScenarioChart from "./ScenarioChart.jsx";

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
  const measurementName = lang === "sq" ? m.label_sq : m.label_en;
  const isSum = m.kind === "sum";
  const unit = m.unit;
  const accent = data.type === "hydro" ? "#2b7fc4" : "#2f7d32";

  return (
    <div>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="section-title compact">
          <h2>{name}</h2>
          <span className={`badge ${data.type}`}>{t(data.type)}</span>
          {data.imported && <span className="badge meteo">{t("imported")}</span>}
          <span className="active-meas">{measurementName} ({unit})</span>
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
