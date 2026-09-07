// Shared engine for the "daily series + 30-day rolling mean + long-term mean"
// charts: Rrezatimi 1 (solar radiation) and Shtypja 1 (air pressure). Both were
// marked OK by the reviewer apart from titling, so the same construction serves
// each and only labels differ at the component level.
const ROLLING_WINDOW_DAYS = 30;

function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult() {
  return { daily: [], longTermMean: null, maximum: null, minimum: null, count: 0, departure: null };
}

export function calculateDailyTrend(dailyRecords, { window = ROLLING_WINDOW_DAYS } = {}) {
  if (!Array.isArray(dailyRecords)) return emptyResult();

  const rows = dailyRecords
    .map((row) => ({ date: String(row?.d ?? ""), value: parseValue(row?.v) }))
    .filter((row) => row.date && row.value != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) return emptyResult();

  const daily = rows.map((row, index) => {
    const start = Math.max(0, index - window + 1);
    const slice = rows.slice(start, index + 1);
    return {
      date: row.date,
      value: row.value,
      // a partial window at the start of the record would read as a spurious
      // trend, so the rolling line only begins once a full window exists
      rolling: slice.length === window
        ? +(slice.reduce((sum, item) => sum + item.value, 0) / window).toFixed(2)
        : null,
    };
  });

  const values = rows.map((row) => row.value);
  const longTermMean = +(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);
  const maximum = rows.reduce((best, row) => (row.value > best.value ? row : best), rows[0]);
  const minimum = rows.reduce((best, row) => (row.value < best.value ? row : best), rows[0]);

  return {
    daily,
    longTermMean,
    maximum,
    minimum,
    count: rows.length,
    departure: findDeparture(rows, daily, longTermMean, window),
  };
}

const DAY_MS = 86400000;

/** Whole days from one ISO date to another, both ends counted. */
function spanInDays(startDate, endDate) {
  const from = Date.parse(`${startDate}T00:00:00Z`);
  const to = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.round((to - from) / DAY_MS) + 1;
}

/**
 * The record's most marked sustained excursion away from the long-term mean.
 *
 * A reader who meets a steep late-record swing has no way to tell a real one
 * from a broken sensor or a hole in the series, and the chart used to leave
 * them guessing. So the run is named, and reported together with how much of
 * it is actually observed: full coverage is what separates a measured
 * excursion from a gap that merely looks like one.
 *
 * The run is the stretch around the rolling mean's furthest point that stays
 * on the same side of the long-term mean by at least one standard deviation.
 * Anything shorter than the rolling window is a blip rather than an excursion
 * and is not worth calling out.
 *
 * Clearing the rolling mean's own standard deviation is not on its own enough
 * to be worth a sentence: averaging thirty days flattens the line so far that
 * on a near-flat series a fraction of a unit already counts as an outlier. The
 * run also has to stand out against the daily scatter the reader can see, so
 * it must sit at least half a daily standard deviation off the mean.
 */
function findDeparture(rows, daily, longTermMean, window) {
  const trend = daily.filter((row) => row.rolling != null);
  if (trend.length < window) return null;

  const deviations = trend.map((row) => row.rolling - longTermMean);
  const mean = deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
  const sd = Math.sqrt(deviations.reduce((sum, value) => sum + (value - mean) ** 2, 0) / deviations.length);
  if (!(sd > 0)) return null;

  let peak = 0;
  for (let i = 1; i < deviations.length; i += 1) {
    if (Math.abs(deviations[i]) > Math.abs(deviations[peak])) peak = i;
  }
  if (Math.abs(deviations[peak]) < sd) return null;

  const sign = Math.sign(deviations[peak]);
  const holds = (i) => Math.sign(deviations[i]) === sign && Math.abs(deviations[i]) >= sd;
  let first = peak;
  let last = peak;
  while (first > 0 && holds(first - 1)) first -= 1;
  while (last < deviations.length - 1 && holds(last + 1)) last += 1;

  // Each rolling point trails its own window, so the observations behind this
  // run start a window before the run's first point.
  const startIndex = Math.max(0, rows.findIndex((row) => row.date === trend[first].date) - window + 1);
  const endIndex = rows.findIndex((row) => row.date === trend[last].date);
  if (startIndex < 0 || endIndex < startIndex) return null;

  const observed = rows.slice(startIndex, endIndex + 1);
  if (observed.length < window) return null;

  const start = observed[0].date;
  const end = observed.at(-1).date;
  const spanDays = spanInDays(start, end);
  const runMean = observed.reduce((sum, row) => sum + row.value, 0) / observed.length;

  const dailySd = Math.sqrt(
    rows.reduce((sum, row) => sum + (row.value - longTermMean) ** 2, 0) / rows.length
  );
  if (Math.abs(runMean - longTermMean) < dailySd / 2) return null;

  return {
    start,
    end,
    mean: +runMean.toFixed(2),
    delta: +(runMean - longTermMean).toFixed(2),
    direction: runMean < longTermMean ? "below" : "above",
    observedDays: observed.length,
    spanDays,
    complete: spanDays != null && observed.length >= spanDays,
  };
}
