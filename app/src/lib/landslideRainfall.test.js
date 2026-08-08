import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLandslideRainfallIndicator,
  landslideThreshold,
  reconstructHourlyRainfall,
  selectRainIntensityHourly,
} from "./landslideRainfall.js";

const hourlyRecord = (hours, value, year = 2024) => ({
  d: new Date(year, 0, 1, hours).toISOString(),
  v: value,
});

test("uses stored intensity directly without a ×60 conversion", () => {
  const rows = reconstructHourlyRainfall([hourlyRecord(0, 2)]);
  assert.equal(rows[0].intensityMmPerHour, 2);
  assert.equal(rows[0].depthMm, 2);
});

test("keeps a stored 5.818 value as 5.818 mm/h", () => {
  const rows = reconstructHourlyRainfall([hourlyRecord(0, 5.818)]);
  assert.equal(rows[0].intensityMmPerHour, 5.818);
});

test("fills missing clock hours with zero", () => {
  const rows = reconstructHourlyRainfall([
    hourlyRecord(0, 1),
    hourlyRecord(2, 3),
  ]);
  assert.deepEqual(rows.map((row) => row.depthMm), [1, 0, 3]);
  assert.equal(rows[1].filled, true);
});

test("calculates the correct 24-hour rolling mean", () => {
  const records = Array.from({ length: 24 }, (_, hour) => hourlyRecord(hour, 2));
  const result = calculateLandslideRainfallIndicator(records);
  assert.equal(result.yearly[0].values[0].maximum, 2);
});

test("calculates the correct 48-hour rolling mean", () => {
  const records = Array.from({ length: 48 }, (_, hour) =>
    hourlyRecord(hour, hour < 24 ? 1 : 3)
  );
  const result = calculateLandslideRainfallIndicator(records);
  assert.equal(result.yearly[0].values[1].maximum, 2);
});

test("calculates annual maxima separately by year and duration", () => {
  const records = [
    ...Array.from({ length: 48 }, (_, hour) => hourlyRecord(hour, 2, 2023)),
    ...Array.from({ length: 48 }, (_, hour) => hourlyRecord(hour, 4, 2024)),
  ];
  const result = calculateLandslideRainfallIndicator(records);
  const y2023 = result.yearly.find((row) => row.year === 2023);
  const y2024 = result.yearly.find((row) => row.year === 2024);
  assert.equal(y2023.values[0].maximum, 2);
  assert.equal(y2024.values[0].maximum, 4);
  assert.equal(y2023.values[1].maximum, 2);
  assert.equal(y2024.values[1].maximum, 4);
});

test("counts a calendar day once when several durations or hours exceed", () => {
  const records = Array.from({ length: 5 * 24 }, (_, hour) => hourlyRecord(hour, 20));
  const result = calculateLandslideRainfallIndicator(records);
  assert.equal(result.criticalDays.length, 5);
  assert.equal(result.yearly[0].criticalDays, 5);
});

test("selects rain_intensity and never rainfall as the source", () => {
  const intensity = [{ d: "2024-01-01T00:00", v: 5 }];
  const rainfall = [{ d: "2024-01-01T00:00", v: 999 }];
  assert.equal(
    selectRainIntensityHourly({
      measurements: {
        rain_intensity: { hourly: intensity },
        rainfall: { hourly: rainfall },
      },
    }),
    intensity
  );
  assert.deepEqual(
    selectRainIntensityHourly({ measurements: { rainfall: { hourly: rainfall } } }),
    []
  );
});

test("keeps the documented threshold equation unchanged", () => {
  [1, 2, 3, 4, 5].forEach((duration) => {
    assert.ok(Math.abs(landslideThreshold(duration) - 8.76 * duration ** -0.61) < 1e-12);
  });
});

test("handles invalid and empty hourly datasets safely", () => {
  assert.deepEqual(calculateLandslideRainfallIndicator([]).yearly, []);
  assert.deepEqual(
    calculateLandslideRainfallIndicator([{ d: "invalid", v: "bad" }]).yearly,
    []
  );
});
