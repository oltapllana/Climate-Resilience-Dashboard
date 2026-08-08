import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { importWorkbook } from "./importExcel.js";
import { calculateLandslideRainfallIndicator } from "./landslideRainfall.js";

const DATA_DIR = path.resolve("test-data");

async function loadStation(fileName) {
  const abs = path.join(DATA_DIR, fileName);
  const buf = await fs.readFile(abs);
  const file = {
    name: fileName,
    async arrayBuffer() {
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    },
  };
  const station = await importWorkbook(file);
  const measurement = station.measurements.rain_intensity;
  const result = calculateLandslideRainfallIndicator(measurement.hourly);
  return { station, measurement, result };
}

function byYear(result, year) {
  return result.yearly.find((row) => row.year === year);
}

function maxima(row) {
  return row.values.map((value) => value.maximum);
}

function exceededDurations(row) {
  return row.values.filter((value) => value.exceeded).map((value) => value.duration);
}

function approxEqual(actual, expected, tolerance = 0.01) {
  return Math.abs(actual - expected) <= tolerance;
}

function assertApproxArray(actual, expected, tolerance = 0.01) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => {
    assert.ok(
      approxEqual(value, expected[index], tolerance),
      `expected ${expected[index]} at index ${index}, got ${value}`
    );
  });
}

test("Shajkoc real workbook regression", async () => {
  const { measurement, result } = await loadStation("Te_dhenat_Shajkoc - Intensiteti i reshjeve.xls");

  assert.equal(measurement.sourceMetadata.sourceUnit, null);
  assert.equal(measurement.rawObservations.length, 29888);
  assert.equal(measurement.hourly.length, 4629);
  assert.equal(measurement.hourly[0].d, "2021-04-06T10:00");
  assert.equal(measurement.hourly.at(-1).d, "2026-04-11T12:00");

  assertApproxArray(maxima(byYear(result, 2023)), [18.031, 10.019, 6.837, 5.128, 4.102]);
  assertApproxArray(maxima(byYear(result, 2024)), [18.0, 9.005, 6.37, 5.107, 4.386]);

  assert.equal(byYear(result, 2021).criticalDays, 0);
  assert.equal(byYear(result, 2022).criticalDays, 0);
  assert.equal(byYear(result, 2023).criticalDays, 9);
  assert.equal(byYear(result, 2024).criticalDays, 8);
  assert.equal(byYear(result, 2025).criticalDays, 0);
  assert.equal(byYear(result, 2026).criticalDays, 0);

  assert.deepEqual(exceededDurations(byYear(result, 2023)), [1, 2, 3, 4, 5]);
  assert.deepEqual(exceededDurations(byYear(result, 2024)), [1, 2, 3, 4, 5]);
});

test("Podujevë real workbook regression", async () => {
  const { measurement, result } = await loadStation("Podujeve_Intensity.xlsx");

  assert.equal(measurement.sourceMetadata.sourceUnit, "mm/min");
  assert.equal(measurement.rawObservations.length, 8778);
  assert.equal(measurement.hourly.length, 973);
  assert.equal(measurement.hourly[0].d, "2024-09-23T12:00");
  assert.equal(measurement.hourly.at(-1).d, "2026-04-21T08:00");

  assertApproxArray(maxima(byYear(result, 2025)), [15.194, 7.597, 5.065, 4.184, 3.347]);

  assert.equal(byYear(result, 2024).criticalDays, 0);
  assert.equal(byYear(result, 2025).criticalDays, 6);
  assert.equal(byYear(result, 2026).criticalDays, 0);

  assert.deepEqual(exceededDurations(byYear(result, 2025)), [1, 2, 3, 4, 5]);
});

test("Pollatë real workbook regression", async () => {
  const { measurement, result } = await loadStation("Pollate_Intensity.xlsx");

  assert.equal(measurement.sourceMetadata.sourceUnit, "mm/min");
  assert.equal(measurement.rawObservations.length, 7329);
  assert.equal(measurement.hourly.length, 881);
  assert.equal(measurement.hourly[0].d, "2024-10-09T10:00");
  assert.equal(measurement.hourly.at(-1).d, "2026-04-11T11:00");

  assertApproxArray(maxima(byYear(result, 2025)), [11.65, 6.025, 4.017, 3.013, 2.41]);

  assert.equal(byYear(result, 2024).criticalDays, 0);
  assert.equal(byYear(result, 2025).criticalDays, 3);
  assert.equal(byYear(result, 2026).criticalDays, 0);

  assert.deepEqual(exceededDurations(byYear(result, 2025)), [1, 2]);
});