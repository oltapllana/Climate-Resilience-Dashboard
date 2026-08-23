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
import TropicalNightsIndicator from "./TropicalNightsIndicator.jsx";
import WindDiurnalCycle from "./WindDiurnalCycle.jsx";
import WindByDirection from "./WindByDirection.jsx";
import MonthlyRainfallIndicator from "./MonthlyRainfallIndicator.jsx";
import RainyDaysIndicator from "./RainyDaysIndicator.jsx";
import TopRainfallDays from "./TopRainfallDays.jsx";
import DailyTrendIndicator from "./DailyTrendIndicator.jsx";
import SolarDiurnalProfile from "./SolarDiurnalProfile.jsx";
import DiurnalPressureCycle from "./DiurnalPressureCycle.jsx";
import MonthlyExtremesRange from "./MonthlyExtremesRange.jsx";
import MonthlyMeanProfile from "./MonthlyMeanProfile.jsx";
import ExtremeValueDaysPanels from "./ExtremeValueDaysPanels.jsx";
import MonthYearHeatmap from "./MonthYearHeatmap.jsx";
import MonthlyTemperatureTrend from "./MonthlyTemperatureTrend.jsx";
import MonthlyTemperatureExtremes from "./MonthlyTemperatureExtremes.jsx";
import DiurnalTemperatureBySeason from "./DiurnalTemperatureBySeason.jsx";
import HeatStressIndicator from "./HeatStressIndicator.jsx";
import HeatColdEpisodes from "./HeatColdEpisodes.jsx";
import ExtremeDaysIndicator from "./ExtremeDaysIndicator.jsx";
import ThresholdHydrograph from "./ThresholdHydrograph.jsx";
import DurationCurve from "./DurationCurve.jsx";
import FloodFrequencyChart from "./FloodFrequencyChart.jsx";
import DilutionEventChart from "./DilutionEventChart.jsx";
import AnnualTrendChart from "./AnnualTrendChart.jsx";
import SeasonalBandChart from "./SeasonalBandChart.jsx";
import ExceedanceDaysChart from "./ExceedanceDaysChart.jsx";

// Water-chart constants live at module scope so they keep their identity
// between renders — the charts memoise on them, and a fresh array literal on
// every render would recompute a six-year series each time.
const LEVEL_BAND_STOPS = [99, 99.9];          // percentile ranks of the record
const THERMAL_BAND_STOPS = [4, 20, 25];       // °C, general aquatic-life guidance
const LEVEL_DURATION_MARKERS = [10, 95];      // L10 high water, L95 low water
const QUALITY_DURATION_MARKERS = [10, 90];

// the water-quality datasets (salinity, TDS, conductivity) share one pipeline:
// all three are derived from the same conductivity signal at this station
const WATER_QUALITY_MEAS = ["salinity", "tds", "conductivity"];

// Charts A–E carry the measurement's own name in their titles, and Albanian
// needs it in the genitive, so each series gets its own written-out string
// rather than one title with the name substituted in.
const WATER_TITLE_SERIES = { water_temp: "WaterTemp", salinity: "Salinity", tds: "Tds", conductivity: "Conductivity" };

// duration-curve markers are named after their series in the review's own
// notation — S10/S90 for salinity, TDS10/TDS90, C10/C90 — so a reader can carry
// a number from one chart to the next without translating it
const DURATION_CODE = { salinity: "S", tds: "TDS", conductivity: "C" };

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
  // both rainfall chips lead to the same set of rainfall charts
  const isRainMeas = activeMeasId === "rain_intensity" || activeMeasId === "rainfall";
  const windSpeedId = Object.keys(data.measurements).find((id) => id.includes("wind_speed"));
  const windDirId = Object.keys(data.measurements).find((id) => id.includes("wind_dir"));
  const isWindMeas = activeMeasId === windSpeedId || activeMeasId === windDirId;

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

      {/* ---- Reshje — rainfall -----------------------------------------
          Shown under either rainfall chip. Every chart here is computed from
          the hourly rain_intensity series, but someone looking for rainfall
          charts clicks "Reshjet" first, and hiding them there reads as though
          they were never built. */}
      {isRainMeas && data.measurements.rain_intensity && (
        <>
          <LandslideRainfallIndicator measurement={data.measurements.rain_intensity} t={t} />
          <PrecipitationExtremesIndicator measurement={data.measurements.rain_intensity} t={t} />
          {hasValidRainIntensityHourly && (
            <>
              <DrySpellsIndicator measurement={data.measurements.rain_intensity} />
              {/* Reshje 1 */}
              <MonthlyRainfallIndicator measurement={data.measurements.rain_intensity} t={t} />
              {/* Reshje 3 + 5 */}
              <RainyDaysIndicator measurement={data.measurements.rain_intensity} t={t} />
              <TopRainfallDays measurement={data.measurements.rain_intensity} t={t} />
            </>
          )}
        </>
      )}

      {/* ---- Era — wind -----------------------------------------------
          All four in the review's numbering. Era 2 and 3 used to sit in the
          generic chart grid at the foot of the page, one under each wind chip,
          which left the series unreadable as a series: you could never see more
          than two of the four at once, and never in order. Like the rainfall
          charts, both wind chips now lead to the same set. */}
      {isWindMeas && windSpeedId && (
        <>
          {/* Era 1 */}
          {activeMeasId === windSpeedId && (
            <WindDiurnalCycle speedMeasurement={data.measurements[windSpeedId]} t={t} />
          )}
          {/* Era 2 — the rose draws no title of its own, so the heading here is
              the one the reviewer asked for */}
          {windDirId && (
            <section className="card landslide-indicator">
              <div className="indicator-heading">
                <h2>{t("windRose")}</h2>
                <p>{t("windRoseDesc")}</p>
              </div>
              <WindRose
                directionData={data.measurements[windDirId]}
                speedData={data.measurements[windSpeedId]}
                t={t}
              />
            </section>
          )}
          {/* Era 3 — prints its own description line, so the heading is title only */}
          <section className="card landslide-indicator">
            <div className="indicator-heading">
              <h2>{t("windRiskHeatmap")}</h2>
            </div>
            <WindRiskHeatmap speedData={data.measurements[windSpeedId]} t={t} />
          </section>
          {/* Era 4 */}
          {windDirId && (
            <WindByDirection
              directionMeasurement={data.measurements[windDirId]}
              speedMeasurement={data.measurements[windSpeedId]}
              t={t}
            />
          )}
        </>
      )}

      {/* ---- Rrezatimi — solar radiation ------------------------------ */}
      {activeMeasId === "solar" && (
        <>
          {/* Rrezatimi 1 */}
          <DailyTrendIndicator
            measurement={m}
            unit={unit}
            title={t("solarTrendTitle")}
            description={t("solarTrendDesc")}
            axisLabel={t("solarTrendAxis")}
            explanation={t("solarTrendExplanation")}
            assumption={t("solarTrendAssumption")}
            dailyColor="#e8b04b"
            trendColor="#d6453d"
            digits={0}
            t={t}
          />
          {/* Rrezatimi 2 */}
          <MonthlyMeanProfile
            measurement={m}
            unit={unit}
            title={t("solarMonthlyTitle")}
            description={t("solarMonthlyDesc")}
            axisLabel={t("solarMonthlyAxis")}
            explanation={t("solarMonthlyExplanation")}
            assumption={t("solarMonthlyAssumption")}
            digits={0}
            t={t}
          />
          {/* Rrezatimi 3 */}
          <ExtremeValueDaysPanels
            measurement={m}
            unit={unit}
            title={t("solarExtremeDaysTitle")}
            description={t("solarExtremeDaysDesc")}
            axisLabel={t("solarPeakAxis")}
            highTitle={t("solarHighestDays").replace("{n}", 15)}
            lowTitle={t("solarLowestDays").replace("{n}", 15)}
            explanation={t("solarExtremeDaysExplanation")}
            assumption={t("solarExtremeDaysAssumption")}
            digits={0}
            t={t}
          />
          {/* Rrezatimi 4 */}
          <MonthYearHeatmap
            measurement={m}
            unit={unit}
            title={t("solarHeatmapTitle")}
            description={t("solarHeatmapDesc")}
            scaleLabel={t("solarHeatmapScale")}
            explanation={t("solarHeatmapExplanation")}
            assumption={t("solarHeatmapAssumption")}
            digits={0}
            t={t}
          />
          {/* Rrezatimi 5 */}
          <SolarDiurnalProfile measurement={m} t={t} />
        </>
      )}

      {/* ---- Shtypja — air pressure ----------------------------------- */}
      {activeMeasId === "pressure" && (
        <>
          {/* Shtypja 1 */}
          <DailyTrendIndicator
            measurement={m}
            unit={unit}
            title={t("pressureTrendTitle")}
            description={t("pressureTrendDesc")}
            axisLabel={t("pressureTrendAxis")}
            explanation={t("pressureTrendExplanation")}
            assumption={t("pressureTrendAssumption")}
            dailyColor="#8fb4d9"
            trendColor="#c63a2b"
            digits={1}
            t={t}
          />
          {/* Shtypja 2 */}
          <MonthlyExtremesRange
            measurement={m}
            unit={unit}
            title={t("pressureExtremesTitle")}
            description={t("pressureExtremesDesc")}
            axisLabel={t("pressureTrendAxis")}
            explanation={t("pressureExtremesExplanation")}
            assumption={t("pressureExtremesAssumption")}
            digits={1}
            t={t}
          />
          {/* Shtypja 3 */}
          <DiurnalPressureCycle measurement={m} unit={unit} t={t} />
        </>
      )}

      {/* ---- Temperatura — air temperature ---------------------------- */}
      {(activeMeasId === "air_temp" || unit === "°C") && (
        <>
          {activeMeasId === "air_temp" && hasValidTemperatureHourly && (
            <>
              {/* Temperatura 1 */}
              <MonthlyTemperatureTrend measurement={data.measurements.air_temp} t={t} />
              {/* Temperatura 2 + 3 */}
              <MonthlyTemperatureExtremes measurement={data.measurements.air_temp} t={t} />
              <DiurnalTemperatureBySeason measurement={data.measurements.air_temp} t={t} />
              {/* Temperatura 4 */}
              <HeatStressIndicator measurement={data.measurements.air_temp} t={t} />
              <HeatColdEpisodes measurement={data.measurements.air_temp} t={t} />
              {/* Temperatura 5 */}
              <ExtremeDaysIndicator measurement={data.measurements.air_temp} t={t} />
            </>
          )}
          {/* Kryesor 3 */}
          <HotDaysIndicator measurement={m} t={t} />
          {activeMeasId === "air_temp" && hasValidTemperatureHourly && (
            <>
              {/* Kryesor 6 */}
              <FreezeThawCyclesIndicator measurement={data.measurements.air_temp} />
              {/* Kryesor 9 — scoped to air temperature; it used to render under
                  every measurement that happened to have hourly temperature */}
              <TropicalNightsIndicator measurement={data.measurements.air_temp} />
            </>
          )}
        </>
      )}

      {/* ---- Water-level 1, 3, 5 -------------------------------------- */}
      {activeMeasId === "water_level" && (
        <>
          <ThresholdHydrograph
            measurement={m}
            unit={unit}
            title={t("waterLevelHydrographTitle")}
            description={t("waterLevelHydrographDesc")}
            axisLabel={`${measurementName} (${unit})`}
            mode="percentile"
            stops={LEVEL_BAND_STOPS}
            bands={[
              { label: t("bandNormal"), color: "#2f7d32" },
              { label: t("bandAlert"), color: "#e0a52b" },
              { label: t("bandWarning"), color: "#e07b2b" },
              { label: t("bandDanger"), color: "#c1452c" },
            ]}
            explanation={t("waterLevelHydrographExplanation")}
            assumption={t("waterLevelHydrographAssumption")}
            digits={2}
            t={t}
          />
          <DurationCurve
            measurement={m}
            unit={unit}
            title={t("levelDurationTitle")}
            description={t("levelDurationDesc")}
            axisLabel={`${measurementName} (${unit})`}
            markers={LEVEL_DURATION_MARKERS}
            markerLabels={{ high: t("levelHighWater"), low: t("levelLowWater") }}
            logScale
            shadeLowWater
            explanation={t("levelDurationExplanation")}
            assumption={t("levelDurationAssumption")}
            digits={2}
            t={t}
          />
          <FloodFrequencyChart
            measurement={m}
            unit={unit}
            title={t("floodFrequencyTitle")}
            description={t("floodFrequencyDesc")}
            axisLabel={`${t("annualMaximum")} (${unit})`}
            explanation={t("floodFrequencyExplanation")}
            assumption={t("floodFrequencyAssumption")}
            digits={2}
            t={t}
          />
        </>
      )}

      {/* ---- Water temperature Chart A -------------------------------- */}
      {activeMeasId === "water_temp" && (
        <ThresholdHydrograph
          measurement={m}
          unit={unit}
          title={t("thermalHydrographTitle")}
          description={t("thermalHydrographDesc")}
          axisLabel={`${measurementName} (${unit})`}
          mode="fixed"
          stops={THERMAL_BAND_STOPS}
          bands={[
            { label: t("bandCold"), color: "#2b7fc4" },
            { label: t("bandOptimal"), color: "#2f7d32" },
            { label: t("bandWarmStress"), color: "#e0a52b" },
            { label: t("bandCritical"), color: "#c1452c" },
          ]}
          explanation={t("thermalHydrographExplanation")}
          assumption={t("thermalHydrographAssumption")}
          digits={1}
          t={t}
        />
      )}

      {/* ---- Salinity / TDS / conductivity Chart A --------------------- */}
      {WATER_QUALITY_MEAS.includes(activeMeasId) && data.measurements.water_level && (
        <DilutionEventChart
          measurement={m}
          levelMeasurement={data.measurements.water_level}
          unit={unit}
          levelUnit={data.measurements.water_level.unit}
          title={t(`dilutionTitle${WATER_TITLE_SERIES[activeMeasId]}`)}
          description={t("dilutionDesc")}
          axisLabel={`${measurementName} (${unit})`}
          levelAxisLabel={`${lang === "sq" ? data.measurements.water_level.label_sq : data.measurements.water_level.label_en} (${data.measurements.water_level.unit})`}
          seriesLabel={measurementName}
          levelLabel={lang === "sq" ? data.measurements.water_level.label_sq : data.measurements.water_level.label_en}
          explanation={t("dilutionExplanation")}
          assumption={t("dilutionAssumption")}
          digits={2}
          t={t}
        />
      )}

      {/* ---- Charts B–E, shared by water temperature and the three
          water-quality series: same processing, same reading, different
          units and thresholds. ---------------------------------------- */}
      {(activeMeasId === "water_temp" || WATER_QUALITY_MEAS.includes(activeMeasId)) && (
        <>
          <AnnualTrendChart
            measurement={m}
            unit={unit}
            title={t(`annualTrendTitle${WATER_TITLE_SERIES[activeMeasId]}`)}
            description={t("annualTrendDesc")}
            axisLabel={`${measurementName} (${unit})`}
            bars={activeMeasId === "water_temp" ? "range" : "max"}
            explanation={t("annualTrendExplanation")}
            assumption={t("annualTrendAssumption")}
            digits={activeMeasId === "water_temp" ? 1 : 2}
            t={t}
          />
          <SeasonalBandChart
            measurement={m}
            unit={unit}
            title={t(`seasonalClimatologyTitle${WATER_TITLE_SERIES[activeMeasId]}`)}
            description={t("seasonalClimatologyDesc")}
            axisLabel={`${measurementName} (${unit})`}
            explanation={t("seasonalClimatologyExplanation")}
            assumption={t("seasonalClimatologyAssumption")}
            digits={activeMeasId === "water_temp" ? 1 : 2}
            t={t}
          />
          <DurationCurve
            measurement={m}
            unit={unit}
            title={t(`durationCurveTitle${WATER_TITLE_SERIES[activeMeasId]}`)}
            description={t("durationCurveDesc")}
            axisLabel={`${measurementName} (${unit})`}
            markers={QUALITY_DURATION_MARKERS}
            markerLabels={
              activeMeasId === "water_temp"
                ? { high: t("durationWarmEnd"), low: t("durationColdEnd") }
                : {
                    high: t("durationElevated").replace("{code}", DURATION_CODE[activeMeasId]),
                    low: t("durationDilute").replace("{code}", DURATION_CODE[activeMeasId]),
                  }
            }
            explanation={t("durationCurveExplanation")}
            assumption={`${t("durationCurveAssumption")} ${t("durationMarkerNote")}`}
            digits={activeMeasId === "water_temp" ? 1 : 2}
            t={t}
          />
          <ExceedanceDaysChart
            measurement={m}
            unit={unit}
            title={t(`exceedanceDaysTitle${WATER_TITLE_SERIES[activeMeasId]}`)}
            description={t("exceedanceDaysDesc")}
            axisLabel={t("exceedanceShareAxis")}
            explanation={t("exceedanceDaysExplanation")}
            assumption={t("exceedanceDaysAssumption")}
            digits={activeMeasId === "water_temp" ? 1 : 2}
            t={t}
          />
        </>
      )}

      {/* ---- Kryesor 5, 7, 8 — need rainfall and temperature together -- */}
      {(isRainMeas || activeMeasId === "air_temp") && hasValidRainIntensityHourly && hasValidTemperatureHourly && (
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
      </div>
    </div>
  );
}
