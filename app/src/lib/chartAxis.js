// Shared y-axis framing.
//
// Recharts defaults a numeric axis to [0, max]. For a series that lives far
// from zero — station pressure around 930 hPa, humidity around 70 % — that
// spends the whole plot on empty space and flattens the variation the chart
// exists to show. It also runs the other way: a rainfall axis padded below its
// minimum reaches -100 mm, and depth cannot be negative.
//
// axisScale frames the data instead: it pads the observed range, clamps the
// floor at zero for quantities that cannot go negative, and returns explicit
// round ticks. Explicit ticks matter beyond looks — Recharts' own tick picker
// produced 0.35 and 0.449 on the TDS axis, both of which print as "0.4".

// Units whose values cannot be negative. Temperature (°C) and anomalies are
// deliberately absent.
const NON_NEGATIVE_UNITS = new Set([
  "mm", "mm/h", "%", "W/m²", "m/s", "hPa", "mS", "SAL", "g/l", "m", "°",
]);

export function isNonNegativeUnit(unit) {
  return NON_NEGATIVE_UNITS.has(unit);
}

// A round step near span/targetTicks: 1, 2, 2.5 or 5 times a power of ten.
export function niceStep(span, targetTicks = 5) {
  if (!(span > 0)) return 1;
  const raw = span / Math.max(1, targetTicks);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalised = raw / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

// Decimal places a tick needs so that no two ticks print the same text. Read
// off the step itself rather than its magnitude: a step of 2.5 is larger than 1
// but still needs a decimal, or the axis prints 57.5 and 62.5 as 58 and 63.
export function stepDecimals(step) {
  if (!(step > 0)) return 0;
  const text = String(+Number(step).toPrecision(12));
  const point = text.indexOf(".");
  if (point === -1) return 0;
  return Math.min(6, text.length - point - 1);
}

// Keep only real numbers. The gap has to be dropped, not coerced: Number(null)
// is 0 and Number.isFinite(0) is true, so a series with holes in it — the
// rolling mean before its window fills, a month the sensor missed — used to
// contribute a zero for every hole and drag the whole axis down to it.
function finite(values) {
  const out = [];
  for (const value of values || []) {
    if (typeof value === "number") {
      if (Number.isFinite(value)) out.push(value);
      continue;
    }
    // numeric strings are still worth reading; null, undefined, booleans,
    // empty strings and objects are not numbers and must not become zeroes
    if (typeof value !== "string" || value.trim() === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) out.push(parsed);
  }
  return out;
}

/**
 * Frame a value range for a y-axis.
 *
 * @param {number[]} values      the numbers actually plotted
 * @param {object}   [options]
 * @param {string}   [options.unit]          used to decide whether zero is a floor
 * @param {boolean}  [options.allowNegative] overrides the unit's own rule
 * @param {boolean}  [options.includeZero]   force zero into the range (bar baselines)
 * @param {boolean}  [options.symmetric]     mirror around zero (anomalies)
 * @param {number}   [options.padRatio]      share of the span added at each end
 * @param {number}   [options.targetTicks]
 * @returns {{domain: [number, number], ticks: number[], decimals: number, step: number}}
 */
export function axisScale(values, options = {}) {
  const {
    unit,
    allowNegative,
    includeZero = false,
    symmetric = false,
    padRatio = 0.08,
    targetTicks = 5,
  } = options;

  const nums = finite(values);
  if (!nums.length) return { domain: [0, 1], ticks: [0, 1], decimals: 0, step: 1 };

  let min = Math.min(...nums);
  let max = Math.max(...nums);

  if (symmetric) {
    const reach = Math.max(Math.abs(min), Math.abs(max)) || 1;
    min = -reach;
    max = reach;
  } else if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  const span = max - min;
  // A flat series still needs a window to be drawn in.
  const pad = span > 0 ? span * padRatio : Math.max(Math.abs(max) * 0.05, 0.5);

  let low = min - pad;
  let high = max + pad;

  // Two separate questions, and conflating them was a mistake. Whether the
  // quantity *can* be negative is a property of the unit; whether this axis
  // *should* show negative space is a property of the data in front of it.
  // Monthly temperature climatology runs +1 °C to +23 °C — every value positive
  // — so padding it down to -5 puts the bars afloat above a baseline that means
  // nothing. The axis goes below zero only when the series does.
  const unitAllowsNegative = allowNegative ?? !isNonNegativeUnit(unit);
  const negativeAllowed = unitAllowsNegative && min < 0;
  if (!negativeAllowed && low < 0) low = 0;
  if (symmetric) {
    const reach = Math.max(Math.abs(low), Math.abs(high));
    low = -reach;
    high = reach;
  }

  // The axis keeps the range the data actually needs; the round ticks are laid
  // out *inside* it. Pushing both ends out to a whole step is what used to buy
  // round end labels at the price of empty plot — a seasonal temperature cycle
  // spanning -4 to 32 was framed -10 to 40, wasting a sixth of the height at
  // each end. An axis end without a tick label on it costs nothing to read.
  const paddedSpan = high - low;
  // Relative humidity has a ceiling as well as a floor: padding a series that
  // touches 100 % up to 125 % offers space the quantity cannot occupy.
  if (unit === "%" && max <= 100 && high > 100) high = 100;

  const ticksInside = (candidateStep) => {
    const first = Math.ceil(low / candidateStep - 1e-9);
    const last = Math.floor(high / candidateStep + 1e-9);
    return last - first + 1;
  };

  // Aim for about six labels: few enough to read, enough to measure against.
  const TARGET = 6;
  const candidates = [4, 5, 6, 8, 10].map((n) => niceStep(paddedSpan, n));
  const step = candidates.reduce((best, candidate) => {
    const bestCount = ticksInside(best);
    const count = ticksInside(candidate);
    if (count < 3) return best;
    if (bestCount < 3) return candidate;
    const delta = Math.abs(count - TARGET) - Math.abs(bestCount - TARGET);
    // on a tie prefer the denser axis: a tall plot carries the extra label
    return delta < 0 || (delta === 0 && count > bestCount) ? candidate : best;
  }, candidates[0]);

  const decimals = stepDecimals(step);
  const round = (value) => +value.toFixed(decimals + 2);

  const ticks = [];
  const firstIndex = Math.ceil(low / step - 1e-9);
  const lastIndex = Math.floor(high / step + 1e-9);
  // Floating-point drift accumulates over a loop of additions; index the step.
  for (let i = firstIndex; i <= lastIndex; i++) ticks.push(round(i * step));

  return { domain: [round(low), round(high)], ticks, decimals, step };
}

/**
 * Format a value for an axis whose ticks carry `decimals` places, with the
 * near-zero case spelled out: an anomaly mean of -0.004 printed as "-0" reads
 * as a negative zero, which is not a thing.
 */
export function formatForAxis(value, decimals) {
  if (value == null || !Number.isFinite(Number(value))) return "-";
  const n = Number(value);
  const rounded = +n.toFixed(decimals);
  if (rounded === 0 && n !== 0) return `≈0`;
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ---- compass bearings -----------------------------------------------------
// A direction is not a quantity on a line: 359° and 1° are two degrees apart,
// and their ordinary average — 180° — is the opposite bearing. The ETL already
// vector-averages direction; the chart layer did not, and a bar chart of
// monthly means made months averaging near north look like months with no wind
// at all.

export const COMPASS_TICKS = [0, 45, 90, 135, 180, 225, 270, 315, 360];

const COMPASS_NAMES = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];

/** "N", "NE", … for the eight cardinal ticks; the bearing itself otherwise. */
export function compassLabel(degrees) {
  const index = COMPASS_TICKS.indexOf(Number(degrees));
  if (index >= 0) return COMPASS_NAMES[index];
  return `${Math.round(Number(degrees))}°`;
}

/** Vector mean of a set of bearings, in degrees on [0, 360). */
export function circularMeanDeg(values) {
  const nums = finite(values);
  if (!nums.length) return null;
  let sin = 0;
  let cos = 0;
  for (const degrees of nums) {
    const radians = (degrees * Math.PI) / 180;
    sin += Math.sin(radians);
    cos += Math.cos(radians);
  }
  // Directions spread evenly around the circle cancel out: there is no
  // prevailing bearing to report, and 0° would be a fabricated one.
  if (Math.abs(sin) < 1e-9 && Math.abs(cos) < 1e-9) return null;
  const mean = (Math.atan2(sin / nums.length, cos / nums.length) * 180) / Math.PI;
  return +((mean + 360) % 360).toFixed(1);
}
