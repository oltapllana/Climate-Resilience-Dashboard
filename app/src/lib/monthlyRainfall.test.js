import test from "node:test";
import assert from "node:assert/strict";
import { quantile, whiskerSpread } from "./monthlyRainfall.js";
import { axisScale } from "./chartAxis.js";

// Shajkoc, complete calendar months only: [mean, yearly totals]. These are the
// months the review called out for whiskers that towered over the bars.
const MONTHS = [
  { name: "Jan", mean: 65.2, totals: [10, 102, 24, 15, 175] },
  { name: "Feb", mean: 23.7, totals: [18, 41, 1, 10, 49] },
  { name: "Mar", mean: 73.2, totals: [29, 121, 101, 83, 33] },
  { name: "Apr", mean: 110.7, totals: [118, 179, 71, 75] },
  { name: "May", mean: 171.6, totals: [73, 89, 240, 340, 116] },
  { name: "Jun", mean: 138.0, totals: [136, 194, 244, 96, 19] },
  { name: "Jul", mean: 141.6, totals: [164, 154, 164, 137, 89] },
  { name: "Aug", mean: 87.3, totals: [33, 161, 95, 57, 91] },
  { name: "Sep", mean: 130.9, totals: [37, 301, 25, 175, 116] },
  { name: "Oct", mean: 74.0, totals: [96, 24, 35, 53, 162] },
  { name: "Nov", mean: 145.4, totals: [69, 160, 197, 104, 197] },
  { name: "Dec", mean: 62.5, totals: [112, 98, 60, 33, 10] },
];

const quartiles = (totals) => [quantile(totals, 0.25), quantile(totals, 0.75)];

/** Where the whisker's two ends land on the axis. */
function ends({ mean, totals }) {
  const [q1, q3] = quartiles(totals);
  const [down, up] = whiskerSpread(mean, q1, q3);
  return [mean - down, mean + up];
}

test("interpolates quantiles between the observed years", () => {
  assert.equal(quantile([10, 20, 30, 40, 50], 0.5), 30);
  assert.equal(quantile([0, 100], 0.25), 25);
  assert.equal(quantile([], 0.5), null);
});

test("no whisker reaches a negative depth of rain", () => {
  // the reviewer's first point: an axis running to -100 mm on a quantity that
  // cannot be negative. Quartiles come off recorded totals, so this holds by
  // construction rather than by clamping.
  for (const month of MONTHS) {
    const [low] = ends(month);
    assert.ok(low >= 0, `${month.name} reaches ${low}`);
  }
});

test("keeps the axis floor at zero", () => {
  const points = MONTHS.flatMap((month) => [month.mean, ...quartiles(month.totals)]);
  assert.equal(axisScale(points, { unit: "mm", includeZero: true }).domain[0], 0);
});

test("leaves the bars the greater part of the plot", () => {
  // the reviewer's second point. One standard deviation either side of the mean
  // needed an axis to 286 mm against a tallest bar of 172 — the bars held 60%
  // of the height and the whiskers towered over them.
  const tallestBar = Math.max(...MONTHS.map((month) => month.mean));
  const tallestWhisker = Math.max(...MONTHS.map((month) => ends(month)[1]));
  assert.ok(tallestWhisker < 260, `whiskers still reach ${tallestWhisker} mm`);
  assert.ok(
    tallestBar / tallestWhisker > 0.7,
    `bars hold only ${Math.round((tallestBar / tallestWhisker) * 100)}% of the plot height`,
  );
});

test("a single wet year no longer stretches the whisker", () => {
  // September ran 25, 37, 116, 175, 301 mm. The 301 used to pull one standard
  // deviation out to 244 mm; it now sits outside the whisker, where the
  // tooltip's full range reports it.
  const september = MONTHS.find((month) => month.name === "Sep");
  const [, high] = ends(september);
  assert.ok(high < 200, `September still reaches ${high} mm`);
  assert.ok(Math.max(...september.totals) > high, "the wettest year should fall outside the whisker");
});

test("an arm is a length, never a negative one", () => {
  // a long right tail can drag the mean past the upper quartile
  const [down, up] = whiskerSpread(300, 10, 50);
  assert.ok(down >= 0 && up >= 0, `arms ${down}, ${up}`);
  assert.equal(up, 0);
});

test("rejects input it cannot draw", () => {
  assert.equal(whiskerSpread(null, 1, 2), null);
  assert.equal(whiskerSpread(10, null, 2), null);
  assert.equal(whiskerSpread(10, 1, null), null);
});
