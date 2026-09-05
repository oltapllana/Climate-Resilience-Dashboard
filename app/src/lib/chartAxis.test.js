import test from "node:test";
import assert from "node:assert/strict";
import { axisScale, circularMeanDeg, compassLabel, formatForAxis, niceStep, stepDecimals } from "./chartAxis.js";

test("frames a series that lives far from zero instead of starting at zero", () => {
  // station pressure: the review's own recommendation was 900–960 hPa
  const { domain } = axisScale([906.8, 934.2, 955.1], { unit: "hPa" });
  assert.equal(domain[0], 900);
  assert.equal(domain[1], 960);
});

test("keeps the floor at zero for a quantity that cannot be negative", () => {
  // monthly rainfall means with a wide between-year deviation used to reach -100 mm
  const { domain } = axisScale([20, 171.6, 5], { unit: "mm", includeZero: true });
  assert.equal(domain[0], 0);
});

test("allows negative space for temperature", () => {
  const { domain } = axisScale([-1.8, 30.1], { unit: "°C" });
  assert.ok(domain[0] < 0, `expected a negative floor, got ${domain[0]}`);
});

test("mirrors an anomaly axis around zero", () => {
  const { domain } = axisScale([-8, 5], { unit: "hPa", symmetric: true, allowNegative: true });
  assert.equal(domain[0], -domain[1]);
  assert.ok(domain[1] >= 8);
});

test("never emits two ticks that print the same text", () => {
  // the TDS axis showed 0.4 twice
  const { ticks, decimals } = axisScale([0.2, 0.49], { unit: "g/l" });
  const printed = ticks.map((tick) => formatForAxis(tick, decimals));
  assert.equal(new Set(printed).size, printed.length, `duplicate labels in ${printed.join(", ")}`);
});

test("ticks stay inside the domain and are evenly spaced", () => {
  const { domain, ticks, step } = axisScale([11.4, 47.9, 23.2], { unit: "mm" });
  assert.equal(ticks[0], domain[0]);
  assert.equal(ticks[ticks.length - 1], domain[1]);
  for (let i = 1; i < ticks.length; i++) {
    assert.ok(Math.abs(ticks[i] - ticks[i - 1] - step) < 1e-9);
  }
});

test("a flat series still gets a drawable window", () => {
  const { domain } = axisScale([5, 5, 5], { unit: "m/s" });
  assert.ok(domain[1] > domain[0]);
});

test("an empty series does not throw", () => {
  const { domain, ticks } = axisScale([null, undefined, NaN], { unit: "mm" });
  assert.equal(domain.length, 2);
  assert.ok(ticks.length >= 2);
});

test("prints a rounded-to-zero value as an approximation, not as negative zero", () => {
  // "Mean: -0 m" in the water-level anomalies panel
  assert.equal(formatForAxis(-0.004, 2), "≈0");
  assert.equal(formatForAxis(0, 2), "0.00");
});

test("niceStep and stepDecimals agree on precision", () => {
  assert.equal(stepDecimals(niceStep(0.5)), 1);
  assert.equal(stepDecimals(niceStep(500)), 0);
});

test("averages bearings as vectors, not as numbers on a line", () => {
  // the ordinary average of 1 and 359 is 180 — the opposite bearing
  assert.ok(Math.abs(circularMeanDeg([1, 359]) - 0) < 0.5 || Math.abs(circularMeanDeg([1, 359]) - 360) < 0.5);
  assert.ok(Math.abs(circularMeanDeg([80, 100]) - 90) < 0.5);
});

test("reports no prevailing bearing when directions cancel out", () => {
  assert.equal(circularMeanDeg([0, 90, 180, 270]), null);
});

test("names the cardinal ticks and keeps 0 and 360 both north", () => {
  assert.equal(compassLabel(0), "N");
  assert.equal(compassLabel(360), "N");
  assert.equal(compassLabel(90), "E");
});

test("does not pad a percentage above its own ceiling", () => {
  const { domain } = axisScale([10, 100, 70.5], { unit: "%" });
  assert.equal(domain[1], 100);
});

test("keeps tick labels legible in number as well as precision", () => {
  // a step of 2.5 is bigger than 1 but still needs a decimal place
  assert.equal(stepDecimals(2.5), 1);
  const { ticks } = axisScale([928, 931, 934, 936], { unit: "hPa" });
  assert.ok(ticks.length <= 9, `too many ticks: ${ticks.length}`);
});

test("drops gaps instead of reading them as zero", () => {
  // Number(null) is 0 and Number.isFinite(0) is true: a rolling mean that is
  // null until its window fills used to pull a pressure axis down to zero.
  const { domain } = axisScale([null, null, 931, 934, 936, undefined, 933], { unit: "hPa" });
  assert.ok(domain[0] > 900, `gaps were counted as zero: floor is ${domain[0]}`);
});

test("ignores non-numeric values rather than coercing them", () => {
  const { domain } = axisScale([true, "", [], {}, 20, 24], { unit: "°C" });
  assert.ok(domain[0] > 0, `coerced a non-number to zero: floor is ${domain[0]}`);
});

test("still reads numeric strings", () => {
  const { domain } = axisScale(["931", "955"], { unit: "hPa" });
  assert.ok(domain[0] >= 900 && domain[1] <= 970);
});
