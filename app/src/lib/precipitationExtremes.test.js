import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { importWorkbook } from "./importExcel.js";
import { calculateLandslideRainfallIndicator } from "./landslideRainfall.js";
import {
  calculatePrecipitationExtremes,
  linearPercentile,
} from "./precipitationExtremes.js";

const DATA_DIR = path.resolve("test-data");

const hourlyRecord = (timestamp, value) => ({ d: timestamp, v: value });

function loadWorkbook(fileName) {
  return fs.readFile(path.join(DATA_DIR, fileName)).then((buffer) => ({
    name: fileName,
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    },
  }));
}

function byYear(result, year) {
  return result.yearly.find((row) => row.year === year);
}

function approximate(value, expected, tolerance = 1e-3) {
  assert.ok(Math.abs(value - expected) <= tolerance, `${value} != ${expected}`);
}

test("linear percentile interpolation matches the expected position", () => {
  assert.equal(linearPercentile([0, 100], 0.999), 99.9);
  assert.equal(linearPercentile([1, 2, 3, 4], 0.5), 2.5);
});

test("duplicate observations in one hour are averaged and missing hours are zero-filled", () => {
  const result = calculatePrecipitationExtremes([
    hourlyRecord("2024-01-01T00:10:00", 10),
    hourlyRecord("2024-01-01T00:40:00", 20),
    hourlyRecord("2024-01-01T02:05:00", 6),
  ]);

  assert.equal(result.hourly.length, 3);
  assert.equal(result.hourly[0].depthMm, 15);
  assert.equal(result.hourly[1].depthMm, 0);
  assert.equal(result.hourly[2].depthMm, 6);
});

test("daily totals include zero-rainfall days in the percentile population", () => {
  const result = calculatePrecipitationExtremes([
    hourlyRecord("2024-01-01T00:00:00", 10),
    hourlyRecord("2024-01-01T01:00:00", 10),
    hourlyRecord("2024-01-03T00:00:00", 20),
  ]);

  assert.equal(result.daily.length, 3);
  assert.equal(result.daily[1].total, 0);
  approximate(result.threshold, linearPercentile([20, 0, 20], 0.999));
});

test("strict greater-than controls extreme days", () => {
  const result = calculatePrecipitationExtremes([
    hourlyRecord("2024-01-01T00:00:00", 5),
    hourlyRecord("2024-01-01T01:00:00", 5),
    hourlyRecord("2024-01-02T00:00:00", 10),
  ]);

  assert.equal(result.extremeDays.length, 0);
});

test("annual maxima include the date of the maximum and partial years", () => {
  const result = calculatePrecipitationExtremes([
    hourlyRecord("2023-12-31T23:00:00", 40),
    hourlyRecord("2024-01-01T00:00:00", 20),
    hourlyRecord("2024-01-02T00:00:00", 60),
    hourlyRecord("2024-12-31T23:00:00", 10),
  ]);

  assert.equal(byYear(result, 2023).maxDate, "2023-12-31");
  assert.equal(byYear(result, 2024).maxDate, "2024-01-02");
});

test("empty or invalid hourly input is handled safely", () => {
  const empty = calculatePrecipitationExtremes([]);
  assert.equal(empty.hourly.length, 0);
  assert.equal(empty.daily.length, 0);
  assert.equal(empty.yearly.length, 0);

  const invalid = calculatePrecipitationExtremes([{ d: "invalid", v: "bad" }]);
  assert.equal(invalid.hourly.length, 0);
  assert.equal(invalid.daily.length, 0);
  assert.equal(invalid.yearly.length, 0);
});

test("real Shajkoc workbook matches the required precipitation-extremes outputs", async () => {
  const file = await loadWorkbook("Te_dhenat_Shajkoc - Intensiteti i reshjeve.xls");
  const station = await importWorkbook(file);
  const landslide = calculateLandslideRainfallIndicator(station.measurements.rain_intensity.hourly);
  const result = calculatePrecipitationExtremes(station.measurements.rain_intensity.hourly);

  assert.equal(result.hourly.length, 43947);
  assert.equal(result.daily.length, 1832);
  assert.equal(result.daily[0].date, "2021-04-06");
  assert.equal(result.daily.at(-1).date, "2026-04-11");

  approximate(result.threshold, 258.2686963911021);

  assert.equal(result.extremeDays.length, 2);
  assert.equal(result.extremeDays[0].date, "2023-03-09");
  assert.equal(result.extremeDays[1].date, "2024-05-07");
  approximate(result.extremeDays[0].total, 428.57142857142856);
  approximate(result.extremeDays[1].total, 432);

  approximate(byYear(result, 2021).maxTotal, 116.973846);
  approximate(byYear(result, 2022).maxTotal, 116.269136);
  approximate(byYear(result, 2023).maxTotal, 428.571429);
  approximate(byYear(result, 2024).maxTotal, 432);
  approximate(byYear(result, 2025).maxTotal, 107.869696);
  approximate(byYear(result, 2026).maxTotal, 46.004766);

  assert.deepEqual(result.extremeDays.map((day) => day.date), ["2023-03-09", "2024-05-07"]);
  assert.equal(byYear(result, 2021).exceedsThreshold, false);
  assert.equal(byYear(result, 2022).exceedsThreshold, false);
  assert.equal(byYear(result, 2023).exceedsThreshold, true);
  assert.equal(byYear(result, 2024).exceedsThreshold, true);
  assert.equal(byYear(result, 2025).exceedsThreshold, false);
  assert.equal(byYear(result, 2026).exceedsThreshold, false);

  assert.equal(landslide.yearly.find((row) => row.year === 2023).criticalDays, 9);
  assert.equal(landslide.yearly.find((row) => row.year === 2024).criticalDays, 8);
});