import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { importWorkbook } from "./importExcel.js";
import { calculateHeavySnowfall } from "./heavySnowfall.js";

const rain = (stationId, rows) => ({ stationId, hourly: rows.map(([d, v]) => ({ d, v })) });
const temp = (stationId, rows) => ({ stationId, hourly: rows.map(([d, v]) => ({ d, v })) });

test("reconstructs rainfall, averages duplicates, sums days, and averages only observed temperatures", () => {
  const result = calculateHeavySnowfall(
    rain("same", [["2024-01-01T00:10", 8], ["2024-01-01T00:40", 12], ["2024-01-01T02:00", 2]]),
    temp("same", [["2024-01-01T01:00", -4], ["2024-01-01T03:00", -2]])
  );
  assert.equal(result.dailyRainfall[0].precipitation, 12);
  assert.equal(result.dailyTemperature[0].meanTemperature, -3);
  assert.deepEqual(result.joinedDaily[0], { date: "2024-01-01", precipitation: 12, meanTemperature: -3 });
});

test("uses strict thresholds and counts duplicate-date observations once", () => {
  const result = calculateHeavySnowfall(
    rain("s", [["2024-01-01T00:00", 10], ["2024-01-02T00:00", 11], ["2024-01-03T00:00", 12]]),
    temp("s", [["2024-01-01T00:00", -1], ["2024-01-02T00:00", 0], ["2024-01-03T00:00", -2], ["2024-01-03T01:00", -4]])
  );
  assert.deepEqual(result.events.map((row) => row.date), ["2024-01-03"]);
  assert.equal(result.events[0].meanTemperature, -3);
});

test("rejects different stations and missing inputs", () => {
  assert.throws(() => calculateHeavySnowfall(rain("a", [["2024-01-01", 11]]), temp("b", [["2024-01-01", -1]])), /same station/i);
  assert.equal(calculateHeavySnowfall(rain("a", []), temp("a", [["2024-01-01", -1]])).yearly.length, 0);
  assert.equal(calculateHeavySnowfall(rain("a", [["2024-01-01", 11]]), temp("a", [])).yearly.length, 0);
});

test("excludes dates outside common coverage and distinguishes covered zero from unavailable months", () => {
  const result = calculateHeavySnowfall(
    rain("s", [["2023-12-01T00:00", 20], ["2024-03-31T23:00", 0]]),
    temp("s", [["2024-01-15T00:00", -2], ["2024-03-10T00:00", 2]])
  );
  assert.deepEqual(result.joinedDaily.map((row) => row.date), ["2024-01-15", "2024-03-10"]);
  assert.equal(result.yearly[0].months[0].count, 0);
  assert.equal(result.yearly[0].months[1].count, 0);
  assert.equal(result.yearly[0].months[3].count, null);
  assert.equal(result.yearly[0].isPartial, true);
});

test("aggregates monthly counts and annual total is their sum", () => {
  const result = calculateHeavySnowfall(
    rain("s", [["2024-01-01", 11], ["2024-02-01", 12]]),
    temp("s", [["2024-01-01", -1], ["2024-02-01", -2]])
  );
  assert.deepEqual(result.yearly[0].monthlyCounts.slice(0, 2), [1, 1]);
  assert.equal(result.yearly[0].annualTotal, 2);
  assert.equal(result.yearly[0].annualTotal, result.yearly[0].monthlyCounts.reduce((sum, value) => sum + (value ?? 0), 0));
});

async function workbook(fileName) {
  const locations = [process.env.HEAVY_SNOWFALL_TEST_DATA, path.resolve("test-data")].filter(Boolean);
  for (const directory of locations) {
    try {
      const buffer = await fs.readFile(path.join(directory, fileName));
      return { name: fileName, arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`Missing real Shajkoc workbook: ${fileName}`);
}

test("real Shajkoc workbooks produce the verified six-event regression", async () => {
  const rainfall = await importWorkbook(await workbook("Te_dhenat_Shajkoc - Intensiteti i reshjeve.xls"));
  const temperature = await importWorkbook(await workbook("Te_dhenat_Shajkoc - Temperatura.xls"));
  const result = calculateHeavySnowfall(
    { stationId: rainfall.id, hourly: rainfall.measurements.rain_intensity.hourly },
    { stationId: temperature.id, hourly: temperature.measurements.air_temp.hourly }
  );
  assert.deepEqual(result.events.map((row) => row.date), ["2021-12-12", "2022-03-09", "2023-02-08", "2023-04-04", "2023-11-25", "2024-11-21"]);
  assert.ok(Math.abs(result.events[1].precipitation - 82.4) < 0.05);
  assert.ok(Math.abs(result.events[1].meanTemperature - (-3.3)) < 0.05);
  assert.deepEqual(result.yearly.map((row) => row.monthlyCounts), [
    [null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, null, null, null, null, null, null, null, null],
  ]);
  assert.deepEqual(result.yearly.map((row) => row.annualTotal), [1, 1, 3, 1, 0, 0]);
  assert.deepEqual(result.yearly.map((row) => row.isPartial), [true, false, false, false, false, true]);
});
