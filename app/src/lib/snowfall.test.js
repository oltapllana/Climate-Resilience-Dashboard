import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { importWorkbook } from "./importExcel.js";
import { calculateHeavySnowfall } from "./heavySnowfall.js";
import { calculateSnowfall } from "./snowfall.js";

const input = (stationId, rows) => ({ stationId, hourly: rows.map(([d, v]) => ({ d, v })) });

test("reuses the daily precipitation and mean-temperature join", () => {
  const result = calculateSnowfall(
    input("s", [["2024-01-01T00:10", 1], ["2024-01-01T00:40", 3], ["2024-01-01T02:00", 2]]),
    input("s", [["2024-01-01T01:00", -4], ["2024-01-01T03:00", -2]])
  );
  assert.deepEqual(result.joinedDaily, [{ date: "2024-01-01", precipitation: 4, meanTemperature: -3 }]);
});

test("uses strict thresholds and excludes warm precipitation days", () => {
  const result = calculateSnowfall(
    input("s", [["2024-01-01", 1], ["2024-01-02", 2], ["2024-01-03", 3], ["2024-01-04", 4]]),
    input("s", [["2024-01-01", -1], ["2024-01-02", 0], ["2024-01-03", 2], ["2024-01-04", -1]])
  );
  assert.deepEqual(result.qualifyingDates, ["2024-01-04"]);
});

test("counts a qualifying date once when it has duplicate temperature observations", () => {
  const result = calculateSnowfall(
    input("s", [["2024-01-01", 2]]),
    input("s", [["2024-01-01T00:00", -2], ["2024-01-01T01:00", -4]])
  );
  assert.deepEqual(result.qualifyingDates, ["2024-01-01"]);
  assert.equal(result.yearly[0].annualTotal, 1);
});

test("rejects different stations and handles either missing input", () => {
  assert.throws(() => calculateSnowfall(input("a", [["2024-01-01", 2]]), input("b", [["2024-01-01", -1]])), /same station/i);
  assert.equal(calculateSnowfall(input("s", []), input("s", [["2024-01-01", -1]])).yearly.length, 0);
  assert.equal(calculateSnowfall(input("s", [["2024-01-01", 2]]), input("s", [])).yearly.length, 0);
});

test("restricts dates to common coverage and distinguishes covered zero from unavailable", () => {
  const result = calculateSnowfall(
    input("s", [["2023-12-01", 2], ["2024-03-31T23:00", 0]]),
    input("s", [["2024-01-15", 2], ["2024-03-10", 2]])
  );
  assert.deepEqual(result.qualifyingDates, []);
  assert.equal(result.yearly[0].months[0].count, 0);
  assert.equal(result.yearly[0].months[1].count, 0);
  assert.equal(result.yearly[0].months[3].count, null);
  assert.equal(result.yearly[0].isPartial, true);
  assert.ok(result.joinedDaily.every((row) => row.date >= "2024-01-15" && row.date <= "2024-03-10"));
});

test("aggregates months and annual totals, preserving partial first and final years", () => {
  const result = calculateSnowfall(
    input("s", [["2023-12-01", 2], ["2024-02-01", 2]]),
    input("s", [["2023-12-01", -1], ["2024-02-01", -1]])
  );
  assert.deepEqual(result.yearly.map((row) => row.annualTotal), [1, 1]);
  result.yearly.forEach((row) => assert.equal(row.annualTotal, row.monthlyCounts.reduce((sum, value) => sum + (value ?? 0), 0)));
  assert.deepEqual(result.yearly.map((row) => row.isPartial), [true, true]);
});

test("every heavy-snowfall event is contained in snowfall", () => {
  const rainfall = input("s", [["2024-01-01", 2], ["2024-01-02", 11], ["2024-01-03", 12]]);
  const temperature = input("s", [["2024-01-01", -1], ["2024-01-02", -2], ["2024-01-03", 2]]);
  const snow = calculateSnowfall(rainfall, temperature);
  const heavy = calculateHeavySnowfall(rainfall, temperature);
  assert.ok(heavy.events.every((event) => snow.qualifyingDates.includes(event.date)));
  heavy.yearly.forEach((row, yearIndex) => row.monthlyCounts.forEach((count, month) => {
    if (count != null) assert.ok(snow.yearly[yearIndex].monthlyCounts[month] >= count);
  }));
});

async function workbook(fileName) {
  const locations = [process.env.SNOWFALL_TEST_DATA, path.resolve("test-data")].filter(Boolean);
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

test("real Shajkoc snowfall matrix totals 29 and contains every heavy event", async () => {
  const rainStation = await importWorkbook(await workbook("Te_dhenat_Shajkoc - Intensiteti i reshjeve.xls"));
  const tempStation = await importWorkbook(await workbook("Te_dhenat_Shajkoc - Temperatura.xls"));
  const rainfall = { stationId: rainStation.id, hourly: rainStation.measurements.rain_intensity.hourly };
  const temperature = { stationId: tempStation.id, hourly: tempStation.measurements.air_temp.hourly };
  const snow = calculateSnowfall(rainfall, temperature);
  const heavy = calculateHeavySnowfall(rainfall, temperature);
  assert.deepEqual(snow.yearly.map((row) => row.monthlyCounts), [
    [null, null, null, 1, 0, 0, 0, 0, 0, 0, 1, 2],
    [2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 2, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
    [3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
    [1, 0, 0, 0, null, null, null, null, null, null, null, null],
  ]);
  assert.deepEqual(snow.yearly.map((row) => row.annualTotal), [4, 8, 5, 4, 7, 1]);
  assert.equal(snow.qualifyingDates.length, 29);
  assert.ok(heavy.events.every((event) => snow.qualifyingDates.includes(event.date)));
  snow.yearly.forEach((row) => assert.equal(row.annualTotal, row.monthlyCounts.reduce((sum, value) => sum + (value ?? 0), 0)));
  assert.ok(snow.events.every((event) => event.date >= snow.commonCoverage[0].start && event.date <= snow.commonCoverage.at(-1).end));
});
