import { ClimatologyChart, EvolutionChart, AnomaliesChart, DailyChart, WindRoseChart } from "./Charts.jsx";
import { WindRose } from "./WindRose.jsx";
import { WindRiskHeatmap } from "./WindRiskHeatmap.jsx";
import ScenarioChart from "./ScenarioChart.jsx";
import LandslideRainfallIndicator from "./LandslideRainfallIndicator.jsx";
import PrecipitationExtremesIndicator from "./PrecipitationExtremesIndicator.jsx";
import HotDaysIndicator from "./HotDaysIndicator.jsx";
import DrySpellsIndicator from "./DrySpellsIndicator.jsx";
import HotDaysInDrySpellsIndicator from "./HotDaysInDrySpellsIndicator.jsx";
import FreezeThawCyclesIndicator from "./FreezeThawCyclesIndicator.jsx";
import HeavySnowfallIndicator from "./HeavySnowfallIndicator.jsx";
import SnowfallIndicator from "./SnowfallIndicator.jsx";

function StatCards({ stats, unit, isSum, circular, t }) {
  // a compass bearing has no meaningful min/max (0° and 359° are 1° apart), and
  // its overall value is a vector mean — label it as the prevailing direction
  const cards = circular
    ? [
        { k: t("records"), v: stats.count.toLocaleString() },
        { k: t("prevailingDir"), v: stats.overall, u: unit },
      ]
    : [
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
  // chips sorted alphabetically by their label in the active language
  const measIds = Object.keys(data.measurements).sort((a, b) => {
    const la = lang === "sq" ? data.measurements[a].label_sq : data.measurements[a].label_en;
    const lb = lang === "sq" ? data.measurements[b].label_sq : data.measurements[b].label_en;
    return la.localeCompare(lb, lang);
  });
  const activeMeasId = data.measurements[measId] ? measId : measIds[0];
  const m = data.measurements[activeMeasId];
  const measurementName = lang === "sq" ? m.label_sq : m.label_en;
  const isSum = m.kind === "sum";
  const unit = m.unit;
  const accent = data.type === "hydro" ? "#2b7fc4" : "#2f7d32";
  const supportsRcp = activeMeasId === "air_temp" || activeMeasId === "rainfall";
  const rainIntensityHourly = data.measurements?.rain_intensity?.hourly;
  const hasValidRainIntensityHourly = Array.isArray(rainIntensityHourly) && rainIntensityHourly.some(
    (row) => !Number.isNaN(new Date(row?.d).getTime()) && Number.isFinite(Number(row?.v)) && Number(row.v) >= 0
  );
  const temperatureHourly = data.measurements?.air_temp?.hourly;
  const hasValidTemperatureHourly = Array.isArray(temperatureHourly) && temperatureHourly.some(
    (row) => !Number.isNaN(new Date(row?.d).getTime()) && Number.isFinite(Number(row?.v))
  );

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
          {/* measurement gets its own full-width row so many chips wrap cleanly */}
          <div className="filter-sec filter-meas">
            <label className="cfg-label">
              {t("measurement")} <span className="meas-count">({measIds.length})</span>
            </label>
            <div className="seg seg-wrap">
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

          <div className="filter-row">
            {supportsRcp && (
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
            )}

            <div className="filter-sec">
              <label className="cfg-label">
                {t("period")}: {m.stats.start} → {m.stats.end}
              </label>
              <StatCards stats={m.stats} unit={unit} isSum={isSum} circular={m.circular} t={t} />
            </div>
          </div>
        </div>
      </div>

      {/* RCP scenarios are climate projections for air temperature and rainfall,
          not for the dashboard's other sensor measurements. */}
      {supportsRcp && <ScenarioChart meas={m} scenario={scenario} t={t} unit={unit} />}

      {activeMeasId === "rain_intensity" && (
        <>
          <LandslideRainfallIndicator measurement={data.measurements.rain_intensity} t={t} />
          <PrecipitationExtremesIndicator measurement={data.measurements.rain_intensity} t={t} />
          {hasValidRainIntensityHourly && <DrySpellsIndicator measurement={data.measurements.rain_intensity} />}
        </>
      )}

      {(activeMeasId === "air_temp" || unit === "°C") && (
        <>
          <HotDaysIndicator measurement={m} t={t} />
          {activeMeasId === "air_temp" && hasValidTemperatureHourly && (
            <FreezeThawCyclesIndicator measurement={data.measurements.air_temp} />
          )}
        </>
      )}

      {(activeMeasId === "rain_intensity" || activeMeasId === "air_temp") && hasValidRainIntensityHourly && hasValidTemperatureHourly && (
        <>
          <HotDaysInDrySpellsIndicator
            rainfallMeasurement={data.measurements.rain_intensity}
            temperatureMeasurement={data.measurements.air_temp}
          />
          <SnowfallIndicator
            stationId={data.id}
            rainfallMeasurement={data.measurements.rain_intensity}
            temperatureMeasurement={data.measurements.air_temp}
          />
          <HeavySnowfallIndicator
            stationId={data.id}
            rainfallMeasurement={data.measurements.rain_intensity}
            temperatureMeasurement={data.measurements.air_temp}
          />
        </>
      )}

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
        {measId && measId.includes("wind_dir") && (() => {
          const speedId = Object.keys(data.measurements).find(id => id.includes("wind_speed"));
          return speedId ? (
            <div className="card chart-card">
              <h2>{t("windRose")}</h2>
              <WindRose
                directionData={m}
                speedData={data.measurements[speedId]}
                t={t}
              />
            </div>
          ) : null;
        })()}
        {measId && measId.includes("wind_speed") && (
          <div className="card chart-card">
            <h2>{t("windRiskHeatmap") || "Wind Risk Heatmap"}</h2>
            <WindRiskHeatmap
              speedData={m}
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
}
