import test from "node:test";
import assert from "node:assert/strict";
import { calculateDailyTrend } from "./dailyTrend.js";

const DAY_MS = 86400000;

/** A daily series starting at `from`, one record per day, values from `shape`. */
function series(from, values, { skip = new Set() } = {}) {
  const start = Date.parse(`${from}T00:00:00Z`);
  return values
    .map((v, i) => ({ d: new Date(start + i * DAY_MS).toISOString().slice(0, 10), v }))
    .filter((row, i) => !skip.has(i));
}

/** Flat baseline, then a sustained dip, then back to baseline. */
function baselineWithDip({ before = 120, dip = 70, after = 120, level = 934, low = 924 } = {}) {
  return [
    ...Array.from({ length: before }, (_, i) => level + (i % 2 ? 0.4 : -0.4)),
    ...Array.from({ length: dip }, (_, i) => low + (i % 2 ? 0.4 : -0.4)),
    ...Array.from({ length: after }, (_, i) => level + (i % 2 ? 0.4 : -0.4)),
  ];
}

test("rolling mean waits for a full window rather than drawing a partial one", () => {
  const { daily } = calculateDailyTrend(series("2021-04-06", Array.from({ length: 40 }, () => 930)));
  assert.equal(daily.slice(0, 29).every((row) => row.rolling === null), true);
  assert.equal(daily[29].rolling, 930);
});

test("names the sustained excursion away from the long-term mean", () => {
  const { departure, longTermMean } = calculateDailyTrend(series("2021-04-06", baselineWithDip()));
  assert.ok(departure, "a 70-day dip well clear of the baseline should be reported");
  assert.equal(departure.direction, "below");
  assert.ok(departure.mean < longTermMean, `${departure.mean} is not below ${longTermMean}`);
  assert.ok(departure.delta < 0, `delta ${departure.delta} should be negative for a dip`);
  // the run has to land on the dip, not on some stretch of the flat baseline
  assert.ok(departure.start >= "2021-07-01", `run starts at ${departure.start}, before the dip`);
  assert.ok(departure.end <= "2021-11-30", `run ends at ${departure.end}, past the dip`);
});

test("reports full coverage when every day of the excursion was observed", () => {
  const { departure } = calculateDailyTrend(series("2021-04-06", baselineWithDip()));
  assert.equal(departure.complete, true);
  assert.equal(departure.observedDays, departure.spanDays);
});

test("flags an excursion whose days are missing, so a gap is not read as weather", () => {
  // drop two thirds of the dip: the same visual swing, but mostly absent data
  const skip = new Set(Array.from({ length: 70 }, (_, i) => 120 + i).filter((i) => i % 3 !== 0));
  const { departure } = calculateDailyTrend(series("2021-04-06", baselineWithDip(), { skip }));
  if (departure) {
    assert.equal(departure.complete, false);
    assert.ok(departure.observedDays < departure.spanDays);
  }
});

test("stays quiet on a series that only wobbles around its mean", () => {
  const flat = Array.from({ length: 400 }, (_, i) => 934 + Math.sin(i / 3) * 0.5);
  assert.equal(calculateDailyTrend(series("2021-04-06", flat)).departure, null);
});

test("handles a record too short to have a rolling mean at all", () => {
  const result = calculateDailyTrend(series("2021-04-06", Array.from({ length: 10 }, () => 930)));
  assert.equal(result.departure, null);
  assert.equal(result.daily.length, 10);
});

test("survives empty and malformed input", () => {
  assert.equal(calculateDailyTrend(null).departure, null);
  assert.equal(calculateDailyTrend([]).departure, null);
  assert.equal(calculateDailyTrend([{ d: "", v: "x" }]).departure, null);
});
