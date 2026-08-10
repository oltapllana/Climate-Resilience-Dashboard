import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { importWorkbook } from "./importExcel.js";
import { calculateFreezeThawCycles } from "./freezeThawCycles.js";

const DATA_DIR = process.env.FREEZE_THAW_TEST_DATA || path.resolve("test-data");
const reading = (d, v) => ({ d, v });
const year = (result, value) => result.yearly.find((row) => row.year === value);

async function workbook(name) {
  const buffer = await fs.readFile(path.join(DATA_DIR, name));
  return { name, arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
}

test("derives daily extrema from available hourly readings and counts a qualifying day once", () => {
  const result = calculateFreezeThawCycles([
    reading("2024-01-02T01:00:00", 1.5), reading("2024-01-02T03:00:00", -2.3),
    reading("2024-01-02T15:00:00", 4), reading("2024-01-02T18:00:00", -1),
  ]);
  assert.deepEqual(result.daily, [{ date: "2024-01-02", dailyMin: -2.3, dailyMax: 4, qualifying: true }]);
  assert.equal(year(result, 2024).annualTotal, 1);
});

test("uses strict thresholds at -2.2C and 0C", () => {
  const result = calculateFreezeThawCycles([
    reading("2024-01-01T01:00", -2.2), reading("2024-01-01T14:00", 1),
    reading("2024-01-02T01:00", -3), reading("2024-01-02T14:00", 0),
    reading("2024-01-03T01:00", -2.21), reading("2024-01-03T14:00", 0.01),
  ]);
  assert.deepEqual(result.daily.map((row) => row.qualifying), [false, false, true]);
});

test("does not fill missing hours or days and ignores invalid values", () => {
  const result = calculateFreezeThawCycles([
    reading("2024-02-01T02:00", -4), reading("2024-02-01T13:00", null),
    reading("2024-02-01T14:00", "bad"), reading("invalid", 8),
    reading("2024-02-03T12:00", 3),
  ]);
  assert.deepEqual(result.daily.map((row) => row.date), ["2024-02-01", "2024-02-03"]);
  assert.deepEqual(result.daily.map((row) => [row.dailyMin, row.dailyMax]), [[-4, -4], [3, 3]]);
});

test("groups by local calendar date and calendar year rather than winter year", () => {
  const result = calculateFreezeThawCycles([
    reading("2023-12-31T01:00", -3), reading("2023-12-31T13:00", 2),
    reading("2024-01-01T01:00", -3), reading("2024-01-01T13:00", 2),
  ]);
  assert.equal(year(result, 2023).annualTotal, 1);
  assert.equal(year(result, 2024).annualTotal, 1);
});

test("aggregates months, preserves covered zeroes, and leaves unavailable months null", () => {
  const result = calculateFreezeThawCycles([
    reading("2021-04-06T01:00", -3), reading("2021-04-06T13:00", 2),
    reading("2021-05-10T12:00", 8), reading("2022-02-03T12:00", 8),
  ]);
  const first = year(result, 2021);
  assert.deepEqual(first.monthlyCounts.slice(0, 5), [null, null, null, 1, 0]);
  assert.equal(first.annualTotal, first.monthlyCounts.reduce((sum, count) => sum + (count ?? 0), 0));
  assert.equal(first.availableStart, "2021-04-06");
  assert.equal(first.availableEnd, "2021-12-31");
  assert.equal(first.isPartial, true);
  assert.equal(first.months[3].isPartial, true);
  assert.equal(year(result, 2022).availableEnd, "2022-02-03");
  assert.equal(year(result, 2022).isPartial, true);
});

test("empty and invalid input returns an empty result", () => {
  assert.deepEqual(calculateFreezeThawCycles([]), { hourly: [], daily: [], yearly: [], availableStart: null, availableEnd: null });
  assert.deepEqual(calculateFreezeThawCycles(null).yearly, []);
});

test("real Shajkoc workbook matches the verified monthly matrix", async () => {
  const station = await importWorkbook(await workbook("Te_dhenat_Shajkoc - Temperatura.xls"));
  const result = calculateFreezeThawCycles(station.measurements.air_temp.hourly);
  assert.equal(result.availableStart, "2021-04-06");
  assert.equal(result.availableEnd, "2026-04-15");
  assert.deepEqual(result.yearly.map((row) => [...row.monthlyCounts, row.annualTotal]), [
    [null, null, null, 4, 0, 0, 0, 0, 0, 0, 0, 8, 12],
    [11, 7, 15, 0, 0, 0, 0, 0, 0, 0, 1, 5, 39],
    [2, 9, 3, 3, 0, 0, 0, 0, 0, 0, 4, 7, 28],
    [11, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 23],
    [7, 13, 4, 3, 0, 0, 0, 0, 0, 0, 0, 9, 36],
    [9, 3, 0, 0, null, null, null, null, null, null, null, null, 12],
  ]);
});
