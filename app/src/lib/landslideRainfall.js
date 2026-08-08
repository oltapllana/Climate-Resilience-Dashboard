export const RAINFALL_INTENSITY_SOURCE_UNIT = "mm/h";
export const LANDSLIDE_DURATIONS_DAYS = [1, 2, 3, 4, 5];

export class RainfallIndicatorError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RainfallIndicatorError";
    this.code = code;
  }
}

export function landslideThreshold(durationDays) {
  if (!Number.isFinite(durationDays) || durationDays <= 0) return null;
  return 8.76 * durationDays ** -0.61;
}

// The indicator is defined exclusively on rainfall intensity. Rainfall-depth
// aggregates are deliberately not accepted as a fallback source.
export function selectRainIntensityHourly(station) {
  const hourly = station?.measurements?.rain_intensity?.hourly;
  return Array.isArray(hourly) ? hourly : [];
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
 * Reconstruct the specification's continuous hourly series.
 * Stored v values are already arithmetic clock-hour means in mm/h. They are
 * used directly (never multiplied by 60), and absent clock hours become zero.
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
  return hourly;
}

export function calculateLandslideRainfallIndicator(hourlyRecords) {
  const hourly = reconstructHourlyRainfall(hourlyRecords);
  if (!hourly.length) {
    return { hourly: [], yearly: [], criticalDays: [], durations: LANDSLIDE_DURATIONS_DAYS };
  }

  const years = new Set(hourly.map((row) => row.timestamp.getFullYear()));
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
    };
  });

  return {
    hourly,
    yearly,
    criticalDays: [...criticalDays].sort(),
    durations: LANDSLIDE_DURATIONS_DAYS,
  };
}
