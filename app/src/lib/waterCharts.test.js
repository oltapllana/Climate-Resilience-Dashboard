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
