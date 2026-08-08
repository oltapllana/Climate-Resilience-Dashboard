import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { importWorkbook } from "./importExcel.js";
import { calculateHotDays } from "./hotDays.js";

const DATA_DIR = path.resolve("test-data");

function hourlyRecord(timestamp, value) {
  return { d: timestamp, v: value };
}

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

test("daily maxima use the highest valid hourly reading for each day", () => {
  const result = calculateHotDays([
    hourlyRecord("2024-01-01T00:00:00", 20),
    hourlyRecord("2024-01-01T03:00:00", 29),
    hourlyRecord("2024-01-01T06:00:00", 31),
    hourlyRecord("2024-01-02T01:00:00", 18),
  ]);

  assert.equal(result.daily.length, 2);
  assert.equal(result.daily[0].date, "2024-01-01");
  assert.equal(result.daily[0].dailyMax, 31);
  assert.equal(result.daily[1].date, "2024-01-02");
  assert.equal(result.daily[1].dailyMax, 18);
});

test("threshold comparisons are inclusive at exactly 30°C and 40°C", () => {
  const result = calculateHotDays([
    hourlyRecord("2024-01-01T00:00:00", 30),
    hourlyRecord("2024-01-02T00:00:00", 39.999),
    hourlyRecord("2024-01-03T00:00:00", 40),
  ]);

  assert.equal(result.daily[0].dailyMax, 30);
  assert.equal(result.daily[1].dailyMax, 39.999);
  assert.equal(result.daily[2].dailyMax, 40);
  assert.equal(result.yearly[0].days30, 3);
  assert.equal(result.yearly[0].days40, 1);
});

test("missing hours are not zero-filled and missing days remain missing", () => {
  const result = calculateHotDays([
    hourlyRecord("2024-01-01T00:00:00", 10),
    hourlyRecord("2024-01-03T00:00:00", 12),
    hourlyRecord("2024-01-03T01:00:00", 15),
  ]);

  assert.deepEqual(result.daily.map((row) => row.date), ["2024-01-01", "2024-01-03"]);
  assert.equal(result.daily[0].dailyMax, 10);
  assert.equal(result.daily[1].dailyMax, 15);
  assert.equal(result.yearly[0].days30, 0);
  assert.equal(result.yearly[0].days40, 0);
});

test("invalid or null readings are ignored", () => {
  const result = calculateHotDays([
    hourlyRecord("2024-01-01T00:00:00", 27),
    hourlyRecord("2024-01-01T01:00:00", null),
    hourlyRecord("2024-01-01T02:00:00", "bad"),
    hourlyRecord("2024-01-01T03:00:00", 29),
  ]);

  assert.equal(result.daily.length, 1);
  assert.equal(result.daily[0].dailyMax, 29);
});

test("annual counts, record maximum and partial years are computed correctly", () => {
  const result = calculateHotDays([
    hourlyRecord("2023-12-31T23:00:00", 35),
    hourlyRecord("2024-01-01T00:00:00", 25),
    hourlyRecord("2024-01-02T00:00:00", 31),
    hourlyRecord("2024-12-31T23:00:00", 10),
    hourlyRecord("2025-01-01T00:00:00", 40),
  ]);

  assert.equal(byYear(result, 2023).days30, 1);
  assert.equal(byYear(result, 2024).days30, 1);
  assert.equal(byYear(result, 2024).days40, 0);
  assert.equal(byYear(result, 2025).days30, 1);
  assert.equal(byYear(result, 2025).days40, 1);
  assert.equal(result.recordMax.temperature, 40);
  assert.equal(result.recordMax.date, "2025-01-01");
  assert.equal(byYear(result, 2023).isPartial, true);
  assert.equal(byYear(result, 2024).isPartial, false);
  assert.equal(byYear(result, 2025).isPartial, true);
});

test("empty input returns an empty result", () => {
  const result = calculateHotDays([]);
  assert.deepEqual(result.daily, []);
  assert.deepEqual(result.yearly, []);
  assert.equal(result.recordMax.temperature, null);
  assert.equal(result.recordMax.date, null);
});

test("real Shajkoc workbook regression", async () => {
  const file = await loadWorkbook("Te_dhenat_Shajkoc - Temperatura.xls");
  const station = await importWorkbook(file);
  const result = calculateHotDays(station.measurements.air_temp.hourly);

  assert.equal(result.recordMax.temperature, 39.7);
  assert.equal(result.recordMax.date, "2025-07-25");
  assert.equal(result.yearly.find((row) => row.year === 2024).days30, 63);
  assert.equal(result.yearly.find((row) => row.year === 2021).days40, 0);
  assert.equal(result.yearly.find((row) => row.year === 2022).days40, 0);
  assert.equal(result.yearly.find((row) => row.year === 2023).days40, 0);
  assert.equal(result.yearly.find((row) => row.year === 2024).days40, 0);
  assert.equal(result.yearly.find((row) => row.year === 2025).days40, 0);
  assert.equal(result.yearly.find((row) => row.year === 2026).days40, 0);

  for (const year of [2021, 2022, 2023, 2025]) {
    const count = result.yearly.find((row) => row.year === year).days30;
    assert.ok(count >= 33 && count <= 46, `${year} count ${count} was outside the expected 33–46 range`);
  }

  assert.equal(result.yearly.find((row) => row.year === 2021).isPartial, true);
  assert.equal(result.yearly.find((row) => row.year === 2026).isPartial, true);
});
