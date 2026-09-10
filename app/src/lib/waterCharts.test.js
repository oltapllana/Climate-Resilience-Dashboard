import test from "node:test";
import assert from "node:assert/strict";
import { calculateDurationCurve } from "./durationCurve.js";
import { calculateFloodFrequency } from "./floodFrequency.js";
import { calculateExceedanceDays } from "./exceedanceDays.js";
import { calculateAnnualTrend } from "./annualTrend.js";
import { calculateSeasonalBand } from "./seasonalBand.js";
import { calculateThresholdHydrograph } from "./thresholdHydrograph.js";
import { calculateDilutionEvent } from "./dilutionEvent.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

// A full calendar year of daily rows, so partial-year detection has something
// complete to contrast against.
function fullYear(year, valueFor) {
  const rows = [];
  for (let month = 1; month <= 12; month += 1) {
    const days = new Date(year, month, 0).getDate();
    for (let day = 1; day <= days; day += 1) {
      const d = `${year}-${pad(month)}-${pad(day)}`;
      const v = valueFor(month, day, year);
      rows.push({ d, v, lo: v - 1, hi: v + 1 });
    }
  }
  return rows;
}

// Deterministic pseudo-random noise. A repeating pattern will not do here: one
// whose period matches the percentile window puts an identical multiset of
// values in every window, and then a flat percentile curve is the data's doing
// rather than the smoother's.
function wobble(year, month, day) {
  const x = Math.sin(year * 10000 + month * 100 + day) * 10000;
  return (x - Math.floor(x) - 0.5) * 6;
}

test("duration curve splits the record into an early and a recent window", () => {
  const rows = [2021, 2022, 2023, 2024].flatMap((year) => fullYear(year, () => year - 2020));
  const result = calculateDurationCurve(rows);

  assert.equal(result.periods.length, 2);
  assert.equal(result.periods[0].label, "2021–2022");
  assert.equal(result.periods[1].label, "2023–2024");
  // constant value per year, so the early window never exceeds 2 and the
  // recent one never drops below 3
  assert.ok(result.grid.every((row) => row.early <= 2 && row.recent >= 3));
});

test("duration curve markers read off the whole record, not one period", () => {
  // 100 consecutive days holding the values 1..100 — the value exceeded 10 %
  // of the time is near 90
  const rows = Array.from({ length: 100 }, (_, index) => ({
    d: new Date(Date.UTC(2022, 0, 1 + index)).toISOString().slice(0, 10),
    v: index + 1,
  }));
  const result = calculateDurationCurve(rows, { markers: [10, 90] });

  const [high, low] = result.markers;
  assert.equal(high.percent, 10);
  assert.ok(high.value > 88 && high.value < 92, `unexpected 10 % value ${high.value}`);
  assert.ok(low.value > 8 && low.value < 12, `unexpected 90 % value ${low.value}`);
});

test("flood frequency ranks annual maxima by the daily maximum, not the mean", () => {
  const rows = [2021, 2022, 2023, 2024, 2025].flatMap((year) =>
    fullYear(year, (month, day) => (month === 3 && day === 11 ? 10 + (year - 2021) : 1)),
  );
  const result = calculateFloodFrequency(rows);

  assert.equal(result.years, 5);
  assert.equal(result.completeYears, 5);
  // hi = v + 1 in the fixture, so the annual maximum is the peak day's band top
  assert.deepEqual(result.points.map((point) => point.value), [11, 12, 13, 14, 15]);
  // Gringorten: the largest of five sits at (5 - 0.44) / 5.12
  const largest = result.points.at(-1);
  assert.ok(Math.abs(largest.probability - (5 - 0.44) / 5.12) < 1e-12);
  assert.ok(Math.abs(largest.returnPeriod - 1 / (1 - (5 - 0.44) / 5.12)) < 1e-9);
});

test("flood frequency caps extrapolation at three times the record length", () => {
  const rows = [2021, 2022, 2023, 2024].flatMap((year) => fullYear(year, () => year - 2020));
  const result = calculateFloodFrequency(rows);

  assert.equal(result.maxReturnPeriod, 12);
  assert.ok(result.curve.at(-1).returnPeriod <= 12.001);
  // the confidence band never narrows to nothing away from the fitted centre
  assert.ok(result.curve.every((row) => row.band >= 0));
});

test("flood frequency flags a year the record does not cover end to end", () => {
  const complete = [2021, 2022, 2023].flatMap((year) => fullYear(year, (month) => month));
  const stub = [
    { d: "2024-01-01", v: 1, hi: 9 },
    { d: "2024-02-01", v: 1, hi: 9 },
  ];
  const result = calculateFloodFrequency([...complete, ...stub]);

  const partial = result.points.filter((point) => point.partial).map((point) => point.year);
  assert.deepEqual(partial, [2024]);
  assert.equal(result.completeYears, 3);
  // a flagged year is still plotted and still fits the curve
  assert.equal(result.points.length, 4);
});

test("exceedance days report a share of monitored days, not a raw count", () => {
  // 2021 fully observed, 2022 observed for 100 days — both spend a fifth of
  // their observed days above the threshold
  const rows = [];
  const push = (year, count) => {
    for (let index = 0; index < count; index += 1) {
      rows.push({
        d: new Date(Date.UTC(year, 0, 1 + index)).toISOString().slice(0, 10),
        v: index % 5 === 0 ? 100 : 1,
      });
    }
  };
  push(2021, 365);
  push(2022, 100);

  const result = calculateExceedanceDays(rows);
  const [first, second] = result.years;
  assert.equal(first.monitoredDays, 365);
  assert.equal(second.monitoredDays, 100);
  assert.ok(Math.abs(first.share - second.share) < 1.5, "shares should be comparable across unequal coverage");
  assert.equal(second.partial, true);
});

test("annual trend fits only the fully observed years", () => {
  const complete = [2021, 2022, 2023].flatMap((year) => fullYear(year, () => (year - 2021) * 2));
  // a stub January-only year whose mean is wildly off; it must not tilt the fit
  const stub = Array.from({ length: 20 }, (_, index) => ({
    d: new Date(Date.UTC(2024, 0, 1 + index)).toISOString().slice(0, 10),
    v: 500,
  }));

  const result = calculateAnnualTrend([...complete, ...stub]);
  assert.equal(result.completeYears, 3);
  assert.equal(result.years.at(-1).partial, true);
  assert.ok(Math.abs(result.trend.slope - 2) < 1e-9, `slope ${result.trend.slope} should follow the complete years`);
});

test("seasonal band keeps the latest year out of its own reference bands", () => {
  const rows = [2021, 2022, 2023, 2024].flatMap((year) => fullYear(year, () => (year === 2024 ? 50 : 10)));
  const result = calculateSeasonalBand(rows);

  assert.equal(result.currentYear, 2024);
  assert.deepEqual(result.historicalYears, [2021, 2022, 2023]);
  const midYear = result.days.find((day) => day.slot === 100);
  assert.equal(midYear.p50, 10);
  assert.equal(midYear.p90, 10);
  assert.equal(midYear.current, 50);
});

test("seasonal band pools a centred window so the quartiles sit inside the 10-90 band", () => {
  // one value per year per day would make the 10th and 90th percentile the
  // minimum and the maximum of three numbers, and the two bands identical
  const rows = [2021, 2022, 2023, 2024].flatMap((year) =>
    fullYear(year, (month, day) => 10 + wobble(year, month, day))
  );

  const result = calculateSeasonalBand(rows);
  assert.equal(result.windowDays, 15);
  const midYear = result.days.find((day) => day.slot === 100);
  assert.equal(midYear.samples, 45, "15-day window over 3 reference years");
  assert.ok(midYear.p10 < midYear.p25, "the outer band has to be visibly wider than the inner one");
  assert.ok(midYear.p75 < midYear.p90);
  assert.ok(midYear.p25 < midYear.p50 && midYear.p50 < midYear.p75);
});

test("seasonal band smooths the percentile staircase without letting the bands cross", () => {
  const rows = [2021, 2022, 2023, 2024].flatMap((year) =>
    fullYear(year, (month, day) => 10 + wobble(year, month, day))
  );

  const result = calculateSeasonalBand(rows);
  assert.equal(result.smoothingDays, 11);
  for (const day of result.days) {
    assert.ok(
      day.p10 <= day.p25 && day.p25 <= day.p50 && day.p50 <= day.p75 && day.p75 <= day.p90,
      `percentiles out of order on slot ${day.slot}`
    );
  }
  // a raw order statistic holds flat for days at a time; the smoothed curve
  // should almost never repeat the previous day's value exactly
  const repeats = result.days.filter((day, index) => index > 0 && day.p90 === result.days[index - 1].p90);
  assert.ok(repeats.length < result.days.length * 0.05, `${repeats.length} flat steps left in the 90th percentile`);
});

test("seasonal band width does not inflate where the seasonal cycle is steep", () => {
  // The same noise on a flat series and on one climbing 0.1 units a day. A
  // 15-day window on the ramp carries ~1.4 units of pure seasonal rise, and
  // ranking the window undetrended lets that rise into the band: measured
  // without the detrending step the width at day 100 goes from 0.49 to 1.19,
  // more than doubling on identical spread. The noise is scaled down on
  // purpose — at full amplitude it swamps the artefact and the test stops
  // testing anything.
  const build = (ramp) =>
    [2021, 2022, 2023, 2024].flatMap((year) =>
      fullYear(year, (month, day) => {
        const slot = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86400000) + 1;
        return 10 + ramp * slot + wobble(year, month, day) * 0.1;
      })
    );

  const widthAt = (rows, slot) => {
    const day = calculateSeasonalBand(rows).days.find((entry) => entry.slot === slot);
    return day.p90 - day.p10;
  };

  const flat = widthAt(build(0), 100);
  const steep = widthAt(build(0.1), 100);
  assert.ok(flat > 0.4, `the flat case needs a band to compare against, got ${flat.toFixed(3)}`);
  assert.ok(
    Math.abs(steep - flat) < 0.05,
    `the ramp changed the band width by ${(steep - flat).toFixed(3)} on identical spread`
  );
});

test("seasonal band does not collapse to a hairline on a thin window", () => {
  // a reference year recorded only every tenth day leaves windows holding two
  // values. A straight line through two points fits them exactly: every
  // residual is zero and the correction for the two spent degrees of freedom
  // divides by zero, so detrending such a window yields a band of no width, or
  // of no number at all. Below the threshold the window is ranked as it is.
  const sparse = [];
  for (const year of [2023, 2024]) {
    for (let slot = 1; slot <= 360; slot += 10) {
      const date = new Date(Date.UTC(year, 0, slot));
      const key = `${year}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
      sparse.push({ d: key, v: 10 + wobble(year, date.getUTCMonth() + 1, date.getUTCDate()) });
    }
  }

  const result = calculateSeasonalBand(sparse);
  const thin = result.days.filter((entry) => entry.samples === 2);
  assert.ok(thin.length > 0, "the fixture needs windows holding exactly two values");
  for (const day of thin) {
    assert.ok(Number.isFinite(day.p10) && Number.isFinite(day.p90), `slot ${day.slot} produced ${day.p10}`);
  }
  assert.ok(
    thin.some((day) => day.p90 - day.p10 > 0.2),
    "every thin window drew a hairline band"
  );
});

test("seasonal band reports how many reference years actually back a typical day", () => {
  // the label spans 2022-2023, but 2022 only starts in October, so most of the
  // calendar rests on 2023 alone
  const rows = [
    ...fullYear(2023, (month, day) => 10 + wobble(2023, month, day)),
    ...fullYear(2024, (month, day) => 10 + wobble(2024, month, day)),
  ];
  for (let day = 1; day <= 31; day += 1) {
    rows.push({ d: `2022-10-${pad(day)}`, v: 10 + wobble(2022, 10, day) });
  }

  const result = calculateSeasonalBand(rows);
  assert.deepEqual(result.historicalYears, [2022, 2023]);
  assert.equal(result.medianYearDepth, 1, "a typical day is backed by 2023 alone");
  // mid-October is the one stretch both reference years cover
  assert.equal(result.days.find((entry) => entry.slot === 289).referenceYears, 2);
});

test("seasonal band wraps its window across the turn of the year", () => {
  const rows = [2021, 2022, 2023, 2024].flatMap((year) => fullYear(year, () => 5));
  const result = calculateSeasonalBand(rows);
  // 1 January reaches back into the previous week of December rather than
  // resting on half a window. 14 of the 15 slots carry values — day 366 is
  // absent because none of the three reference years is a leap year — so the
  // count lands on 42 rather than the 24 a truncated window would give.
  assert.equal(result.days.find((day) => day.slot === 1).samples, 42);
  assert.equal(result.days.find((day) => day.slot === 365).samples, 42);
});

test("threshold hydrograph windows the record around its peak", () => {
  const rows = Array.from({ length: 60 }, (_, index) => ({
    d: new Date(Date.UTC(2023, 2, 1 + index)).toISOString().slice(0, 10),
    v: index === 30 ? 100 : 1,
  }));
  const result = calculateThresholdHydrograph(rows, { windowDays: 5, mode: "percentile", stops: [99, 99.9] });

  assert.equal(result.peak.value, 100);
  // ±5 days inclusive of the peak day
  assert.equal(result.series.length, 11);
  assert.equal(result.boundaries.at(-1), 100);
  assert.ok(result.boundaries.every((value, index) => index === 0 || value > result.boundaries[index - 1]));
});

test("threshold hydrograph drops band edges that would draw at zero height", () => {
  const rows = Array.from({ length: 30 }, (_, index) => ({
    d: new Date(Date.UTC(2023, 2, 1 + index)).toISOString().slice(0, 10),
    v: 5,
  }));
  const result = calculateThresholdHydrograph(rows, { mode: "percentile", stops: [99, 99.9] });
  assert.deepEqual(result.boundaries, [5]);
});

test("dilution event picks its window from the level series", () => {
  const hours = (day, hour) => `2023-03-${pad(day)}T${pad(hour)}:00`;
  const level = [];
  const quality = [];
  for (let day = 1; day <= 20; day += 1) {
    for (let hour = 0; hour < 24; hour += 6) {
      level.push({ d: hours(day, hour), v: day === 11 && hour === 12 ? 2 : 0.3 });
      quality.push({ d: hours(day, hour), v: day === 11 && hour === 12 ? 0.1 : 0.9 });
    }
  }

  const result = calculateDilutionEvent(quality, level, { windowDays: 2 });
  assert.equal(result.peak.value, 2);
  assert.equal(result.minimum.value, 0.1);
  assert.equal(result.minimum.key, result.peak.key, "the dilution minimum should sit at the flood peak");
  assert.ok(result.series.length < quality.length, "the series should be windowed, not whole");
});
