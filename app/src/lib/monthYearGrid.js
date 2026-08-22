// Rrezatimi 4: a month x year grid of monthly means.
//
// Months the record never reached stay empty rather than being drawn as zero —
// a missing month and a dark month are very different statements.
import { mean } from "./dailyTemperature.js";

// Below this, a cell is a sample of whichever days the sensor was running
// rather than a monthly mean.
export const MIN_DAYS_PER_CELL = 10;

function parseValue(value) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyResult() {
  return { years: [], cells: new Map(), min: null, max: null, hottest: null, coldest: null, filledCells: 0, skippedCells: 0 };
}

export function calculateMonthYearGrid(dailyRecords) {
  if (!Array.isArray(dailyRecords)) return emptyResult();

  const rows = dailyRecords
    .map((row) => ({ date: String(row?.d ?? ""), value: parseValue(row?.v) }))
    .filter((row) => /^\d{4}-\d{2}-\d{2}/.test(row.date) && row.value != null);
  if (!rows.length) return emptyResult();

  const buckets = new Map();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    buckets.set(key, [...(buckets.get(key) ?? []), row.value]);
  }

  const cells = new Map();
  let skippedCells = 0;
  for (const [key, values] of buckets) {
    if (values.length < MIN_DAYS_PER_CELL) {
      skippedCells += 1;
      continue;
    }
    cells.set(key, {
      key,
      year: Number(key.slice(0, 4)),
      monthNumber: Number(key.slice(5, 7)),
      value: +mean(values).toFixed(1),
      observedDays: values.length,
    });
  }
  if (!cells.size) return { ...emptyResult(), skippedCells };

  const list = [...cells.values()];
  const years = [...new Set(list.map((cell) => cell.year))].sort((a, b) => a - b);
  const values = list.map((cell) => cell.value);

  return {
    years,
    cells,
    min: Math.min(...values),
    max: Math.max(...values),
    hottest: list.reduce((best, cell) => (cell.value > best.value ? cell : best), list[0]),
    coldest: list.reduce((best, cell) => (cell.value < best.value ? cell : best), list[0]),
    filledCells: cells.size,
    skippedCells,
  };
}

// Yellow -> orange -> red -> dark red, interpolated so close values stay
// distinguishable instead of collapsing into a handful of bands.
const RAMP = ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"];

function hexToRgb(hex) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

export function rampColor(fraction) {
  if (!Number.isFinite(fraction)) return "#f1f5f9";
  const clamped = Math.max(0, Math.min(1, fraction));
  const scaled = clamped * (RAMP.length - 1);
  const index = Math.min(RAMP.length - 2, Math.floor(scaled));
  const weight = scaled - index;
  const from = hexToRgb(RAMP[index]);
  const to = hexToRgb(RAMP[index + 1]);
  const mix = from.map((channel, i) => Math.round(channel + (to[i] - channel) * weight));
  return `rgb(${mix.join(", ")})`;
}

// White text once the cell is dark enough that black stops being legible.
export function readableTextColor(fraction) {
  return Number.isFinite(fraction) && fraction > 0.72 ? "#ffffff" : "#3f2a12";
}
