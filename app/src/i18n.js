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
    monthsFull: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
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

    topRainDaysTitle: "The {n} days with the highest rainfall",
    topRainDaysDesc: "Record rainfall days — the highest flood risk.",
    dailyRainfallAxis: "Total daily rainfall (mm)",
    highRainfallMarker: "flood risk (80 mm)",
    topRainDaysExplanation:
      "Bars use the same colour bands as the yearly chart, so red means the same thing in both. The dashed line marks the 80 mm boundary of the top band.",
    topRainDaysAssumption:
      "Daily totals are rebuilt from hourly rainfall intensity — one clock-hour of mm/h equals one mm of depth. Intensity readings are never summed directly, which is what produces impossible totals in the thousands of millimetres.",

    rainyDaysTitle: "Rain days per year",
    rainyDaysDesc: "Days classified by how much rain fell: 30–50, 50–80 and over 80 mm.",
    classifiedDays: "Days of 30 mm or more",
    lightRainDays: "Days 1–30 mm",
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
      "Bars count only days reaching 30 mm, in the three classified bands. Ordinary 1–30 mm days outnumber these roughly ten to one, so including them would flatten the three bands into invisible slivers; their count is in the tooltip instead, along with the total of all days above 1 mm.",
    rainyDaysAssumption:
      "Daily depths come from the hourly rainfall-intensity reconstruction. Years that do not cover a full calendar year are marked with an asterisk and are not comparable with complete years.",

    solarTrendTitle: "Solar radiation 2021–2026",
    solarTrendDesc: "Daily mean solar radiation with a 30-day rolling mean.",
    solarTrendAxis: "Daily mean solar radiation (W/m²)",
    solarTrendExplanation:
      "The faint line is the daily mean; the bold line is the 30-day rolling mean, which makes the seasonal cycle and any drift between years readable.",
    solarTrendAssumption:
      "The rolling mean starts only once 30 observed days are available, so the first weeks of the record carry no trend line.",

    solarMonthlyTitle: "Monthly mean solar radiation",
    solarMonthlyDesc: "Mean values and standard deviation",
    solarMonthlyAxis: "Mean radiation (W/m²)",
    solarMonthlyExplanation:
      "Each bar is the average of that calendar month across every year of record; the whiskers are the standard deviation between those years, so a long whisker marks a month that differs a lot from year to year.",
    solarMonthlyAssumption:
      "Each month-year is averaged first and those means are then averaged across years, so a year with more observed days does not pull the average toward itself. Month-years with fewer than 15 observed days are excluded — they sample whichever days the sensor was running rather than the month.",
    monthlyProfileSkipped: "{n} month-years were excluded for having fewer than 15 observed days.",

    solarExtremeDaysTitle: "Days with the highest and lowest radiation",
    solarExtremeDaysDesc: "Low-radiation days are overcast days — the hardest case for solar energy.",
    solarHighestDays: "The {n} days with the highest radiation",
    solarLowestDays: "The {n} days with the lowest radiation",
    solarPeakAxis: "Peak radiation (W/m²)",
    solarExtremeDaysExplanation:
      "Days are ranked by the maximum radiation they reached, so each bar is that day's best moment. The gap between the two panels shows how much a cloudy day costs: the dullest days peak at a small fraction of the brightest.",
    solarExtremeDaysAssumption:
      "The daily maximum is the highest single reading of the day, not the daily average. A day with sensor gaps around midday may rank lower than it truly was.",

    solarHeatmapTitle: "Solar radiation map by month and year",
    solarHeatmapDesc: "Comparison of mean radiation — a warmer colour means higher radiation.",
    solarHeatmapScale: "Mean radiation (W/m²)",
    solarHeatmapExplanation:
      "Reading across a row compares the same month between years; reading down a column follows one year through its seasons. Blank cells are months the record does not cover — they are left empty rather than drawn as zero.",
    solarHeatmapAssumption:
      "Each cell is the mean of the daily values observed in that month and year.",
    heatmapCellNote: "{filled} month-year cells contain data.",
    heatmapSkipped: "{n} were excluded for having fewer than 10 observed days.",

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

    /* ---- water datasets: level, water temperature, salinity, TDS, conductivity ---- */
    partialYear: "partly observed year",
    partialYearsNote:
      "Years the record does not cover end to end are drawn in grey and left out of any fitted trend — their averages are not comparable with a full year's.",
    yearsShort: "yr",
    completeYearsCount: "{n} fully observed years",
    eventWindowNote: "The window is ±{days} days around the peak of the record.",
    floodPeak: "Flood peak",
    dilutionMinimum: "Lowest reading",
    annualRangeLegend: "Annual min–max range",
    annualMaximumLegend: "Annual maximum",
    trendCompleteYears: "Trend on complete years",
    annualMaximum: "Annual maximum",
    dayOfYear: "Day of year",
    historicalMedian: "Historical median",
    referencePeriod: "Reference period",
    currentYearOverlay: "Year drawn over it",
    seasonalBandBasis:
      "Bands are the 10th/25th/50th/75th/90th percentile of each day of the year across the {n} reference years ({years}); the most recent year is drawn over them rather than counted in them.",
    ofTimeExceeded: "of the time equalled or exceeded",
    medianValue: "Median",
    exceedanceAxis: "Percentage of time the value is equalled or exceeded (%)",
    logScale: "log scale",
    logScaleUnavailable: "The axis is linear because the series contains values at or below zero, which a log scale cannot show.",
    durationElevated: "{code}10 — elevated",
    durationDilute: "{code}90 — low/dilute",
    durationWarmEnd: "T10 — warm",
    durationColdEnd: "T90 — cold",
    durationMarkerNote: "The markers are percentiles of this record, not water-use standards — substitute the local limits before reading them as thresholds.",
    exceedingDays: "Days above the threshold",
    shareOfMonitoredDays: "Share of monitored days",
    thresholdUsed: "Threshold",
    recordPercentilePlaceholder: "{p}th percentile of the record — a placeholder",
    exceedanceShareAxis: "Days above the threshold (% of monitored days)",

    waterLevelHydrographTitle: "River water level with flood-alert thresholds — largest recorded event",
    waterLevelHydrographDesc: "The largest event in the record, replayed hour by hour over the alert bands.",
    bandNormal: "Normal",
    bandAlert: "Alert",
    bandWarning: "Warning",
    bandDanger: "Danger",
    waterLevelHydrographExplanation:
      "A level in metres means nothing on its own; the bands are what make it readable. The shape matters too — this event rose from base flow to its peak in a few hours, which is the lead time an alert would actually have.",
    waterLevelHydrographAssumption:
      "The band edges are percentiles of this record (99th, 99.9th, and the recorded maximum), not the operator's official alert levels. They must be replaced with the real thresholds before this is used operationally; as drawn, the chart is retrospective and carries no forecast.",

    levelDurationTitle: "Level duration curve — how often the river runs high, normal or low",
    levelDurationDesc: "The share of days on which each level is equalled or exceeded, early years against recent ones.",
    levelHighWater: "L10 — high water",
    levelLowWater: "L95 — low water",
    levelDurationExplanation:
      "Read across, not along: the height of the curve at 95 % is the level the river stays above almost all year, and the gap between the two periods says whether the whole regime has shifted rather than whether one flood was larger.",
    levelDurationAssumption:
      "Built from water level, not discharge — no rating curve was available to convert one to the other, so these values are specific to this channel and gauge datum and are not comparable with regional Q10/Q95 benchmarks.",

    floodFrequencyTitle: "Flood frequency: how rare is a water level of this size?",
    floodFrequencyDesc: "Annual maxima against return period, with a fitted Gumbel distribution.",
    floodFrequencyExplanation:
      "Each point is one year's highest water level, placed at the return period its rank implies. The fitted line extends that ranking into an estimate of how often a given level recurs — and the width of the band around it is the honest measure of how much a record this short can say.",
    floodFrequencyAssumption:
      "Illustrative only. Standard practice wants 20–30 years of annual maxima; this record has far fewer, so the curve is capped at three times the number of years rather than extrapolated to a 100-year level. Plotting positions are Gringorten, the fit is least squares on the Gumbel reduced variate, and partially observed years are marked but kept in the fit.",
    recordLength: "{n} annual maxima",
    extrapolationCap: "extrapolation capped at {n} years",
    returnPeriod: "Return period",
    returnPeriodAxis: "Return period (years, log scale)",
    confidenceBand: "95 % confidence interval",
    gumbelFit: "Fitted Gumbel distribution",
    completeYearMax: "Complete-year maximum",
    partialYearMax: "Partial-year maximum",

    thermalHydrographTitle: "Water temperature with thermal-stress thresholds — warmest recorded event",
    thermalHydrographDesc: "The warmest event in the record, replayed over general aquatic-life stress bands.",
    bandCold: "Cold",
    bandOptimal: "Optimal",
    bandWarmStress: "Warm stress",
    bandCritical: "Critical",
    thermalHydrographExplanation:
      "The daily saw-tooth is the normal day–night cycle; what matters is how far into the warm-stress band the daily peaks reach and for how many days in a row, since thermal stress on aquatic life accumulates rather than resetting each night.",
    thermalHydrographAssumption:
      "The bands are general aquatic-life guidance (cold below 4 °C, optimal 4–20 °C, warm stress 20–25 °C, critical above 25 °C), not a species-specific or regionally adopted standard. Replace them with real ecological limits before reading this as a compliance chart.",

    dilutionTitleSalinity: "Salinity response to a flood event — dilution during high flow",
    dilutionTitleTds: "TDS response to a flood event — dilution during high flow",
    dilutionTitleConductivity: "Conductivity response to a flood event — dilution during high flow",
    dilutionDesc: "The same flood as the water-level chart, with the dissolved-load reading over it on a second axis.",
    dilutionExplanation:
      "Two independent sensors, one mechanism: the flood wave arrives and dilutes the dissolved load, so the value falls exactly as the level rises. That is also why these readings climb during drought — the same load in less water.",
    dilutionAssumption:
      "The event is chosen from the water-level series, so this chart and the hydrograph always point at the same storm. Both series are drawn at their own recorded times; where one sensor has a gap, its line simply bridges it.",

    annualTrendTitleWaterTemp: "Long-term water-temperature trend — is the river warming?",
    annualTrendTitleSalinity: "Long-term salinity trend — is the river salinising?",
    annualTrendTitleTds: "Long-term TDS trend — is the dissolved load changing?",
    annualTrendTitleConductivity: "Long-term conductivity trend — is mineral loading changing?",
    annualTrendDesc: "Annual mean with the observed minimum–maximum range behind it, and a trend fitted on complete years.",
    annualTrendExplanation:
      "The bar is the full span the sensor recorded that year and the marker its annual mean; the dashed line is an ordinary least-squares fit through the means of the fully observed years only.",
    annualTrendAssumption:
      "With only a handful of complete years this is a screen, not a confirmed trend — the sign of the slope is worth more than its value, and one unusual year can reverse it.",

    seasonalClimatologyTitleWaterTemp: "Seasonal water-temperature climatology: is this normal for the time of year?",
    seasonalClimatologyTitleSalinity: "Seasonal salinity climatology: is this normal for the time of year?",
    seasonalClimatologyTitleTds: "Seasonal TDS climatology: is this normal for the time of year?",
    seasonalClimatologyTitleConductivity: "Seasonal conductivity climatology: is this normal for the time of year?",
    seasonalClimatologyDesc: "Percentile bands by day of year from the earlier years, with the most recent year drawn over them.",
    seasonalClimatologyExplanation:
      "The same number means different things in April and in August. Comparing the recent year against the band for that day of the year removes the seasonal cycle, so what is left is the part that is actually unusual.",
    seasonalClimatologyAssumption:
      "With only a few reference years each percentile rests on a handful of values, so the bands are jagged and the 10th and 90th are close to the observed minimum and maximum. They describe this short record, not a climatological normal.",

    durationCurveTitleWaterTemp: "Thermal duration curve — how often is the river warm, mild or cold?",
    durationCurveTitleSalinity: "Salinity duration curve — how often is the river above a use threshold?",
    durationCurveTitleTds: "TDS duration curve — how often is the river above a use threshold?",
    durationCurveTitleConductivity: "Conductivity duration curve — how often is the river above a use threshold?",
    durationCurveDesc: "Early years against recent ones across the whole range, not just the extremes.",
    durationCurveExplanation:
      "A recent curve sitting above the earlier one across most of its length means the whole regime has shifted, which is a broader and more reliable signal than any single record-breaking day.",
    durationCurveAssumption:
      "Both curves are built from daily means and plotted at Weibull exceedance positions. The record is split into an earlier and a more recent half of its years; with a record this short the two windows are only a few years each.",

    exceedanceDaysTitleWaterTemp: "Frequency of heat-stress days per year",
    exceedanceDaysTitleSalinity: "Frequency of elevated-salinity days per year",
    exceedanceDaysTitleTds: "Frequency of elevated-TDS days per year",
    exceedanceDaysTitleConductivity: "Frequency of elevated-conductivity days per year",
    exceedanceDaysDesc: "The share of monitored days each year that sat above the threshold.",
    exceedanceDaysExplanation:
      "This is the most direct year-over-year reading in the set: a rising share is a concrete, countable signal, and expressing it as a percentage of monitored days keeps a year with a sensor outage from looking calm.",
    exceedanceDaysAssumption:
      "The threshold is the 90th percentile of this record — a placeholder that puts roughly a tenth of all days above it by construction. An operational indicator needs the regulator's or the ecologist's own limit here, at which point the year-to-year pattern, not the level, is what carries over.",

    // ---- review follow-up: axis framing, legends, empty states ----------
    axisTruncatedNote:
      "The vertical axis starts above zero so that the differences between months stay visible.",
    rainfallWhiskerNote:
      "Where the between-year deviation is wider than the month's own mean, the lower whisker is drawn down to zero: a month cannot record a negative depth of rain.",
    dualAxisNote:
      "Bars are read against the left-hand axis (rain days), the line against the right-hand one (share of observed days).",
    landslideNoCriticalDetail:
      "Across the {years} years of record no 1–5 day window reached the configured intensity-duration threshold. That is a statement about the threshold and this record, not a gap in the data — before the indicator is used operationally, confirm the threshold is the one the local geology calls for.",
    seasonalBandOutageNote:
      "A stretch where the band collapses toward zero is a sensor gap in one of those years showing through the percentiles, not a seasonal signal — read it against the coverage note above.",
    weakTrendCaution:
      "R² = {r2}: the straight line accounts for only {pct} % of the month-to-month variation, so the slope is a screen for a direction, not a measured rate of warming.",
    largestAnomalies: "Largest departures from the monthly normal: {up} in {upMonth}, {down} in {downMonth}.",
    fullYearLegend: "Fully observed year",
    leftAxisSuffix: "left axis",
    rightAxisSuffix: "right axis",
    dailyValueLegend: "Daily value",
    monthlyValueLegend: "Monthly value",
    monthlyTotalLegend: "Monthly total",
    anomalyAboveLegend: "Above the monthly average",
    anomalyBelowLegend: "Below the monthly average",
    longTermMeanLegend: "Long-term mean",
    rollingMeanLegend: "30-day rolling mean",
    episodeAxis: "Episode",
    countOfDaysAxis: "Number of days",
    qualifyingDryDaysAxis: "Qualifying dry days",
    noQualifyingEvents: "No qualifying event recorded in this record.",
    zeroForYear: "0 — no day met the threshold",
    partialYearExcluded: "* Partly observed year — not comparable with a full year",
    windRoseRingNote: "Rings are drawn every {step} % of all observations.",
    circularMeanNote:
      "Direction is averaged as a vector (circular mean): the ordinary average of 1° and 359° would be 180°, the opposite bearing.",
    directionRoseHint:
      "A bar chart cannot carry a compass bearing — a month averaging 5° and a month averaging 355° both blow from the north but sit at opposite ends of the axis. Read the wind rose above instead.",
    noChartData: "This chart cannot be drawn",
    scenarioProjectedLabel: "projected",
    scenarioObservedLabel: "observed",
    projectionGapNote:
      "The observed line ends where the record ends; the last partly observed year is left out so that it does not read as a sudden fall.",
    trendNotFitted: "No trend fitted — too few fully observed years",
    referenceBandNarrowNote:
      "With only {years} reference years the percentile bands rest on a handful of values, so they sit close together and close to the observed range.",
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
    monthsFull: ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"],
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

    topRainDaysTitle: "{n} ditët me reshjet më të larta",
    topRainDaysDesc: "Ditët me reshje rekord — rreziku më i lartë nga vërshimet.",
    dailyRainfallAxis: "Reshjet totale ditore (mm)",
    highRainfallMarker: "rrezik nga vërshimet (80 mm)",
    topRainDaysExplanation:
      "Shtyllat përdorin të njëjtat breza ngjyrash si grafiku vjetor, prandaj e kuqja ka të njëjtin kuptim në të dy. Vija me ndërprerje shënon kufirin 80 mm të brezit më të lartë.",
    topRainDaysAssumption:
      "Totalet ditore rindërtohen nga intensiteti orar i reshjeve — një orë e plotë mm/h barazohet me një mm lartësi. Vlerat e intensitetit nuk mblidhen kurrë drejtpërdrejt, gjë që është shkaku i totaleve të pamundura prej mijëra milimetrash.",

    rainyDaysTitle: "Numri i ditëve me reshje sipas viteve",
    rainyDaysDesc: "Ditët e klasifikuara sipas sasisë së reshjeve: 30–50, 50–80 dhe mbi 80 mm.",
    classifiedDays: "Ditë me 30 mm e më shumë",
    lightRainDays: "Ditë 1–30 mm",
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
      "Shtyllat numërojnë vetëm ditët që arrijnë 30 mm, në tre brezat e klasifikuar. Ditët e zakonshme 1–30 mm janë rreth dhjetë herë më të shumta, prandaj përfshirja e tyre do t'i rrafshonte tre brezat në shirita të padukshëm; numri i tyre gjendet te tooltip-i, bashkë me totalin e të gjitha ditëve mbi 1 mm.",
    rainyDaysAssumption:
      "Lartësitë ditore vijnë nga rindërtimi orar i intensitetit të reshjeve. Vitet që nuk mbulojnë një vit të plotë kalendarik shënohen me yll dhe nuk janë të krahasueshme me vitet e plota.",

    solarTrendTitle: "Rrezatimi diellor 2021–2026, St. Meteorologjik në Shajkoc (Podujevë)",
    solarTrendDesc: "Rrezatimi mesatar ditor diellor me mesataren lëvizëse 30-ditore.",
    solarTrendAxis: "Rrezatimi diellor mesatar ditor (W/m²)",
    solarTrendExplanation:
      "Vija e zbehtë është mesatarja ditore; vija e trashë është mesatarja lëvizëse 30-ditore, e cila e bën të lexueshëm ciklin sezonal dhe çdo zhvendosje mes viteve.",
    solarTrendAssumption:
      "Mesatarja lëvizëse fillon vetëm kur janë të disponueshme 30 ditë të vëzhguara, prandaj javët e para të regjistrimit nuk kanë vijë trendi.",

    solarMonthlyTitle: "Mesatarja mujore e rrezatimit diellor",
    solarMonthlyDesc: "Vlerat mesatare dhe devijimi standard",
    solarMonthlyAxis: "Rrezatimi mesatar (W/m²)",
    solarMonthlyExplanation:
      "Çdo shtyllë është mesatarja e atij muaji kalendarik për të gjitha vitet e regjistrimit; vijat vertikale janë devijimi standard mes atyre viteve, prandaj një vijë e gjatë shënon një muaj që ndryshon shumë nga viti në vit.",
    solarMonthlyAssumption:
      "Fillimisht mesatarizohet çdo muaj i çdo viti dhe pastaj ato mesatare mesatarizohen mes viteve, kështu që një vit me më shumë ditë të vëzhguara nuk e tërheq mesataren nga vetja. Muajt me më pak se 15 ditë të vëzhguara përjashtohen — ata paraqesin ditët kur sensori ishte në punë dhe jo muajin.",
    monthlyProfileSkipped: "{n} muaj-vite u përjashtuan sepse kishin më pak se 15 ditë të vëzhguara.",

    solarExtremeDaysTitle: "Ditët me rrezatimin më të lartë dhe më të ulët",
    solarExtremeDaysDesc: "Ditët me rrezatim të ulët tregojnë ditë me vranësira — sfidë për energjinë diellore.",
    solarHighestDays: "{n} ditët me rrezatimin më të lartë",
    solarLowestDays: "{n} ditët me rrezatimin më të ulët",
    solarPeakAxis: "Rrezatimi maksimal (W/m²)",
    solarExtremeDaysExplanation:
      "Ditët renditen sipas rrezatimit maksimal që kanë arritur, prandaj çdo shtyllë tregon momentin më të mirë të asaj dite. Dallimi mes dy paneleve tregon sa kushton një ditë me vranësira: ditët më të errëta arrijnë vetëm një pjesë të vogël të atyre më të ndritshme.",
    solarExtremeDaysAssumption:
      "Maksimumi ditor është matja më e lartë e vetme e asaj dite, jo mesatarja ditore. Një ditë me ndërprerje të sensorit rreth mesditës mund të renditet më poshtë sesa ka qenë në realitet.",

    solarHeatmapTitle: "Harta e rrezatimit diellor sipas muajit dhe vitit",
    solarHeatmapDesc: "Krahasimi i rrezatimit mesatar — ngjyra më e ngrohtë = rrezatim më i lartë.",
    solarHeatmapScale: "Rrezatimi mesatar (W/m²)",
    solarHeatmapExplanation:
      "Leximi përgjatë një rreshti krahason të njëjtin muaj mes viteve; leximi poshtë një kolone ndjek një vit përgjatë stinëve. Qelizat bosh janë muaj që regjistrimi nuk i mbulon — ato lihen bosh dhe nuk vizatohen si zero.",
    solarHeatmapAssumption:
      "Çdo qelizë është mesatarja e vlerave ditore të vëzhguara në atë muaj dhe vit.",
    heatmapCellNote: "{filled} qeliza muaj-vit përmbajnë të dhëna.",
    heatmapSkipped: "{n} u përjashtuan sepse kishin më pak se 10 ditë të vëzhguara.",

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

    /* ---- të dhënat ujore: niveli, temperatura e ujit, kripshmëria, TDS, përçueshmëria ---- */
    partialYear: "vit i vëzhguar pjesërisht",
    partialYearsNote:
      "Vitet që regjistrimi nuk i mbulon nga fillimi në fund janë vizatuar me gri dhe janë lënë jashtë trendit — mesataret e tyre nuk janë të krahasueshme me ato të një viti të plotë.",
    yearsShort: "vit",
    completeYearsCount: "{n} vite të vëzhguara plotësisht",
    eventWindowNote: "Dritarja është ±{days} ditë rreth kulmit të regjistrimit.",
    floodPeak: "Kulmi i përmbytjes",
    dilutionMinimum: "Vlera më e ulët",
    annualRangeLegend: "Diapazoni vjetor min–maks",
    annualMaximumLegend: "Maksimumi vjetor",
    trendCompleteYears: "Trendi mbi vitet e plota",
    annualMaximum: "Maksimumi vjetor",
    dayOfYear: "Dita e vitit",
    historicalMedian: "Mediana historike",
    referencePeriod: "Periudha e referencës",
    currentYearOverlay: "Viti i mbivendosur",
    seasonalBandBasis:
      "Brezat janë percentilet 10/25/50/75/90 për çdo ditë të vitit gjatë {n} viteve të referencës ({years}); viti i fundit është vizatuar mbi to, jo i përfshirë në to.",
    ofTimeExceeded: "e kohës me vlerë të barabartë ose më të lartë",
    medianValue: "Mediana",
    exceedanceAxis: "Përqindja e kohës kur vlera barazohet ose tejkalohet (%)",
    logScale: "shkallë logaritmike",
    logScaleUnavailable: "Boshti është linear sepse seria përmban vlera zero ose negative, të cilat shkalla logaritmike nuk i paraqet dot.",
    durationElevated: "{code}10 — e lartë",
    durationDilute: "{code}90 — e ulët/e holluar",
    durationWarmEnd: "T10 — i ngrohtë",
    durationColdEnd: "T90 — i ftohtë",
    durationMarkerNote: "Shenjat janë percentile të këtij regjistrimi, jo standarde për përdorimin e ujit — zëvendësojini me kufijtë vendorë para se të lexohen si pragje.",
    exceedingDays: "Ditë mbi pragun",
    shareOfMonitoredDays: "Pjesa e ditëve të monitoruara",
    thresholdUsed: "Pragu",
    recordPercentilePlaceholder: "percentili i {p}-të i regjistrimit — vlerë e përkohshme",
    exceedanceShareAxis: "Ditë mbi pragun (% e ditëve të monitoruara)",

    waterLevelHydrographTitle: "Niveli i ujit të lumit me pragjet e alarmit për përmbytje — ngjarja më e madhe e regjistruar",
    waterLevelHydrographDesc: "Ngjarja më e madhe e regjistrimit, e riparaqitur orë pas ore mbi brezat e alarmit.",
    bandNormal: "Normal",
    bandAlert: "Vëmendje",
    bandWarning: "Paralajmërim",
    bandDanger: "Rrezik",
    waterLevelHydrographExplanation:
      "Një nivel në metra nuk thotë asgjë i vetëm; brezat janë ata që e bëjnë të lexueshëm. Edhe forma ka rëndësi — kjo ngjarje u ngrit nga rrjedha bazë në kulm brenda pak orësh, dhe kaq është koha reale që do të kishte një alarm.",
    waterLevelHydrographAssumption:
      "Kufijtë e brezave janë percentile të këtij regjistrimi (i 99-ti, i 99.9-ti dhe maksimumi i regjistruar), jo nivelet zyrtare të alarmit të operatorit. Ata duhet të zëvendësohen me pragjet reale para përdorimit operativ; siç është, grafiku është retrospektiv dhe nuk përmban parashikim.",

    levelDurationTitle: "Kurba e kohëzgjatjes së nivelit — sa shpesh lumi rrjedh lart, normal ose ulët",
    levelDurationDesc: "Pjesa e ditëve në të cilat çdo nivel barazohet ose tejkalohet, vitet e para kundrejt atyre të fundit.",
    levelHighWater: "L10 — ujë i lartë",
    levelLowWater: "L95 — ujë i ulët",
    levelDurationExplanation:
      "Lexohet tërthorazi, jo për së gjati: lartësia e kurbës në 95 % është niveli mbi të cilin lumi qëndron pothuajse gjithë vitin, ndërsa hapësira mes dy periudhave tregon nëse i gjithë regjimi ka ndryshuar, jo nëse një përmbytje e vetme ishte më e madhe.",
    levelDurationAssumption:
      "Ndërtuar nga niveli i ujit, jo nga prurja — nuk kishte kurbë kalibrimi për ta kthyer njërën në tjetrën, prandaj këto vlera i përkasin vetëm këtij shtrati dhe kësaj kuote matëse dhe nuk krahasohen me standardet rajonale Q10/Q95.",

    floodFrequencyTitle: "Frekuenca e përmbytjeve: sa i rrallë është një nivel i tillë uji?",
    floodFrequencyDesc: "Maksimumet vjetore kundrejt periudhës së kthimit, me shpërndarjen Gumbel të përshtatur.",
    floodFrequencyExplanation:
      "Çdo pikë është niveli më i lartë i një viti, i vendosur në periudhën e kthimit që i takon nga renditja. Vija e përshtatur e shtrin këtë renditje në një vlerësim se sa shpesh përsëritet një nivel i dhënë — dhe gjerësia e brezit rreth saj është masa e ndershme e asaj që një regjistrim kaq i shkurtër mund të thotë.",
    floodFrequencyAssumption:
      "Vetëm ilustrues. Praktika standarde kërkon 20–30 vite maksimumesh vjetore; ky regjistrim ka shumë më pak, prandaj kurba ndalet në tre herë numrin e viteve dhe nuk shtrihet deri te niveli 100-vjeçar. Pozicionet e vizatimit janë Gringorten, përshtatja është me katrorët më të vegjël mbi variablin e reduktuar Gumbel, dhe vitet e vëzhguara pjesërisht janë shënuar por janë mbajtur në përshtatje.",
    recordLength: "{n} maksimume vjetore",
    extrapolationCap: "shtrirja e kufizuar në {n} vite",
    returnPeriod: "Periudha e kthimit",
    returnPeriodAxis: "Periudha e kthimit (vite, shkallë logaritmike)",
    confidenceBand: "Intervali i besueshmërisë 95 %",
    gumbelFit: "Shpërndarja Gumbel e përshtatur",
    completeYearMax: "Maksimumi i një viti të plotë",
    partialYearMax: "Maksimumi i një viti të pjesshëm",

    thermalHydrographTitle: "Temperatura e ujit me pragjet e stresit termik — ngjarja më e ngrohtë e regjistruar",
    thermalHydrographDesc: "Ngjarja më e ngrohtë e regjistrimit, e riparaqitur mbi brezat e përgjithshëm të stresit për jetën ujore.",
    bandCold: "I ftohtë",
    bandOptimal: "Optimal",
    bandWarmStress: "Stres nga ngrohtësia",
    bandCritical: "Kritik",
    thermalHydrographExplanation:
      "Dhëmbëzimi ditor është cikli normal ditë–natë; ajo që ka rëndësi është sa thellë në brezin e stresit hyjnë kulmet ditore dhe për sa ditë radhazi, sepse stresi termik mbi jetën ujore grumbullohet dhe nuk rikthehet në zero çdo natë.",
    thermalHydrographAssumption:
      "Brezat janë udhëzim i përgjithshëm për jetën ujore (nën 4 °C i ftohtë, 4–20 °C optimal, 20–25 °C stres nga ngrohtësia, mbi 25 °C kritik), jo standard i posaçëm për një specie apo i miratuar rajonalisht. Zëvendësojini me kufij realë ekologjikë para se ky grafik të lexohet si grafik përputhshmërie.",

    dilutionTitleSalinity: "Reagimi i kripshmërisë ndaj një përmbytjeje — hollimi gjatë rrjedhës së lartë",
    dilutionTitleTds: "Reagimi i TDS-së ndaj një përmbytjeje — hollimi gjatë rrjedhës së lartë",
    dilutionTitleConductivity: "Reagimi i përçueshmërisë ndaj një përmbytjeje — hollimi gjatë rrjedhës së lartë",
    dilutionDesc: "E njëjta përmbytje si te grafiku i nivelit, me vlerën e ngarkesës së tretur mbi të, në boshtin e dytë.",
    dilutionExplanation:
      "Dy sensorë të pavarur, një mekanizëm i vetëm: vala e përmbytjes vjen dhe hollon ngarkesën e tretur, prandaj vlera bie pikërisht kur niveli ngrihet. Për të njëjtën arsye këto vlera rriten gjatë thatësirës — e njëjta ngarkesë në më pak ujë.",
    dilutionAssumption:
      "Ngjarja zgjidhet nga seria e nivelit të ujit, prandaj ky grafik dhe hidrogrami tregojnë gjithmonë të njëjtën stuhi. Të dyja seritë vizatohen në kohët e tyre të regjistruara; aty ku njëri sensor ka mungesë, vija thjesht e kapërcen atë.",

    annualTrendTitleWaterTemp: "Trendi afatgjatë i temperaturës së ujit — a po ngrohet lumi?",
    annualTrendTitleSalinity: "Trendi afatgjatë i kripshmërisë — a po kriposet lumi?",
    annualTrendTitleTds: "Trendi afatgjatë i TDS-së — a po ndryshon ngarkesa e tretur?",
    annualTrendTitleConductivity: "Trendi afatgjatë i përçueshmërisë — a po ndryshon ngarkesa minerale?",
    annualTrendDesc: "Mesatarja vjetore me diapazonin e vëzhguar minimum–maksimum pas saj, dhe trendi i përshtatur mbi vitet e plota.",
    annualTrendExplanation:
      "Shtylla është i gjithë diapazoni që sensori regjistroi atë vit dhe shenja është mesatarja vjetore; vija e ndërprerë është përshtatja me katrorët më të vegjël vetëm mbi mesataret e viteve të vëzhguara plotësisht.",
    annualTrendAssumption:
      "Me vetëm pak vite të plota kjo është një kontroll paraprak, jo trend i konfirmuar — shenja e pjerrësisë vlen më shumë se vlera e saj, dhe një vit i pazakontë mund ta përmbysë.",

    seasonalClimatologyTitleWaterTemp: "Klimatologjia sezonale e temperaturës së ujit: a është kjo normale për këtë periudhë të vitit?",
    seasonalClimatologyTitleSalinity: "Klimatologjia sezonale e kripshmërisë: a është kjo normale për këtë periudhë të vitit?",
    seasonalClimatologyTitleTds: "Klimatologjia sezonale e TDS-së: a është kjo normale për këtë periudhë të vitit?",
    seasonalClimatologyTitleConductivity: "Klimatologjia sezonale e përçueshmërisë: a është kjo normale për këtë periudhë të vitit?",
    seasonalClimatologyDesc: "Brezat e percentileve sipas ditës së vitit nga vitet e mëparshme, me vitin e fundit të mbivendosur.",
    seasonalClimatologyExplanation:
      "I njëjti numër do të thotë gjëra të ndryshme në prill dhe në gusht. Krahasimi i vitit të fundit me brezin e asaj dite të vitit e heq ciklin sezonal, dhe ajo që mbetet është pjesa vërtet e pazakontë.",
    seasonalClimatologyAssumption:
      "Me vetëm pak vite referencë, çdo percentil mbështetet në një grusht vlerash, prandaj brezat janë të dhëmbëzuar dhe i 10-ti e i 90-ti janë afër minimumit e maksimumit të vëzhguar. Ata përshkruajnë këtë regjistrim të shkurtër, jo një normë klimatike.",

    durationCurveTitleWaterTemp: "Kurba termike e kohëzgjatjes — sa shpesh lumi është i ngrohtë, i butë apo i ftohtë?",
    durationCurveTitleSalinity: "Kurba e kohëzgjatjes së kripshmërisë — sa shpesh lumi është mbi një prag përdorimi?",
    durationCurveTitleTds: "Kurba e kohëzgjatjes së TDS-së — sa shpesh lumi është mbi një prag përdorimi?",
    durationCurveTitleConductivity: "Kurba e kohëzgjatjes së përçueshmërisë — sa shpesh lumi është mbi një prag përdorimi?",
    durationCurveDesc: "Vitet e para kundrejt atyre të fundit përgjatë gjithë diapazonit, jo vetëm te ekstremet.",
    durationCurveExplanation:
      "Nëse kurba e viteve të fundit qëndron mbi atë të mëparshmen përgjatë pjesës më të madhe të gjatësisë, atëherë i gjithë regjimi ka ndryshuar — sinjal më i gjerë dhe më i besueshëm se çdo ditë e vetme rekord.",
    durationCurveAssumption:
      "Të dyja kurbat ndërtohen nga mesataret ditore dhe vizatohen në pozicionet Weibull të tejkalimit. Regjistrimi ndahet në gjysmën e parë dhe të dytë të viteve të tij; me një regjistrim kaq të shkurtër, secila dritare ka vetëm pak vite.",

    exceedanceDaysTitleWaterTemp: "Frekuenca e ditëve me stres termik sipas viteve",
    exceedanceDaysTitleSalinity: "Frekuenca e ditëve me kripshmëri të lartë sipas viteve",
    exceedanceDaysTitleTds: "Frekuenca e ditëve me TDS të lartë sipas viteve",
    exceedanceDaysTitleConductivity: "Frekuenca e ditëve me përçueshmëri të lartë sipas viteve",
    exceedanceDaysDesc: "Pjesa e ditëve të monitoruara në çdo vit që qëndruan mbi pragun.",
    exceedanceDaysExplanation:
      "Ky është leximi më i drejtpërdrejtë vit pas viti i gjithë grupit: një pjesë në rritje është sinjal konkret dhe i numërueshëm, ndërsa paraqitja si përqindje e ditëve të monitoruara nuk lejon që një vit me ndërprerje të sensorit të duket i qetë.",
    exceedanceDaysAssumption:
      "Pragu është percentili i 90-të i këtij regjistrimi — një vlerë e përkohshme që, nga vetë ndërtimi, lë rreth një të dhjetën e ditëve mbi të. Një tregues operativ kërkon kufirin e vetë rregullatorit ose të ekologut; atëherë ajo që mbetet e vlefshme është modeli vit-pas-viti, jo niveli.",

    // ---- ndjekje e recensionit: boshtet, legjendat, gjendjet bosh -------
    axisTruncatedNote:
      "Boshti vertikal fillon mbi zero që dallimet mes muajve të mbeten të dukshme.",
    rainfallWhiskerNote:
      "Aty ku devijimi mes viteve është më i madh se vetë mesatarja e muajit, krahu i poshtëm vizatohet deri në zero: një muaj nuk mund të regjistrojë thellësi negative reshjesh.",
    dualAxisNote:
      "Barrat lexohen sipas boshtit të majtë (ditët me shi), vija sipas atij të djathtë (pjesa e ditëve të vëzhguara).",
    landslideNoCriticalDetail:
      "Gjatë {years} viteve të regjistruara asnjë dritare 1–5 ditore nuk e arriti pragun e konfiguruar intensitet-kohëzgjatje. Kjo është pohim për pragun dhe këtë regjistrim, jo mungesë e të dhënave — para përdorimit operativ, verifikoni që pragu është ai që kërkon gjeologjia lokale.",
    seasonalBandOutageNote:
      "Një segment ku banda bie drejt zeros është ndërprerje e sensorit në një prej atyre viteve që shfaqet përmes përqindjeve, jo sinjal sezonal — lexojeni së bashku me shënimin e mbulimit më lart.",
    weakTrendCaution:
      "R² = {r2}: vija e drejtë shpjegon vetëm {pct} % të luhatjes mes muajve, prandaj pjerrësia është tregues drejtimi, jo normë e matur e ngrohjes.",
    largestAnomalies: "Devijimet më të mëdha nga norma mujore: {up} në {upMonth}, {down} në {downMonth}.",
    fullYearLegend: "Vit i vëzhguar plotësisht",
    leftAxisSuffix: "boshti i majtë",
    rightAxisSuffix: "boshti i djathtë",
    dailyValueLegend: "Vlera ditore",
    monthlyValueLegend: "Vlera mujore",
    monthlyTotalLegend: "Totali mujor",
    anomalyAboveLegend: "Mbi mesataren mujore",
    anomalyBelowLegend: "Nën mesataren mujore",
    longTermMeanLegend: "Mesatarja afatgjate",
    rollingMeanLegend: "Mesatarja rrëshqitëse 30-ditore",
    episodeAxis: "Episodi",
    countOfDaysAxis: "Numri i ditëve",
    qualifyingDryDaysAxis: "Ditët e thata kualifikuese",
    noQualifyingEvents: "Asnjë ngjarje kualifikuese e regjistruar në këtë periudhë.",
    zeroForYear: "0 — asnjë ditë nuk e kaloi pragun",
    partialYearExcluded: "* Vit i vëzhguar pjesërisht — i pakrahasueshëm me një vit të plotë",
    windRoseRingNote: "Rrathët vizatohen çdo {step} % të vëzhgimeve totale.",
    circularMeanNote:
      "Drejtimi mesatarizohet si vektor (mesatare rrethore): mesatarja e zakonshme e 1° dhe 359° do të ishte 180°, pra drejtimi i kundërt.",
    directionRoseHint:
      "Një bar chart nuk mund të paraqesë drejtimin e erës — një muaj me mesatare 5° dhe një muaj me mesatare 355° fryjnë të dy nga veriu, por bien në skaje të kundërta të boshtit. Lexoni rrozën e erës më lart.",
    noChartData: "Ky grafik nuk mund të vizatohet",
    scenarioProjectedLabel: "parashikim",
    scenarioObservedLabel: "vëzhguar",
    projectionGapNote:
      "Vija e vëzhguar përfundon aty ku përfundon regjistrimi; viti i fundit i vëzhguar pjesërisht lihet jashtë që të mos duket si rënie e papritur.",
    trendNotFitted: "Pa trend të llogaritur — shumë pak vite të vëzhguara plotësisht",
    referenceBandNarrowNote:
      "Me vetëm {years} vite referimi, bandat e përqindjeve mbështeten në pak vlera, prandaj qëndrojnë afër njëra-tjetrës dhe afër intervalit të vëzhguar.",
  },
};

export function makeT(lang) {
  const dict = STRINGS[lang] || STRINGS.en;
  return (key) => dict[key] ?? key;
}
