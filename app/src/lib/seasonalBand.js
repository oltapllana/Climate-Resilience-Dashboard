// Chart C of the water-quality and water-temperature specs: percentile bands by
// day of year built from the earlier years of record, with the current year
// drawn over them. Removing the seasonal cycle this way is what separates
// "unusually high for the season" from "it is August" — the reading a raw time
// series cannot give a non-specialist.
import { linearFit, percentile, readSeries, yearOf } from "./seriesUtils.js";

const PERCENTILES = [10, 25, 50, 75, 90];

// Percentiles of a single calendar day across a short record rest on one value
// per reference year: with three years the 10th and 90th are the minimum and
// the maximum, the two bands sit on top of each other, and the whole thing is
// jagged day to day. Pooling a centred ±7-day window is the standard
// climatological answer — 15 days × 3 years is ~45 values per day, enough for
// the quartiles to sit inside the 10–90 band and for the shape to read as a
// season rather than as sampling noise.
export const WINDOW_HALF_WIDTH = 7;

function emptyResult() {
  return {
    days: [],
    currentYear: null,
    historicalYears: [],
    count: 0,
    windowDays: WINDOW_HALF_WIDTH * 2 + 1,
    smoothingDays: SMOOTH_HALF_WIDTH * 2 + 1,
    medianSampleSize: 0,
    medianYearDepth: 0,
  };
}

function dayOfYear(key) {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

// The window wraps at the year boundary: 2 January is seven days from 27
// December, and cutting the window short there would make the band narrow at
// exactly the coldest part of the year.
function wrapSlot(slot) {
  if (slot < 1) return slot + 366;
  if (slot > 366) return slot - 366;
  return slot;
}

// A percentile over a sliding window is an order statistic, so it does not
// drift as the window moves — it holds flat while the same value stays in rank
// and then jumps when that value falls out. Left alone the band edges come out
// as a staircase of week-long plateaus, which reads as structure in the climate
// and is nothing of the sort. Averaging each percentile curve over a short
// centred window turns the staircase back into the smooth seasonal shape the
// samples actually describe; because the same average is applied to all five
// curves, their order is preserved and the bands cannot cross.
const SMOOTH_HALF_WIDTH = 5;

function smoothPercentiles(days) {
  if (days.length < 3) return;
  const bySlot = new Map(days.map((point) => [point.slot, point]));
  const wholeYear = days.length > 360;
  const smoothed = days.map((point) => {
    const out = {};
    for (const rank of PERCENTILES) {
      const key = `p${rank}`;
      if (point[key] == null) {
        out[key] = null;
        continue;
      }
      let sum = 0;
      let n = 0;
      for (let offset = -SMOOTH_HALF_WIDTH; offset <= SMOOTH_HALF_WIDTH; offset += 1) {
        // only a full year of slots can be averaged across the year boundary;
        // on a shorter record the ends are simply averaged over what is there
        const neighbour = bySlot.get(wholeYear ? wrapSlot(point.slot + offset) : point.slot + offset);
        if (neighbour?.[key] != null) {
          sum += neighbour[key];
          n += 1;
        }
      }
      out[key] = n ? sum / n : point[key];
    }
    return out;
  });
  days.forEach((point, index) => Object.assign(point, smoothed[index]));
}

// Pooling a ±7-day window buys sample size at a price: in the seasons where the
// cycle is steep the window carries the cycle itself. Water temperature climbs
// something like 0.1 °C a day through spring, so a 15-day window spans roughly
// 1.5 °C of pure seasonal rise, and that rise lands in the band as if it were
// variability. The symptom is a band that is wide in March and June and narrow
// across the August plateau — the width tracking the slope of the season rather
// than the spread of the years.
//
// So the window is detrended before it is ranked: fit a straight line through
// the pooled values against their day offset, take the percentiles of the
// residuals, and add them back onto the fitted value at the centre of the
// window. What is left in the band is the spread around the local seasonal
// level, which is the quantity the chart claims to be showing and is
// comparable from one season to the next. Adding one constant to ranked
// residuals cannot reorder them, so the bands still nest.
// Fitting a line costs two degrees of freedom, so the residuals are narrower
// than the spread they stand for — and on a thin window the effect is not a
// correction but a collapse: two points fit a line exactly, every residual is
// zero, and the band vanishes to a hairline at precisely the stretches where a
// sensor outage has left the record thinnest. Below this many values the window
// is ranked as it is; above it the residuals are rescaled by sqrt(n / (n - 2))
// to put back the width the fit absorbed.
const MIN_DETREND_SAMPLE = 6;

function windowPercentiles(sample) {
  const levels = {};
  const fit = sample.length >= MIN_DETREND_SAMPLE ? linearFit(sample) : null;
  if (!fit) {
    const values = sample.map((point) => point.y);
    for (const rank of PERCENTILES) levels[`p${rank}`] = percentile(values, rank);
    return levels;
  }
  // fit.at(0) is the fitted value on the day the window is centred on
  const centre = fit.at(0);
  const inflate = Math.sqrt(sample.length / (sample.length - 2));
  const residuals = sample.map((point) => (point.y - fit.at(point.x)) * inflate);
  for (const rank of PERCENTILES) levels[`p${rank}`] = centre + percentile(residuals, rank);
  return levels;
}

export function calculateSeasonalBand(dailyRecords) {
  const rows = readSeries(dailyRecords);
  if (!rows.length) return emptyResult();

  const years = [...new Set(rows.map((row) => yearOf(row.key)))].sort((a, b) => a - b);
  // the last year of record is the one being judged; everything before it is
  // the reference. With a single year there is nothing to compare against.
  const currentYear = years.length > 1 ? years.at(-1) : null;
  const historicalYears = currentYear == null ? years : years.slice(0, -1);

  const historical = new Map();
  const current = new Map();
  let firstSlot = 366;
  let lastSlot = 1;
  for (const row of rows) {
    const slot = dayOfYear(row.key);
    if (slot < firstSlot) firstSlot = slot;
    if (slot > lastSlot) lastSlot = slot;
    if (yearOf(row.key) === currentYear) current.set(slot, row.value);
    // the year is kept alongside the value: how many distinct reference years
    // stand behind a day decides what the band can honestly be said to measure
    else (historical.get(slot) ?? historical.set(slot, []).get(slot)).push({ year: yearOf(row.key), value: row.value });
  }

  const days = [];
  const sampleSizes = [];
  const yearDepths = [];
  for (let slot = firstSlot; slot <= lastSlot; slot += 1) {
    // carried as (day offset, value) pairs because the window is detrended
    // against that offset before it is ranked
    const sample = [];
    const yearsInWindow = new Set();
    for (let offset = -WINDOW_HALF_WIDTH; offset <= WINDOW_HALF_WIDTH; offset += 1) {
      const neighbour = historical.get(wrapSlot(slot + offset));
      if (!neighbour) continue;
      for (const entry of neighbour) {
        sample.push({ x: offset, y: entry.value });
        yearsInWindow.add(entry.year);
      }
    }
    const currentValue = current.get(slot) ?? null;
    if (!sample.length && currentValue == null) continue;
    const point = { slot, current: currentValue, samples: sample.length, referenceYears: yearsInWindow.size };
    if (sample.length) {
      sampleSizes.push(sample.length);
      yearDepths.push(yearsInWindow.size);
    }
    const levels = sample.length ? windowPercentiles(sample) : null;
    for (const rank of PERCENTILES) point[`p${rank}`] = levels ? levels[`p${rank}`] : null;
    days.push(point);
  }

  smoothPercentiles(days);
  for (const point of days) {
    // recharts stacks an area on the one below it, so the bands are carried as
    // widths over the p10 floor rather than as absolute levels
    point.outerBase = point.p10;
    point.outerBand = point.p10 == null ? null : point.p90 - point.p10;
    point.innerBase = point.p25;
    point.innerBand = point.p25 == null ? null : point.p75 - point.p25;
  }

  sampleSizes.sort((a, b) => a - b);
  yearDepths.sort((a, b) => a - b);
  const medianSampleSize = sampleSizes.length ? Math.round(percentile(sampleSizes, 50)) : 0;
  // The reference label spans the years the record touches, which is not the
  // same as the years standing behind a typical day: a station that came online
  // in October contributes one year to most of the calendar. When that depth is
  // one, the band is the scatter of a single year around its own seasonal
  // level, not a difference between years, and the chart has to say so.
  const medianYearDepth = yearDepths.length ? Math.round(percentile(yearDepths, 50)) : 0;

  return {
    days,
    currentYear,
    historicalYears,
    count: rows.length,
    windowDays: WINDOW_HALF_WIDTH * 2 + 1,
    smoothingDays: SMOOTH_HALF_WIDTH * 2 + 1,
    medianSampleSize,
    medianYearDepth,
  };
}
