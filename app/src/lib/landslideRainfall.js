export const RAINFALL_INTENSITY_SOURCE_UNIT = "mm/h";
export const LANDSLIDE_DURATIONS_DAYS = [1, 2, 3, 4, 5];

export class RainfallIndicatorError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RainfallIndicatorError";
    this.code = code;
  }
}

// Intensity-duration threshold for the possible initiation of rainfall-induced
// landslides in the CADSES area (Central European Adriatic Danubian
// South-Eastern Space), the region this basin belongs to:
//
//     I = 8.67 * D^-0.61      I in mm/h, D in HOURS
//
// Guzzetti, Peruccacci, Rossi & Stark (2007), "Rainfall thresholds for the
// initiation of landslides in central and southern Europe", Meteorology and
// Atmospheric Physics 98:239-267, Figure 6C: the curve inferred by Bayesian
// analysis from the 2nd-percentile estimates, valid for rainfall durations
// from 5 minutes to 700 hours. The 24-120 h windows used here sit well inside
// that range.
//
// It is a LOWER-BOUND curve. Below it landslides are not expected; above it
// they become possible. Crossing it is not a prediction that one occurred, and
// the paper is explicit that these thresholds "will not predict landslides".
export const LANDSLIDE_THRESHOLD_COEFFICIENT = 8.67;
export const LANDSLIDE_THRESHOLD_EXPONENT = -0.61;
export const LANDSLIDE_THRESHOLD_VALID_HOURS = [5 / 60, 700];

/**
 * @param {number} durationDays  window length in days, as the chart's axis reads
 * @returns {number|null} mean rainfall intensity in mm/h at the threshold
 */
export function landslideThreshold(durationDays) {
  if (!Number.isFinite(durationDays) || durationDays <= 0) return null;
  // The published curve is a function of duration in hours. Feeding it days
  // put the one-day bar at 8.76 mm/h sustained for 24 h — 210 mm of rain in a
  // day, against a wettest day on record here of 83 mm — so the indicator
  // could never fire on a real event.
  const durationHours = durationDays * 24;
  return LANDSLIDE_THRESHOLD_COEFFICIENT * durationHours ** LANDSLIDE_THRESHOLD_EXPONENT;
}

export function selectRainIntensityHourly(station) {
  const hourly = station?.measurements?.rain_intensity?.hourly;
  return Array.isArray(hourly) ? hourly : [];
}

// Plausibility limit for one calendar day of rain, in mm.
//
// The review flagged daily totals of 719.6 mm at Batllavë, 180 mm on the same
// chart, 843.9 mm at Kërpimeh and 364.7 mm at Podujevë as impossible, and they
// are: each is a single logged hour carrying several hundred millimetres on its
// own, at stations whose rainfall depth has to be rebuilt from the intensity
// series because they have no gauge. A whole day above this limit is treated as
// an unusable record and dropped, exactly as a day the sensor never reported.
// Every other value is left as measured — a day is only ever removed whole, so
// no figure on any chart is quietly rewritten.
//
// 150 mm sits far above anything observed here (Shajkoc's gauge, the one
// station measuring depth directly, peaks at 55.8 mm for a full day) and still
// below every value the review objected to.
export const MAX_PLAUSIBLE_DAILY_RAINFALL_MM = 150;

export const RAINFALL_SOURCE_GAUGE = "gauge";
export const RAINFALL_SOURCE_INTENSITY = "intensity";

/**
 * Which series the rainfall depth indicators should read.
 *
 * The specification originally said depth was to come from the rain-intensity
 * series alone and that the gauge was not to be used even as a fallback. That
 * holds only if the stored intensity is a mean over the whole clock hour, and
 * at these stations it is not: `rain_intensity` is recorded with kind "avg",
 * the mean of the readings logged *while it was raining*, and the logger writes
 * rows for only about a tenth of all hours. Treating one such reading as an
 * hour of rain assumes it rained for the full sixty minutes.
 *
 * Shajkoc carries both series, and they disagree: 24.3 mm on the gauge for
 * 2024-07-02 against 83.1 mm rebuilt from intensity, and 500-670 mm a year
 * against 1190-1503. So where the gauge exists it is the depth source. The
 * other four stations have no gauge at all, so they keep the intensity
 * reconstruction and the charts say so rather than presenting the two as
 * equivalent.
 */
export function selectRainfallDepthSource(station) {
  const gauge = station?.measurements?.rainfall;
  if (Array.isArray(gauge?.hourly) && gauge.hourly.length) {
    return { measurement: gauge, source: RAINFALL_SOURCE_GAUGE };
  }
  const intensity = station?.measurements?.rain_intensity;
  const hasIntensity = Array.isArray(intensity?.hourly) && intensity.hourly.length;
  return { measurement: hasIntensity ? intensity : null, source: RAINFALL_SOURCE_INTENSITY };
}

function hourStart(timestamp) {
  const date = timestamp instanceof Date ? new Date(timestamp) : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  date.setMinutes(0, 0, 0);
  return date;
}

function localDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Reconstruct a continuous hourly depth series, one value per clock hour, with
 * absent hours read as no rain.
 *
 * Each stored row already carries one clock hour, so its value is taken as that
 * hour's depth in mm and never multiplied by 60. From the gauge (kind "sum")
 * that is exactly the depth measured. From the intensity series (kind "avg") it
 * is a proxy that over-states rain, for the reason set out on
 * selectRainfallDepthSource; only the stations without a gauge rely on it.
 *
 * Days totalling more than MAX_PLAUSIBLE_DAILY_RAINFALL_MM are dropped whole as
 * sensor faults — see the constant. Every rainfall chart derives its daily
 * totals from here, so one filter keeps them all consistent.
 */
export function reconstructHourlyRainfall(hourlyRecords) {
  if (!Array.isArray(hourlyRecords) || !hourlyRecords.length) return [];

  const buckets = new Map();
  hourlyRecords.forEach((row) => {
    const timestamp = hourStart(row?.d);
    const intensityMmPerHour = Number(row?.v);
    if (!timestamp || !Number.isFinite(intensityMmPerHour) || intensityMmPerHour < 0) return;
    const key = timestamp.getTime();
    const bucket = buckets.get(key) || { sum: 0, count: 0 };
    bucket.sum += intensityMmPerHour;
    bucket.count += 1;
    buckets.set(key, bucket);
  });

  if (!buckets.size) return [];
  const times = [...buckets.keys()].sort((a, b) => a - b);
  const hourly = [];
  for (let time = times[0]; time <= times[times.length - 1]; time += 60 * 60 * 1000) {
    const bucket = buckets.get(time);
    // Normally there is one stored row per hour. Averaging duplicates keeps the
    // operation deterministic without interpreting duplicates as extra depth.
    const intensityMmPerHour = bucket ? bucket.sum / bucket.count : 0;
    hourly.push({
      timestamp: new Date(time),
      intensityMmPerHour,
      // One-hour depth proxy required by the documented methodology.
      depthMm: intensityMmPerHour,
      filled: !bucket,
    });
  }

  // A day whose total is physically impossible carries a broken reading
  // somewhere inside it, and there is no way to tell which hour is at fault —
  // so the day goes out entire rather than being partly rewritten.
  const dayTotals = new Map();
  for (const row of hourly) {
    const day = localDay(row.timestamp);
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + row.depthMm);
  }
  const implausible = new Set(
    [...dayTotals.entries()].filter(([, total]) => total > MAX_PLAUSIBLE_DAILY_RAINFALL_MM).map(([day]) => day)
  );
  return implausible.size ? hourly.filter((row) => !implausible.has(localDay(row.timestamp))) : hourly;
}

export function calculateLandslideRainfallIndicator(hourlyRecords) {
  const hourly = reconstructHourlyRainfall(hourlyRecords);
  if (!hourly.length) {
    return {
      hourly: [],
      yearly: [],
      criticalDays: [],
      durations: LANDSLIDE_DURATIONS_DAYS,
      thresholdAudit: null,
    };
  }

  const years = new Set(hourly.map((row) => row.timestamp.getFullYear()));
  const coverage = new Map();
  hourly.forEach((row) => {
    const year = row.timestamp.getFullYear();
    const date = localDay(row.timestamp);
    const current = coverage.get(year);
    coverage.set(year, {
      first: current?.first == null || date < current.first ? date : current.first,
      last: current?.last == null || date > current.last ? date : current.last,
    });
  });
  const maxima = new Map();
  const criticalDays = new Set();

  LANDSLIDE_DURATIONS_DAYS.forEach((duration) => {
    const windowHours = duration * 24;
    const threshold = landslideThreshold(duration);
    let rollingDepthMm = 0;

    hourly.forEach((row, index) => {
      rollingDepthMm += row.depthMm;
      if (index >= windowHours) rollingDepthMm -= hourly[index - windowHours].depthMm;
      if (index < windowHours - 1) return;

      const rollingMeanIntensityMmPerHour = rollingDepthMm / windowHours;
      const year = row.timestamp.getFullYear();
      const key = `${year}:${duration}`;
      const current = maxima.get(key);
      if (current == null || rollingMeanIntensityMmPerHour > current) {
        maxima.set(key, rollingMeanIntensityMmPerHour);
      }
      if (rollingMeanIntensityMmPerHour > threshold) {
        criticalDays.add(localDay(row.timestamp));
      }
    });
  });

  const yearly = [...years].sort((a, b) => a - b).map((year) => {
    const observed = coverage.get(year);
    const values = LANDSLIDE_DURATIONS_DAYS.map((duration) => {
      const maximum = maxima.get(`${year}:${duration}`) ?? null;
      const threshold = landslideThreshold(duration);
      return {
        duration,
        maximum,
        threshold,
        exceeded: maximum != null && maximum > threshold,
      };
    });
    return {
      year,
      values,
      exceeded: values.some((value) => value.exceeded),
      criticalDays: [...criticalDays].filter((day) => Number(day.slice(0, 4)) === year).length,
      availableStart: observed?.first ?? null,
      availableEnd: observed?.last ?? null,
      isPartial:
        observed?.first !== `${year}-01-01` ||
        observed?.last !== `${year}-12-31`,
    };
  });

  // Audit the configured curve against the record instead of silently
  // accepting a threshold that may never be capable of firing. This does not
  // pretend to be local geotechnical calibration: it answers the reviewer's
  // concrete health-check question — whether the configured threshold has
  // ever activated, and how close the strongest observed window came.
  const durationChecks = LANDSLIDE_DURATIONS_DAYS.map((duration) => {
    const threshold = landslideThreshold(duration);
    const observedMaxima = yearly
      .map((row) => row.values.find((value) => value.duration === duration)?.maximum)
      .filter((value) => value != null && Number.isFinite(value));
    const maximum = observedMaxima.length ? Math.max(...observedMaxima) : null;
    return {
      duration,
      maximum,
      threshold,
      ratio: maximum == null ? null : maximum / threshold,
      exceeded: maximum != null && maximum > threshold,
    };
  });
  const closest = durationChecks
    .filter((row) => row.ratio != null)
    .reduce((best, row) => (best == null || row.ratio > best.ratio ? row : best), null);
  const yearsTriggered = yearly.filter((row) => row.criticalDays > 0).length;
  const thresholdAudit = {
    triggered: criticalDays.size > 0,
    criticalDays: criticalDays.size,
    yearsTriggered,
    closestDuration: closest?.duration ?? null,
    closestMaximum: closest?.maximum ?? null,
    closestThreshold: closest?.threshold ?? null,
    closestRatio: closest?.ratio ?? null,
    durationChecks,
  };

  return {
    hourly,
    yearly,
    criticalDays: [...criticalDays].sort(),
    durations: LANDSLIDE_DURATIONS_DAYS,
    thresholdAudit,
  };
}
