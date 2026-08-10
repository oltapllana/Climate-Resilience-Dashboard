import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { importWorkbook } from "./importExcel.js";
import { calculateTropicalNights } from "./tropicalNights.js";

const DATA_DIR = process.env.TROPICAL_NIGHTS_TEST_DATA || path.resolve("test-data");
const reading = (d, v) => ({ d, v });
const year = (result, value) => result.annualCounts.find((row) => row.year === value);

async function workbook(name) {
  const buffer = await fs.readFile(path.join(DATA_DIR, name));
  return { name, arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
}

test("uses the minimum of all valid observations and the strict 20C threshold", () => {
  const result = calculateTropicalNights([
    reading("2024-07-01T01:00:00", 23), reading("2024-07-01T05:00:00", 21),
    reading("2024-07-02T01:00:00", 22), reading("2024-07-02T05:00:00", 20),
    reading("2024-07-03T01:00:00", 20.01),
  ]);
  assert.deepEqual(result.dailyMinimumSeries.map((row) => [row.date, row.dailyMinimum, row.qualifying]), [
    ["2024-07-01", 21, true], ["2024-07-02", 20, false], ["2024-07-03", 20.01, true],
  ]);
  assert.deepEqual(result.qualifyingDates, ["2024-07-01", "2024-07-03"]);
});

test("ignores invalid observations without filling missing hours or days", () => {
  const result = calculateTropicalNights([
    reading("2024-06-01T02:00:00", 21), reading("2024-06-01T03:00:00", null),
    reading("2024-06-01T04:00:00", "bad"), reading("invalid", 30),
    reading("2024-06-03T02:00:00", 19),
  ]);
  assert.deepEqual(result.dailyMinimumSeries.map((row) => row.date), ["2024-06-01", "2024-06-03"]);
  assert.deepEqual(result.dailyMinimumSeries.map((row) => row.dailyMinimum), [21, 19]);
});

test("groups local calendar dates and duplicate timestamps/dates count once", () => {
  const result = calculateTropicalNights([
    reading("2023-12-31T23:30:00", 21), reading("2023-12-31T23:30:00", 22),
    reading("2024-01-01T00:30:00", 21), reading("2024-01-01T03:30:00", 22),
  ]);
  assert.deepEqual(result.qualifyingDates, ["2023-12-31", "2024-01-01"]);
  assert.equal(year(result, 2023).count, 1);
  assert.equal(year(result, 2024).count, 1);
});

test("aggregates monthly and annual counts and finds the warmest night", () => {
  const result = calculateTropicalNights([
    reading("2024-06-01T02:00:00", 21), reading("2024-06-02T02:00:00", 19),
    reading("2024-07-18T02:00:00", 23.4), reading("2024-07-18T04:00:00", 24),
    reading("2025-08-01T02:00:00", 22),
  ]);
  assert.deepEqual(result.monthlyCounts.map((row) => [row.month, row.count]), [["2024-06", 1], ["2024-07", 1], ["2024-08", 0], ["2024-09", 0], ["2024-10", 0], ["2024-11", 0], ["2024-12", 0], ["2025-01", 0], ["2025-02", 0], ["2025-03", 0], ["2025-04", 0], ["2025-05", 0], ["2025-06", 0], ["2025-07", 0], ["2025-08", 1]]);
  assert.deepEqual(result.annualCounts.map((row) => [row.year, row.count]), [[2024, 2], [2025, 1]]);
  assert.equal(result.monthlyCounts.reduce((sum, row) => sum + row.count, 0), result.totalCount);
  assert.equal(result.annualCounts.reduce((sum, row) => sum + row.count, 0), result.totalCount);
  assert.deepEqual(result.warmestNight, { date: "2024-07-18", temperature: 23.4 });
});

test("preserves observation coverage and marks only first/final incomplete years partial", () => {
  const result = calculateTropicalNights([
    reading("2021-04-06T01:00:00", 10), reading("2022-06-01T01:00:00", 10),
    reading("2023-12-31T23:00:00", 10),
  ]);
  assert.equal(result.firstObservationDate, "2021-04-06");
  assert.equal(result.lastObservationDate, "2023-12-31");
  assert.deepEqual(result.annualCounts.map((row) => [row.year, row.isPartial]), [[2021, true], [2022, false], [2023, false]]);
  assert.equal(year(result, 2021).availableStart, "2021-04-06");
  assert.equal(year(result, 2021).availableEnd, "2021-12-31");
});

test("empty and invalid input returns an empty result", () => {
  for (const input of [null, [], [reading("bad", null)]]) {
    const result = calculateTropicalNights(input);
    assert.deepEqual(result.dailyMinimumSeries, []);
    assert.deepEqual(result.monthlyCounts, []);
    assert.deepEqual(result.annualCounts, []);
    assert.equal(result.totalCount, 0);
    assert.deepEqual(result.warmestNight, { date: null, temperature: null });
  }
});

test("real Shajkoc workbook regression", async () => {
  const station = await importWorkbook(await workbook("Te_dhenat_Shajkoc - Temperatura.xls"));
  const result = calculateTropicalNights(station.measurements.air_temp.hourly);
  assert.deepEqual(result.annualCounts.map((row) => [row.year, row.count]), [[2021, 6], [2022, 0], [2023, 2], [2024, 3], [2025, 6], [2026, 0]]);
  assert.equal(result.totalCount, 17);
  assert.equal(result.monthlyCounts.reduce((sum, row) => sum + row.count, 0), 17);
  assert.ok(result.qualifyingDates.every((date) => [6, 7, 8].includes(Number(date.slice(5, 7)))));
  assert.ok(result.dailyMinimumSeries.filter((row) => row.qualifying).every((row) => row.dailyMinimum > 20));
  assert.deepEqual(result.warmestNight, { date: "2024-07-18", temperature: 23.4 });
  assert.equal(year(result, 2021).isPartial, true);
  assert.equal(year(result, 2026).isPartial, true);
});
