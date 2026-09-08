import test from "node:test";
import assert from "node:assert/strict";
import { linearTrend } from "./dailyTemperature.js";
import { calculateMonthlyTemperature } from "./monthlyTemperature.js";

const pad = (n) => String(n).padStart(2, "0");

// Deterministic non-periodic noise, so a fixture's scatter is scatter and not a
// pattern the fit can lock onto.
function wobble(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2;
}

// One reading a day is enough for a monthly mean; the month has to be observed
// end to end or the trend excludes it by design.
function hourlyRecords(years, valueFor) {
  const rows = [];
  for (const year of years) {
    for (let month = 1; month <= 12; month += 1) {
      const days = new Date(year, month, 0).getDate();
      for (let day = 1; day <= days; day += 1) {
        rows.push({ d: `${year}-${pad(month)}-${pad(day)}T12:00`, v: valueFor(year, month, day) });
      }
    }
  }
  return rows;
}

test("a slope buried in month-to-month noise is reported as inseparable from zero", () => {
  const points = Array.from({ length: 59 }, (_, index) => ({
    x: 2021 + index / 12,
    y: 0.2 * (index / 12) + 3 * wobble(index),
  }));

  const fit = linearTrend(points);
  assert.ok(fit.interval, "a fit on 59 points should carry an interval");
  assert.ok(fit.interval.low < 0 && fit.interval.high > 0, "the interval should straddle zero");
  assert.equal(fit.interval.separableFromZero, false);
  // and R2 alone would not have said this: it is small here, but it is small
  // for a separable slope too, which is why the interval is the one to read
  assert.ok(fit.r2 < 0.2);
});

test("a slope that clears the noise is reported as separable from zero", () => {
  const points = Array.from({ length: 59 }, (_, index) => ({
    x: 2021 + index / 12,
    y: 2 * (index / 12) + 0.5 * wobble(index),
  }));

  const fit = linearTrend(points);
  assert.equal(fit.interval.separableFromZero, true);
  assert.ok(fit.interval.low > 0, `interval ${fit.interval.low}–${fit.interval.high} should sit above zero`);
});

test("the interval is widened for month-to-month persistence", () => {
  // a random walk: each residual carries most of the previous one, so the
  // record holds far fewer independent observations than it has points
  let level = 0;
  const points = Array.from({ length: 59 }, (_, index) => {
    level = 0.9 * level + wobble(index);
    return { x: 2021 + index / 12, y: level };
  });

  const fit = linearTrend(points);
  assert.ok(fit.interval.lag1 > 0.3, `expected persistent residuals, got lag1 ${fit.interval.lag1}`);
  assert.ok(
    fit.interval.effectiveN < fit.interval.observations / 2,
    `${fit.interval.observations} months should not count as ${fit.interval.effectiveN} independent ones`
  );
});

test("a pure seasonal cycle with no warming produces no trend", () => {
  // January to July and back, identical every year. Regressing the raw means
  // would let the cycle correlate with time; the fit is on the departures from
  // each calendar month's own average, so there is nothing left to slope.
  const rows = hourlyRecords([2021, 2022, 2023, 2024, 2025], (year, month) => 10 + 12 * Math.cos(((month - 7) / 12) * 2 * Math.PI));

  const result = calculateMonthlyTemperature(rows);
  assert.equal(result.completeMonthCount, 60);
  assert.ok(Math.abs(result.trend.slopePerYear) < 1e-6, `slope ${result.trend.slopePerYear} should be flat`);
});

test("a real warming under a seasonal cycle is recovered at its true rate", () => {
  const rows = hourlyRecords([2021, 2022, 2023, 2024, 2025], (year, month) =>
    10 + 12 * Math.cos(((month - 7) / 12) * 2 * Math.PI) + 0.5 * (year - 2021)
  );

  const result = calculateMonthlyTemperature(rows);
  assert.ok(
    Math.abs(result.trend.slopePerYear - 0.5) < 0.02,
    `slope ${result.trend.slopePerYear} should recover the 0.5 °C/year built into the fixture`
  );
  assert.equal(result.trend.interval.separableFromZero, true);
});
