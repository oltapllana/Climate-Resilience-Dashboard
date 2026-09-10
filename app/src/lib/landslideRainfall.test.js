import test from "node:test";
import assert from "node:assert/strict";
import {
  LANDSLIDE_DURATIONS_DAYS,
  LANDSLIDE_THRESHOLD_VALID_HOURS,
  calculateLandslideRainfallIndicator,
  landslideThreshold,
  MAX_PLAUSIBLE_DAILY_RAINFALL_MM,
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
  const records = Array.from({ length: 5 * 24 }, (_, hour) => hourlyRecord(hour, 3));
  const result = calculateLandslideRainfallIndicator(records);
  assert.equal(result.criticalDays.length, 5);
  assert.equal(result.yearly[0].criticalDays, 5);
  assert.equal(result.thresholdAudit.triggered, true);
  assert.equal(result.thresholdAudit.yearsTriggered, 1);
  assert.ok(result.thresholdAudit.closestRatio > 1);
});

test("audits a threshold that never triggers instead of silently accepting it", () => {
  const records = Array.from({ length: 5 * 24 }, (_, hour) => hourlyRecord(hour, 0.1));
  const result = calculateLandslideRainfallIndicator(records);
  assert.equal(result.thresholdAudit.triggered, false);
  assert.equal(result.thresholdAudit.criticalDays, 0);
  assert.equal(result.thresholdAudit.yearsTriggered, 0);
  assert.ok(result.thresholdAudit.closestRatio > 0);
  assert.ok(result.thresholdAudit.closestRatio < 1);
});

test("marks the first and last incomplete calendar years with exact coverage", () => {
  const records = Array.from({ length: 48 }, (_, hour) => ({
    d: new Date(2026, 3, 10, hour).toISOString(),
    v: 0,
  }));
  const result = calculateLandslideRainfallIndicator(records);
  assert.equal(result.yearly[0].year, 2026);
  assert.equal(result.yearly[0].availableStart, "2026-04-10");
  assert.equal(result.yearly[0].availableEnd, "2026-04-11");
  assert.equal(result.yearly[0].isPartial, true);
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

test("matches the published CADSES curve, evaluated in hours", () => {
  // Guzzetti et al. (2007), Meteorology and Atmospheric Physics 98:239-267,
  // Fig. 6C: I = 8.67 D^-0.61 with D in hours. The previous version restated
  // whatever the source happened to contain, so it went on passing while the
  // duration was handed over in days.
  LANDSLIDE_DURATIONS_DAYS.forEach((days) => {
    const published = 8.67 * (days * 24) ** -0.61;
    assert.ok(
      Math.abs(landslideThreshold(days) - published) < 1e-12,
      `${days} d: ${landslideThreshold(days)} vs published ${published}`,
    );
  });
});

test("asks for a depth of rain this basin can actually reach", () => {
  // the reviewer's point: six years and not one critical day. Fed days, the
  // one-day bar stood at 210 mm against a wettest day on record of 83 mm.
  const oneDayDepth = landslideThreshold(1) * 24;
  assert.ok(oneDayDepth > 20 && oneDayDepth < 60, `one-day bar is ${oneDayDepth.toFixed(1)} mm`);
  const fiveDayDepth = landslideThreshold(5) * 120;
  assert.ok(fiveDayDepth < 100, `five-day bar is ${fiveDayDepth.toFixed(1)} mm`);
});

test("stays inside the range the published curve was fitted over", () => {
  const [minHours, maxHours] = LANDSLIDE_THRESHOLD_VALID_HOURS;
  LANDSLIDE_DURATIONS_DAYS.forEach((days) => {
    const hours = days * 24;
    assert.ok(hours >= minHours && hours <= maxHours, `${days} d = ${hours} h is outside ${minHours}-${maxHours} h`);
  });
});

test("falls as the window lengthens", () => {
  const thresholds = LANDSLIDE_DURATIONS_DAYS.map(landslideThreshold);
  thresholds.slice(1).forEach((value, index) => {
    assert.ok(value < thresholds[index], `threshold rose from ${thresholds[index]} to ${value}`);
  });
});

test("handles invalid and empty hourly datasets safely", () => {
  assert.deepEqual(calculateLandslideRainfallIndicator([]).yearly, []);
  assert.deepEqual(
    calculateLandslideRainfallIndicator([{ d: "invalid", v: "bad" }]).yearly,
    []
  );
});

test("drops a day whose total is physically impossible and keeps the rest", () => {
  const good = Array.from({ length: 24 }, (_, hour) => hourlyRecord(hour, 2));
  // one broken reading carries the second day past the limit on its own
  const broken = [hourlyRecord(24 + 7, MAX_PLAUSIBLE_DAILY_RAINFALL_MM + 1), hourlyRecord(24 + 8, 4)];
  const rows = reconstructHourlyRainfall([...good, ...broken]);
  const days = new Set(rows.map((row) => row.timestamp.getDate()));
  assert.deepEqual([...days], [1]);
  assert.equal(rows.reduce((sum, row) => sum + row.depthMm, 0), 48);
});

test("leaves a heavy but possible day untouched", () => {
  const heavy = Array.from({ length: 24 }, (_, hour) => hourlyRecord(hour, 6));
  const rows = reconstructHourlyRainfall(heavy);
  assert.equal(rows.length, 24);
  assert.equal(rows.reduce((sum, row) => sum + row.depthMm, 0), 144);
});
