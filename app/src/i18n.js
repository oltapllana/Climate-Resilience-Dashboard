// Lightweight i18n: English + Albanian (Shqip). Measurement/station labels
// come from the data files (label_en / label_sq, name_en / name_sq).

export const STRINGS = {
  en: {
    appTitle: "Podujevë Climate Resilience Dashboard",
    appSubtitle: "Hydro-meteorological monitoring of the Llap basin",
    stations: "Monitoring stations",
    configTitle: "Configuration",
    station: "Station",
    measurement: "Measurement",
    scenario: "Emission scenario",
    rcp85Hint: "Worst-case high-emission pathway (strongest projected trend).",
    allStations: "All stations",
    hydro: "Hydrological",
    meteo: "Meteorological",
    overview: "Overview",
    climatology: "Monthly Climatology",
    climatologyDesc: "Average monthly profile across all years of record",
    evolution: "Annual Trend",
    evolutionDesc: "Monthly mean of the selected measurement over time",
    anomalies: "Monthly Anomalies",
    anomaliesDesc: "Deviation of each month from the long-term monthly average",
    daily: "Daily Detail",
    dailyDesc: "Daily values with min–max range",
    windRose: "Wind Rose",
    windRoseDesc: "Wind direction and speed distribution",
    windRiskHeatmap: "Wind Risk Heatmap",
    windRiskDescription: "Percentage of hours with strong wind conditions",
    hourOfDay: "Hour of Day",
    dataSource: "Source: direct monitoring data",
    wmoStandard: "WMO standard for meteorological data representation (WMO-No. 8, Guide to Meteorological Instruments and Methods of Observation, 2018 Ed.)",
    meanWindSpeed: "Mean wind speed",
    maxWindSpeed: "Max wind speed",
    calm: "Calm",
    totalRecords: "Records",
    windSpeed: "Wind Speed",
    windRoseNote: "Frequency is shown as percentage of total observations",
    selectStationHint: "Select a station on the map or from the list to explore its data.",
    period: "Period of measurement",
    records: "Measurements",
    mean: "Mean",
    min: "Min",
    max: "Max",
    total: "Total",
    prevailingDir: "Prevailing direction",
    estMonthNote: "(estimated — month only partly observed)",
    month: "Month",
    date: "Date",
    value: "Value",
    year: "Year",
    legendHydro: "Hydrological station",
    legendMeteo: "Meteorological station",
    legendMunicipality: "Municipality boundary",
    legendSettlements: "Matched settlement polygons",
    legendFallbackLabels: "Unmatched settlement labels",
    legendStations: "Measurement points",
    boundary: "Podujevë municipality",
    city: "Podujevë city",
    measurements: "measurements",
    noData: "No data available for this selection.",
    dataNote:
      "Data: hydro-meteo sensor network, Llap basin (Podujevë). Aggregated from raw measurements.",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    anomalyAbove: "Above average",
    anomalyBelow: "Below average",
    rangeBand: "Min–max range",
    longTermProjection: "Long-Term Projection",
    scenarioTitle: "Monthly Profile to 2050",
    scenarioDesc: "Historic monthly profile (2021–2026) and projected bands 2026–2030 / 2031–2040 / 2041–2050",
    allScenarios: "All scenarios",
    historic: "historic",
    zoomHint: "Drag across the chart to zoom",
    resetZoom: "Reset zoom",
    forecastTitle: "Forecast",
    forecastDesc: "Full observed record extended by a 5-month projection under each scenario",
    observed: "Observed",
    partialDataNote: "Starts {start}",
    projectionNote:
      "Note: scenarios are a simplified statistical projection of the observed trend in the local data (RCP8.5 = stronger trend), not IPCC climate-model output.",
    landslideTitle: "Critical rainfall conditions for landslides",
    landslideSubtitle: "Annual worst-case event per duration vs. the intensity-duration threshold",
    landslideDaysTitle: "Days meeting the threshold",
    landslideDaysSubtitle: "Any 1–5 day window ending that day exceeded its threshold",
    landslideXAxis: "Rainfall duration (days)",
    landslideYAxis: "Mean rainfall intensity (mm/h, log scale)",
    landslideBarYAxis: "Critical days per year",
    landslideDuration: "Duration",
    landslideMaximum: "Maximum intensity",
    landslideThreshold: "Critical threshold",
    landslideExceeded: "exceeded",
    landslideNotExceeded: "not exceeded",
    landslideCriticalDays: "Critical days",
    days: "days",
    indicatorLoading: "Calculating indicator…",
    landslideNoData: "This station has no rainfall-intensity data.",
    landslideNoRainfall: "This station has no rainfall-depth data in millimetres.",
    landslideLegacyData: "This station contains only aggregated rainfall records. Their original timing and value semantics are unavailable, so this indicator cannot be calculated reliably.",
    landslideUnknownSemantics: "Rainfall values were preserved, but their incremental/cumulative meaning is not confirmed. The indicator is unavailable until source metadata is configured.",
    landslideIncompleteWindows: "No complete 1–5 day window is available. Missing or outage intervals are kept unknown and excluded.",
    landslideNoHourly: "Rainfall-intensity data exists, but hourly values are unavailable. The 1–5 day indicator cannot be calculated safely.",
    landslideInvalidUnit: "The configured rainfall-intensity source unit is not supported.",
    landslideCalculationError: "The rainfall indicator could not be calculated.",
    landslideExplanation:
      "This indicator identifies days when rainfall intensity over a 1–5 day period exceeded the configured landslide threshold. It indicates critical rainfall conditions, not a confirmed landslide occurrence.",
    landslideUnitAssumption:
      "Unit assumption: source rainfall intensity is configured as {unit} and converted explicitly to mm/h.",
    landslideZeroFillWarning:
      "Hours without readings are treated as dry (zero); sensor outages may therefore be hidden.",
    landslideMethodologyNote:
      "Rainfall intensity is interpreted as mm/h according to the indicator specification. Values are averaged within each clock hour. Hours without logged readings are treated as zero rainfall. These are documented reconstruction assumptions.",
    landslideDepthSourceNote:
      "Source: confirmed rainfall-depth observations in mm; values are never derived from hourly rainfall-intensity means.",
    landslideUnknownHoursWarning:
      "Missing intervals remain unknown unless sensor metadata explicitly proves that no record means dry.",
    importData: "Import Excel",
    importing: "Reading file…",
    importHint: "Upload an .xlsx / .xls / .txt sensor file (e.g. Prishtina climate). It is parsed in your browser and added as a station.",
    imported: "Imported",
    importError: "Could not read this file",
    removeStation: "Remove",
    signIn: "Sign in",
    signOut: "Sign out",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "Password",
    signedInAs: "Signed in as",
    authError: "Could not sign in",

    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",
    peak: "Peak",
    coverage: "Coverage",
    partialYear: "partial year",
    observedDays: "Observed days",
    standardDeviation: "standard deviation",
    completeYearsCounted: "Complete years used",
    longTermMean: "Long-term mean",
    rollingMean30: "30-day rolling mean",

    windDiurnalTitle: "Wind speed through the day",
    windDiurnalDesc: "Mean wind speed by hour of day (m/s), averaged over the whole record.",
    windDiurnalExplanation:
      "Wind speed follows a daily cycle: calm overnight, strengthening after sunrise as the surface heats, peaking in the early afternoon, then easing again after sunset.",
    windDiurnalAssumption:
      "Each hour averages every observation logged at that clock hour across the record; seasons are not separated here.",
    meanSpeedAxis: "Mean wind speed (m/s)",

    windByDirectionTitle: "Wind speed by direction",
    windByDirectionDesc: "Mean wind speed for each of the 16 compass sectors.",
    windByDirectionExplanation:
      "This shows how strong the wind is when it blows from each direction, separate from how often it blows from there (that is the wind rose).",
    windByDirectionAssumption:
      "Direction and speed are paired on the shared timestamp, so a reading counts only when both sensors reported.",
    windDirectionAxis: "Wind direction",
    strongestWindsFrom: "Strongest winds come from",

    monthlyRainfallTitle: "Mean monthly rainfall",
    monthlyRainfallDesc: "Average rainfall per calendar month with the between-year standard deviation.",
    monthlyRainfallAxis: "Mean monthly rainfall (mm)",
    monthlyRainfallExplanation:
      "Bars are coloured by season. The whiskers show the standard deviation between years — a long whisker means that month varies a great deal from one year to the next.",
    monthlyRainfallAssumption:
      "Depths are reconstructed from hourly rainfall intensity (one clock-hour of mm/h equals mm of depth); intensity readings are never summed directly. Only calendar months observed end to end contribute to a mean, so partially recorded months are excluded rather than read as dry.",
    highestRainfallMonth: "Month with the highest rainfall",

    rainyDaysTitle: "Rain days per year",
    rainyDaysDesc: "Days with at least 1 mm, split by how much rain fell.",
    rainyDaysMonthlyTitle: "Rain days by month (all years combined)",
    rainyDaysMonthlyDesc: "Every January, every February… of the record pooled together, so a bar can exceed 31 days. The line is the share of observed days.",
    rainyDaysAxis: "Rain days",
    rainyDaysAxisAllYears: "Rain days (all years)",
    rainDays: "Rain days",
    rainDaysAllYears: "Rain days, all years",
    rainDaysPerYear: "Average per year",
    yearSingular: "year",
    yearPlural: "years",
    shareOfDays: "Share of observed days",
    rainyDaysExplanation:
      "A rain day is a calendar day with at least 1 mm of rainfall — the same convention the dry-spells indicator uses, so the two are directly comparable. The colour bands separate ordinary rain days from the heavy ones.",
    rainyDaysAssumption:
      "Daily depths come from the hourly rainfall-intensity reconstruction. Years that do not cover a full calendar year are marked with an asterisk and are not comparable with complete years.",

    solarTrendTitle: "Solar radiation 2021–2026",
    solarTrendDesc: "Daily mean solar radiation with a 30-day rolling mean.",
    solarTrendAxis: "Daily mean solar radiation (W/m²)",
    solarTrendExplanation:
      "The faint line is the daily mean; the bold line is the 30-day rolling mean, which makes the seasonal cycle and any drift between years readable.",
    solarTrendAssumption:
      "The rolling mean starts only once 30 observed days are available, so the first weeks of the record carry no trend line.",

    solarProfileTitle: "Hourly solar profile by season",
    solarProfileDesc: "Mean solar radiation by hour of day, expressed in solar hours.",
    solarHoursAxis: "Solar radiation (hours, h)",
    solarHourConversion:
      "Values are converted from W/m² to hours (h) by accumulating the mean hourly radiation over each one-hour interval: 1 h = {ref} W/m².",
    solarOptimalWindow: "Optimal window for solar energy (09:00–15:00)",
    solarProfileExplanation:
      "Splitting the daily cycle by season shows what a single annual average hides: the summer curve is both taller and wider than the winter one, which matters for sizing solar capacity.",
    solarProfileAssumption:
      "Each point averages every observation at that clock hour within the season across all years of record. Peak hours:",

    pressureTrendTitle: "Annual course of air pressure",
    pressureTrendDesc: "Daily mean air pressure with a 30-day rolling mean.",
    pressureTrendAxis: "Air pressure (hPa)",
    pressureTrendExplanation:
      "Air pressure at this station sits well below sea level values because of the station altitude; what matters here is the variation, not the absolute level.",
    pressureTrendAssumption:
      "The rolling mean starts only once 30 observed days are available. Values are station-level pressure, not reduced to sea level.",

    partialMonth: "partly observed month",
    days: "days",
    temperatureAxis: "Temperature (°C)",
    daysAxis: "Number of days",
    annualMean: "Annual mean",

    pressureExtremesTitle: "Maximum and minimum air pressure",
    pressureExtremesDesc: "Monthly pressure range — a wider band means more unsettled weather.",
    monthlyRangeLegend: "Monthly range (min–max)",
    maxValueLegend: "Maximum value",
    minValueLegend: "Minimum value",
    absoluteMaximum: "Absolute maximum",
    absoluteMinimum: "Absolute minimum",
    widestMonth: "Widest month",
    periodAxis: "Period",
    pressureExtremesExplanation:
      "The shaded band is the gap between the highest and lowest pressure recorded in each month. A wide band means pressure swung a great deal that month — the signature of passing weather systems — while a narrow band means settled conditions.",
    pressureExtremesAssumption:
      "Extremes are the true daily minimum and maximum of the raw samples, not the daily mean, so the values are pressures the sensor actually recorded. Values are station-level pressure, not reduced to sea level.",

    pressureDiurnalTitle: "Daily cycle of air pressure by season",
    pressureDiurnalDesc: "Mean hourly departure from each day's own mean pressure, one curve per season.",
    pressureDeviationAxis: "Departure from the daily mean (hPa)",
    dailyMeanLine: "Daily mean",
    pressureMorningRise: "Pressure rises through the morning",
    pressureAfternoonFall: "and falls through the afternoon",
    dailyAmplitude: "Daily amplitude",
    pressureDiurnalExplanation:
      "This is the atmospheric tide — a real twice-daily oscillation driven by solar heating of the atmosphere. It is about ±1 hPa, while ordinary weather moves pressure by ±20 hPa, so the curves plot each hour's departure from that day's own mean. Averaging absolute pressure by hour would bury the signal entirely.",
    pressureDiurnalAssumption:
      "Built from {days} days with at least 20 hourly readings across {years}; days with fewer hours are skipped because their mean is not comparable with a full day's. Seasons are meteorological (spring Mar–May, summer Jun–Aug, autumn Sep–Nov, winter Dec–Feb). Amplitude per season:",

    monthlyTempTrendTitle: "Mean monthly temperature in Podujevë",
    monthlyTempTrendDesc: "Monthly mean temperature over the record, with a fitted linear trend and the freezing point marked.",
    monthlyMeanTemp: "Monthly mean temperature",
    monthlyRangeBand: "Monthly min–max range",
    linearTrend: "Linear trend",
    trendUnavailable: "Too few complete months to fit a trend.",
    basedOnCompleteMonths: "fitted on {n} fully observed months",
    warmest: "Warmest",
    coldest: "Coldest",
    monthlyTempTrendExplanation:
      "The dashed red line is an ordinary least-squares fit through the monthly means: it answers whether temperature over this period is rising, falling or flat. The 0 °C line makes months below freezing readable at a glance.",
    monthlyTempTrendAssumption:
      "The trend is fitted only on calendar months observed end to end, so a half-recorded month cannot tilt it. Over a record this short a slope is a screen, not a confirmed climate trend — the sign matters more than the value.",

    monthlyExtremesTitle: "Maximum and minimum temperatures by month",
    monthlyExtremesDesc: "Mean daily maximum and minimum for each calendar month, with the spread between years.",
    meanMaxTemp: "Mean maximum",
    meanMinTemp: "Mean minimum",
    betweenYearRange: "Range between years",
    absoluteRange: "Absolute range",
    warmestMonthMean: "Warmest month",
    coldestMonthMean: "Coldest month",
    monthlyExtremesExplanation:
      "Red is the maximum and blue the minimum, so the two curves read correctly without consulting the legend. Each shaded band is the spread of that month between years — where the band is wide, the monthly average is not a reliable expectation for any single year.",
    monthlyExtremesAssumption:
      "Only fully observed calendar months contribute, so month counts differ where the record is incomplete; the tooltip lists the years behind each point. Values are the mean of the daily extremes, not the single hottest or coldest reading — those are given as the absolute range.",

    diurnalTempTitle: "Daily temperature cycle by season",
    diurnalTempDesc: "Mean temperature by hour of day, one curve per season, shaded by ±1 standard deviation.",
    diurnalAmplitude: "Day–night amplitude",
    diurnalTempExplanation:
      "A single annual curve hides the point: the summer day–night swing is far wider than the winter one, so the same average conceals two very different daily regimes. The shaded band shows how much individual days scatter around each curve.",
    diurnalTempAssumption:
      "Each point averages every observation at that clock hour within the season across {years} ({n} hourly readings). The band is ±1 standard deviation of those readings, so it describes day-to-day variability, not measurement uncertainty.",

    heatStressTitle: "Days by heat-stress class",
    heatStressDesc: "Days per year counted by daily maximum temperature, using the review's thermal-stress classes.",
    heatWaves: "Heat waves",
    warmestDay: "Warmest day",
    heatWaveSummary: "{n} heat waves in the record ({days}+ consecutive days at or above {threshold} °C). Longest:",
    heatStressExplanation:
      "Classes are exclusive and read off the daily maximum, so each day falls into at most one and the stacked bars total the days of heat stress in that year.",
    heatStressAssumption:
      "Thresholds are the review's (26–32 moderate, 32–38 strong, 38–46 very strong, above 46 extreme). Daily extremes use available hourly observations without interpolation. Years marked with an asterisk do not cover a full calendar year.",

    coldestDay: "Coldest day",

    extremeDaysTitle: "The {n} coldest and {n} hottest days on record",
    extremeDaysDesc: "Cold days are ranked by their daily minimum, hot days by their daily maximum.",
    airTemperatureAxis: "Air temperature (°C)",
    coldestDaysLegend: "Coldest days",
    hottestDaysLegend: "Hottest days",
    dailyMinimumShort: "Daily minimum",
    dailyMaximumShort: "Daily maximum",
    extremeDaysExplanation:
      "Bars run down from the zero line for the cold extremes and up from it for the hot ones, ordered from the coldest day on the left to the hottest on the right.",
    extremeDaysAssumption:
      "Ranked across {days} observed days between {start} and {end}. Daily extremes use available hourly observations without interpolation, so a day with sensor gaps may record a less extreme value than it actually reached.",

    episodesTitle: "Heat waves and cold periods",
    episodesDesc: "Every qualifying episode in the record, longest first.",
    episodesDefinition:
      "A heat wave is at least {heatDays} consecutive days with a maximum temperature of {heatThreshold} °C or above. A cold period is at least {coldDays} consecutive days with a minimum temperature of {coldThreshold} °C or below.",
    heatWaveLabel: "Heat wave",
    coldPeriodLabel: "Cold period",
    duration: "Duration",
    durationAxis: "Duration (consecutive days)",
    peakShort: "peak",
    episodesExplanation:
      "Each bar is one continuous episode, so its length is the number of days in a row the condition held. The peak is the most extreme temperature reached inside that episode — it is what separates two episodes of equal length.",
    episodesAssumption:
      "{heat} heat waves and {cold} cold periods in the record. Daily extremes use available hourly observations without interpolation, so a gap in the record can end an episode that in reality continued.",
    episodesTruncated: "The chart shows the longest {shown} of each type; {hidden} shorter episodes are not drawn.",
  },
  sq: {
    appTitle: "Paneli i Rezeliencës Klimatike – Podujevë",
    appSubtitle: "Monitorimi hidro-meteorologjik i pellgut të Llapit",
    stations: "Stacionet e monitorimit",
    configTitle: "Konfigurimi",
    station: "Stacioni",
    measurement: "Matja",
    scenario: "Skenari i emetimeve",
    rcp85Hint: "Skenari më i keq me emetime të larta (trendi i projektuar më i fortë).",
    allStations: "Të gjitha stacionet",
    hydro: "Hidrologjike",
    meteo: "Meteorologjike",
    overview: "Përmbledhje",
    climatology: "Klimatologjia mujore",
    climatologyDesc: "Profili mesatar mujor përgjatë gjithë viteve të regjistrimit",
    evolution: "Trendi vjetor",
    evolutionDesc: "Mesatarja mujore e matjes së zgjedhur me kalimin e kohës",
    anomalies: "Anomalitë mujore",
    anomaliesDesc: "Devijimi i çdo muaji nga mesatarja afatgjate mujore",
    daily: "Detaji ditor",
    dailyDesc: "Vlerat ditore me intervalin min–max",
    windRose: "Rroza e erës",
    windRoseDesc: "Shpërndarja e drejtimit dhe shpejtësisë së erës",
    windRiskHeatmap: "Harta termike e rrezikut të erës",
    windRiskDescription: "Përqindja e orëve me erë të fortë",
    hourOfDay: "Ora e ditës",
    dataSource: "Burimi: të dhëna të monitorimit direkt",
    wmoStandard: "Standardi WMO për paragitjen e të dhënave meteorologjike (WMO-No. 8, Guide to Meteorological Instruments and Methods of Observation, 2018 Ed.)",
    meanWindSpeed: "Shpejtësia mesatare e erës",
    maxWindSpeed: "Shpejtësia maksimale e erës",
    calm: "Qetë",
    totalRecords: "Vëzhgimet",
    windSpeed: "Shpejtësia e erës",
    windRoseNote: "Frekuenca shfaqet si përqindje e vëzhgimeve totale",
    selectStationHint: "Zgjidhni një stacion në hartë ose nga lista për të eksploruar të dhënat.",
    period: "Periudha e matjeve",
    records: "Matjet",
    mean: "Mesatare",
    min: "Min",
    max: "Maks",
    total: "Total",
    prevailingDir: "Drejtimi mbizotërues",
    estMonthNote: "(vlerësim — muaj i vëzhguar pjesërisht)",
    month: "Muaji",
    date: "Data",
    value: "Vlera",
    year: "Viti",
    legendHydro: "Stacion hidrologjik",
    legendMeteo: "Stacion meteorologjik",
    legendMunicipality: "Kufiri i komunës",
    legendSettlements: "Poligonet e vendbanimeve",
    legendFallbackLabels: "Etiketat pa poligon",
    legendStations: "Pikat e matjes",
    boundary: "Komuna e Podujevës",
    city: "Qyteti i Podujevës",
    measurements: "matje",
    noData: "Nuk ka të dhëna për këtë zgjedhje.",
    dataNote:
      "Të dhënat: rrjeti i sensorëve hidro-meteo, pellgu i Llapit (Podujevë). Të agreguara nga matjet e papërpunuara.",
    months: ["Jan", "Shk", "Mar", "Pri", "Maj", "Qer", "Korr", "Gush", "Sht", "Tet", "Nën", "Dhj"],
    anomalyAbove: "Mbi mesatare",
    anomalyBelow: "Nën mesatare",
    rangeBand: "Intervali min–max",
    longTermProjection: "Projeksioni afatgjatë",
    scenarioTitle: "Profili mujor deri në 2050",
    scenarioDesc: "Profili mujor historik (2021–2026) dhe brezat e projektuar 2026–2030 / 2031–2040 / 2041–2050",
    allScenarios: "Të gjithë skenarët",
    historic: "historik",
    zoomHint: "Tërhiqe nëpër grafik për të zmadhuar",
    resetZoom: "Rivendos zmadhimin",
    forecastTitle: "Parashikimi",
    forecastDesc: "Gjithë historia e vëzhguar e zgjatur me një projeksion 5-mujor sipas çdo skenari",
    observed: "Të vëzhguara",
    partialDataNote: "Fillon {start}",
    projectionNote:
      "Shënim: skenarët janë një projeksion statistikor i thjeshtuar i trendit të vëzhguar në të dhënat lokale (RCP8.5 = trend më i fortë), jo rezultat i modeleve klimatike IPCC.",
    landslideTitle: "Kushtet kritike të reshjeve për rrëshqitje të dheut",
    landslideSubtitle: "Ngjarja më e rëndë vjetore sipas kohëzgjatjes kundrejt pragut intensitet–kohëzgjatje",
    landslideDaysTitle: "Ditët që plotësojnë pragun",
    landslideDaysSubtitle: "Të paktën një dritare 1–5 ditore që përfundon atë ditë e tejkaloi pragun",
    landslideXAxis: "Kohëzgjatja e reshjeve (ditë)",
    landslideYAxis: "Intensiteti mesatar i reshjeve (mm/h, shkallë logaritmike)",
    landslideBarYAxis: "Ditë kritike në vit",
    landslideDuration: "Kohëzgjatja",
    landslideMaximum: "Intensiteti maksimal",
    landslideThreshold: "Pragu kritik",
    landslideExceeded: "tejkalim",
    landslideNotExceeded: "pa tejkalim",
    landslideCriticalDays: "Ditë kritike",
    days: "ditë",
    indicatorLoading: "Duke llogaritur treguesin…",
    landslideNoData: "Ky stacion nuk ka të dhëna për intensitetin e reshjeve.",
    landslideNoRainfall: "Ky stacion nuk ka të dhëna për thellësinë e reshjeve në milimetra.",
    landslideLegacyData: "Ky stacion përmban vetëm të dhëna të agreguara të reshjeve. Koha origjinale dhe kuptimi i vlerave nuk janë të disponueshme, prandaj treguesi nuk mund të llogaritet me besueshmëri.",
    landslideUnknownSemantics: "Vlerat e reshjeve janë ruajtur, por kuptimi i tyre inkremental/kumulativ nuk është konfirmuar. Treguesi nuk është i disponueshëm derisa të konfigurohen metadatat burimore.",
    landslideIncompleteWindows: "Nuk ka dritare të plotë 1–5 ditore. Intervalet që mungojnë ose kanë ndërprerje mbeten të panjohura dhe përjashtohen.",
    landslideNoHourly: "Ka të dhëna për intensitetin e reshjeve, por mungojnë vlerat orare. Treguesi 1–5 ditor nuk mund të llogaritet në mënyrë të sigurt.",
    landslideInvalidUnit: "Njësia burimore e konfiguruar për intensitetin e reshjeve nuk mbështetet.",
    landslideCalculationError: "Treguesi i reshjeve nuk mund të llogaritej.",
    landslideExplanation:
      "Ky tregues identifikon ditët kur intensiteti i reshjeve gjatë një periudhe 1–5 ditore tejkaloi pragun e konfiguruar për rrëshqitje të dheut. Ai tregon kushte kritike reshjesh, jo një rrëshqitje të konfirmuar.",
    landslideUnitAssumption:
      "Supozimi i njësisë: intensiteti burimor i reshjeve është konfiguruar si {unit} dhe konvertohet në mënyrë eksplicite në mm/h.",
    landslideZeroFillWarning:
      "Orët pa matje trajtohen si të thata (zero); ndërprerjet e sensorit mund të fshihen.",
    landslideMethodologyNote:
      "Intensiteti i reshjeve interpretohet si mm/h sipas specifikimit të treguesit. Vlerat mesatarizohen brenda çdo ore. Orët pa matje të regjistruara trajtohen si zero reshje. Këto janë supozime të dokumentuara të rindërtimit.",
    landslideDepthSourceNote:
      "Burimi: vëzhgime të konfirmuara të thellësisë së reshjeve në mm; vlerat nuk nxirren nga mesataret orare të intensitetit.",
    landslideUnknownHoursWarning:
      "Intervalet që mungojnë mbeten të panjohura, përveç kur metadatat e sensorit vërtetojnë se mungesa e regjistrimit do të thotë mot i thatë.",
    importData: "Importo Excel",
    importing: "Duke lexuar skedarin…",
    importHint: "Ngarko një skedar sensori .xlsx / .xls / .txt (p.sh. klima e Prishtinës). Lexohet në shfletues dhe shtohet si stacion.",
    imported: "Të importuara",
    importError: "Skedari nuk u lexua dot",
    removeStation: "Hiq",
    signIn: "Kyçu",
    signOut: "Dil",
    signInToUpload: "Kyçu për të ngarkuar të dhëna",
    emailPlaceholder: "ju@shembull.com",
    passwordPlaceholder: "Fjalëkalimi",
    signedInAs: "I kyçur si",
    authError: "Kyçja dështoi",

    spring: "Pranverë",
    summer: "Verë",
    autumn: "Vjeshtë",
    winter: "Dimër",
    peak: "Kulmi",
    coverage: "Mbulueshmëria",
    partialYear: "vit i pjesshëm",
    observedDays: "Ditë të vëzhguara",
    standardDeviation: "devijimi standard",
    completeYearsCounted: "Vite të plota të përdorura",
    longTermMean: "Mesatarja afatgjate",
    rollingMean30: "Mesatarja lëvizëse 30-ditore",

    windDiurnalTitle: "Rastisja e shpejtësisë së erës gjatë ditës (m/s)",
    windDiurnalDesc: "Shpejtësia mesatare e erës sipas orës së ditës (m/s), mesatarizuar për tërë periudhën.",
    windDiurnalExplanation:
      "Shpejtësia e erës ndjek një cikël ditor: e qetë gjatë natës, forcohet pas lindjes së diellit ndërsa sipërfaqja nxehet, arrin kulmin herët pasdite dhe dobësohet përsëri pas perëndimit.",
    windDiurnalAssumption:
      "Çdo orë mesatarizon të gjitha vëzhgimet e regjistruara në atë orë gjatë tërë periudhës; stinët nuk ndahen këtu.",
    meanSpeedAxis: "Shpejtësia mesatare (m/s)",

    windByDirectionTitle: "Rastisja e shpejtësisë së erës sipas drejtimeve",
    windByDirectionDesc: "Shpejtësia mesatare e erës për secilin nga 16 sektorët e busullës.",
    windByDirectionExplanation:
      "Ky grafik tregon sa e fortë është era kur fryn nga secili drejtim, ndryshe nga sa shpesh fryn nga aty (atë e tregon rroza e erës).",
    windByDirectionAssumption:
      "Drejtimi dhe shpejtësia çiftohen sipas kohës së njëjtë, prandaj një matje numërohet vetëm kur të dy sensorët kanë regjistruar.",
    windDirectionAxis: "Drejtimi i erës",
    strongestWindsFrom: "Erërat më të forta vijnë më shpesh nga",

    monthlyRainfallTitle: "Reshjet mesatare mujore",
    monthlyRainfallDesc: "Reshjet mesatare për çdo muaj kalendarik me devijimin standard mes viteve.",
    monthlyRainfallAxis: "Reshjet mesatare mujore (mm)",
    monthlyRainfallExplanation:
      "Shtyllat janë me ngjyra sipas stinës. Vijat vertikale tregojnë devijimin standard mes viteve — një vijë e gjatë do të thotë se ai muaj ndryshon shumë nga viti në vit.",
    monthlyRainfallAssumption:
      "Lartësitë e reshjeve rindërtohen nga intensiteti orar i reshjeve (një orë e plotë mm/h barazohet me mm lartësi); vlerat e intensitetit nuk mblidhen kurrë drejtpërdrejt. Vetëm muajt e vëzhguar plotësisht hyjnë në mesatare, prandaj muajt e regjistruar pjesërisht përjashtohen në vend që të lexohen si të thatë.",
    highestRainfallMonth: "Muaji me sasinë më të lartë të reshjeve",

    rainyDaysTitle: "Numri i ditëve me reshje për secilin vit",
    rainyDaysDesc: "Ditët me së paku 1 mm, të ndara sipas sasisë së reshjeve.",
    rainyDaysMonthlyTitle: "Ditët me reshje sipas muajit (të gjitha vitet së bashku)",
    rainyDaysMonthlyDesc: "Çdo janar, çdo shkurt… i periudhës i mbledhur së bashku, prandaj një shtyllë mund të kalojë 31 ditë. Vija tregon përqindjen e ditëve të vëzhguara.",
    rainyDaysAxis: "Ditë me reshje",
    rainyDaysAxisAllYears: "Ditë me reshje (të gjitha vitet)",
    rainDays: "Ditë me reshje",
    rainDaysAllYears: "Ditë me reshje, të gjitha vitet",
    rainDaysPerYear: "Mesatarja për vit",
    yearSingular: "vit",
    yearPlural: "vite",
    shareOfDays: "Përqindja e ditëve të vëzhguara",
    rainyDaysExplanation:
      "Ditë me reshje është një ditë kalendarike me së paku 1 mm reshje — konventa e njëjtë që përdor treguesi i periudhave të thata, prandaj të dy janë drejtpërdrejt të krahasueshëm. Brezat me ngjyra ndajnë ditët e zakonshme nga ato me reshje të mëdha.",
    rainyDaysAssumption:
      "Lartësitë ditore vijnë nga rindërtimi orar i intensitetit të reshjeve. Vitet që nuk mbulojnë një vit të plotë kalendarik shënohen me yll dhe nuk janë të krahasueshme me vitet e plota.",

    solarTrendTitle: "Rrezatimi diellor 2021–2026, St. Meteorologjik në Shajkoc (Podujevë)",
    solarTrendDesc: "Rrezatimi mesatar ditor diellor me mesataren lëvizëse 30-ditore.",
    solarTrendAxis: "Rrezatimi diellor mesatar ditor (W/m²)",
    solarTrendExplanation:
      "Vija e zbehtë është mesatarja ditore; vija e trashë është mesatarja lëvizëse 30-ditore, e cila e bën të lexueshëm ciklin sezonal dhe çdo zhvendosje mes viteve.",
    solarTrendAssumption:
      "Mesatarja lëvizëse fillon vetëm kur janë të disponueshme 30 ditë të vëzhguara, prandaj javët e para të regjistrimit nuk kanë vijë trendi.",

    solarProfileTitle: "Profili orar i rrezatimit diellor sipas stinës",
    solarProfileDesc: "Rrezatimi mesatar diellor sipas orës së ditës, i shprehur në orë.",
    solarHoursAxis: "Rrezatimi diellor (orë, h)",
    solarHourConversion:
      "Vlerat konvertohen nga W/m² në orë (h) duke akumuluar rrezatimin mesatar orar gjatë intervaleve 1-orëshe: 1 h = {ref} W/m².",
    solarOptimalWindow: "Dritarja optimale për energji diellore (09:00–15:00)",
    solarProfileExplanation:
      "Ndarja e ciklit ditor sipas stinës tregon atë që një mesatare e vetme vjetore e fsheh: lakorja e verës është më e lartë dhe më e gjerë se ajo e dimrit, gjë që ka rëndësi për dimensionimin e kapacitetit diellor.",
    solarProfileAssumption:
      "Çdo pikë mesatarizon të gjitha vëzhgimet në atë orë brenda stinës për të gjitha vitet e regjistrimit. Orët e kulmit:",

    pressureTrendTitle: "Ecuria vjetore e shtypjes së ajrit",
    pressureTrendDesc: "Shtypja mesatare ditore e ajrit me mesataren lëvizëse 30-ditore.",
    pressureTrendAxis: "Shtypja atmosferike (hPa)",
    pressureTrendExplanation:
      "Shtypja e ajrit në këtë stacion qëndron dukshëm nën vlerat e nivelit të detit për shkak të lartësisë së stacionit; këtu ka rëndësi luhatja, jo niveli absolut.",
    pressureTrendAssumption:
      "Mesatarja lëvizëse fillon vetëm kur janë të disponueshme 30 ditë të vëzhguara. Vlerat janë shtypje në nivel stacioni, jo të reduktuara në nivel deti.",

    partialMonth: "muaj i vëzhguar pjesërisht",
    days: "ditë",
    temperatureAxis: "Temperatura (°C)",
    daysAxis: "Numri i ditëve",
    annualMean: "Mesatarja vjetore",

    pressureExtremesTitle: "Vlerat maksimale dhe minimale të shtypjes atmosferike",
    pressureExtremesDesc: "Diapazoni mujor i shtypjes — hapësira më e madhe tregon paqëndrueshmëri.",
    monthlyRangeLegend: "Diapazoni mujor (min–max)",
    maxValueLegend: "Vlera maksimale",
    minValueLegend: "Vlera minimale",
    absoluteMaximum: "Maksimumi absolut",
    absoluteMinimum: "Minimumi absolut",
    widestMonth: "Muaji me diapazonin më të gjerë",
    periodAxis: "Periudha",
    pressureExtremesExplanation:
      "Zona e hijezuar është hapësira mes shtypjes më të lartë dhe më të ulët të regjistruar në çdo muaj. Një zonë e gjerë tregon se shtypja ka luhatur shumë atë muaj — shenja e sistemeve të motit që kalojnë — ndërsa një zonë e ngushtë tregon kushte të qëndrueshme.",
    pressureExtremesAssumption:
      "Ekstremet janë minimumi dhe maksimumi real ditor i matjeve burimore, jo mesatarja ditore, prandaj vlerat janë shtypje që sensori i ka regjistruar vërtet. Vlerat janë shtypje në nivel stacioni, jo të reduktuara në nivel deti.",

    pressureDiurnalTitle: "Cikli ditor i shtypjes atmosferike sipas stinës",
    pressureDiurnalDesc: "Devijimi mesatar orar nga mesatarja ditore e shtypjes, një lakore për çdo stinë.",
    pressureDeviationAxis: "Devijimi nga mesatarja ditore (hPa)",
    dailyMeanLine: "Mesatarja ditore",
    pressureMorningRise: "Shtypja rritet gjatë mëngjesit (ftohja)",
    pressureAfternoonFall: "Shtypja bie gjatë pasdites (ngrohja)",
    dailyAmplitude: "Amplituda ditore",
    pressureDiurnalExplanation:
      "Ky është baticë-zbatica atmosferike — një lëkundje reale dyfishe brenda ditës, e shkaktuar nga ngrohja diellore e atmosferës. Ajo është rreth ±1 hPa, ndërsa moti i zakonshëm e lëviz shtypjen për ±20 hPa, prandaj lakoret paraqesin devijimin e çdo ore nga mesatarja e asaj dite. Mesatarizimi i shtypjes absolute sipas orës do ta fshihte plotësisht sinjalin.",
    pressureDiurnalAssumption:
      "Ndërtuar nga {days} ditë me së paku 20 matje orare gjatë viteve {years}; ditët me më pak orë anashkalohen sepse mesatarja e tyre nuk është e krahasueshme me atë të një dite të plotë. Stinët janë meteorologjike (pranvera Mar–Maj, vera Qer–Gush, vjeshta Sht–Nën, dimri Dhj–Shk). Amplituda sipas stinës:",

    monthlyTempTrendTitle: "Temperaturat mesatare mujore në Podujevë",
    monthlyTempTrendDesc: "Temperatura mesatare mujore gjatë periudhës, me vijë trendi lineare dhe pikën e ngrirjes të shënuar.",
    monthlyMeanTemp: "Temperatura mesatare mujore",
    monthlyRangeBand: "Shtrirja mujore min–maks",
    linearTrend: "Trendi linear",
    trendUnavailable: "Ka shumë pak muaj të plotë për të llogaritur trendin.",
    basedOnCompleteMonths: "llogaritur mbi {n} muaj të vëzhguar plotësisht",
    warmest: "Më i ngrohti",
    coldest: "Më i ftohti",
    monthlyTempTrendExplanation:
      "Vija e kuqe me ndërprerje është një regresion linear përmes mesatareve mujore: ajo tregon nëse temperatura gjatë kësaj periudhe është duke u rritur, duke u ulur apo ka mbetur stabile. Vija te 0 °C mundëson leximin e shpejtë të muajve nën zero.",
    monthlyTempTrendAssumption:
      "Trendi llogaritet vetëm mbi muajt kalendarikë të vëzhguar nga fillimi në fund, prandaj një muaj i regjistruar përgjysmë nuk mund ta anojë atë. Për një periudhë kaq të shkurtër, pjerrësia është tregues paraprak dhe jo trend klimatik i konfirmuar — shenja ka më shumë rëndësi se vlera.",

    monthlyExtremesTitle: "Temperaturat maksimale dhe minimale sipas muajve",
    monthlyExtremesDesc: "Maksimumi dhe minimumi mesatar ditor për çdo muaj kalendarik, me shtrirjen mes viteve.",
    meanMaxTemp: "Temperatura maksimale (mesatare)",
    meanMinTemp: "Temperatura minimale (mesatare)",
    betweenYearRange: "Shtrirja mes viteve",
    absoluteRange: "Shtrirja absolute",
    warmestMonthMean: "Muaji më i ngrohtë",
    coldestMonthMean: "Muaji më i ftohtë",
    monthlyExtremesExplanation:
      "E kuqja është maksimumi dhe e kaltra minimumi, kështu që të dy lakoret lexohen saktë pa iu referuar legjendës. Çdo zonë e hijezuar tregon shtrirjen e atij muaji mes viteve — aty ku zona është e gjerë, mesatarja mujore nuk është pritshmëri e besueshme për asnjë vit të vetëm.",
    monthlyExtremesAssumption:
      "Kontribuojnë vetëm muajt kalendarikë të vëzhguar plotësisht, prandaj numri i viteve ndryshon aty ku regjistrimi është i paplotë; tooltip-i i liston vitet pas çdo pike. Vlerat janë mesatarja e ekstremeve ditore, jo matja e vetme më e nxehtë ose më e ftohtë — ato jepen si shtrirja absolute.",

    diurnalTempTitle: "Ndryshimi ditor i temperaturës sipas stinës",
    diurnalTempDesc: "Temperatura mesatare sipas orës së ditës, një lakore për çdo stinë, e hijezuar me ±1 devijim standard.",
    diurnalAmplitude: "Amplituda ditë–natë",
    diurnalTempExplanation:
      "Një lakore e vetme vjetore e fsheh thelbin: luhatja ditë–natë në verë është shumë më e madhe se ajo e dimrit, prandaj e njëjta mesatare mbulon dy regjime krejt të ndryshme ditore. Zona e hijezuar tregon sa shpërndahen ditët individuale rreth çdo lakoreje.",
    diurnalTempAssumption:
      "Çdo pikë mesatarizon të gjitha vëzhgimet në atë orë brenda stinës gjatë viteve {years} ({n} matje orare). Zona është ±1 devijim standard i atyre matjeve, prandaj përshkruan ndryshueshmërinë ditë-për-ditë dhe jo pasigurinë e matjes.",

    heatStressTitle: "Ditët sipas nivelit të stresit termik",
    heatStressDesc: "Numri i ditëve në vit sipas temperaturës maksimale ditore, me nivelet e stresit termik të kërkuara.",
    heatWaves: "Valë të të nxehtit",
    warmestDay: "Dita më e nxehtë",
    heatWaveSummary: "{n} valë të të nxehtit në periudhë ({days}+ ditë radhazi me së paku {threshold} °C). Më të gjatat:",
    heatStressExplanation:
      "Nivelet janë përjashtuese dhe lexohen nga temperatura maksimale ditore, prandaj çdo ditë bie në më së shumti një nivel dhe shtyllat e stivosura japin totalin e ditëve me stres termik për atë vit.",
    heatStressAssumption:
      "Pragjet janë ato të kërkuara (26–32 stres mesatar, 32–38 i fortë, 38–46 shumë i fortë, mbi 46 ekstrem). Ekstremet ditore përdorin vëzhgimet orare të disponueshme pa interpolim. Vitet e shënuara me yll nuk mbulojnë një vit të plotë kalendarik.",

    coldestDay: "Dita më e ftohtë",

    extremeDaysTitle: "{n} ditët më të ftohta dhe {n} ditët më të nxehta të regjistruara",
    extremeDaysDesc: "Ditët e ftohta renditen sipas minimumit ditor, ditët e nxehta sipas maksimumit ditor.",
    airTemperatureAxis: "Temperatura e ajrit (°C)",
    coldestDaysLegend: "Ditët më të ftohta",
    hottestDaysLegend: "Ditët më të nxehta",
    dailyMinimumShort: "Minimumi ditor",
    dailyMaximumShort: "Maksimumi ditor",
    extremeDaysExplanation:
      "Shtyllat zbresin nën vijën e zeros për ekstremet e ftohta dhe ngjiten mbi të për ato të nxehta, të renditura nga dita më e ftohtë majtas te më e nxehta djathtas.",
    extremeDaysAssumption:
      "Renditur nga {days} ditë të vëzhguara mes {start} dhe {end}. Ekstremet ditore përdorin vëzhgimet orare të disponueshme pa interpolim, prandaj një ditë me ndërprerje të sensorit mund të regjistrojë vlerë më pak ekstreme sesa ka arritur në realitet.",

    episodesTitle: "Valët e të nxehtit dhe periudhat e ftohta",
    episodesDesc: "Çdo episod kualifikues në periudhë, i renditur nga më i gjati.",
    episodesDefinition:
      "Valë e të nxehtit = të paktën {heatDays} ditë me temperaturë maksimale ≥ {heatThreshold} °C. Periudhë e ftohtë = të paktën {coldDays} ditë me temperaturë minimale ≤ {coldThreshold} °C.",
    heatWaveLabel: "Valë e të nxehtit",
    coldPeriodLabel: "Periudhë e ftohtë",
    duration: "Kohëzgjatja",
    durationAxis: "Kohëzgjatja (ditë radhazi)",
    peakShort: "kulmi",
    episodesExplanation:
      "Çdo shtyllë është një episod i vazhdueshëm, prandaj gjatësia e saj tregon numrin e ditëve radhazi që kushti u plotësua. Kulmi është temperatura më ekstreme e arritur brenda atij episodi — ai është dallimi mes dy episodeve me gjatësi të njëjtë.",
    episodesAssumption:
      "{heat} valë të të nxehtit dhe {cold} periudha të ftohta në periudhë. Ekstremet ditore përdorin vëzhgimet orare të disponueshme pa interpolim, prandaj një ndërprerje në regjistrim mund ta mbyllë një episod që në realitet ka vazhduar.",
    episodesTruncated: "Grafiku paraqet {shown} më të gjatat për secilin lloj; {hidden} episode më të shkurtra nuk janë vizatuar.",
  },
};

export function makeT(lang) {
  const dict = STRINGS[lang] || STRINGS.en;
  return (key) => dict[key] ?? key;
}
