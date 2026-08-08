import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { importWorkbook } from "./importExcel.js";
import { calculateDrySpells } from "./drySpells.js";

const DATA_DIR = process.env.DRY_SPELL_TEST_DATA || path.resolve("test-data");
const hourlyRecord = (date, value = 0) => ({ d: `${date}T12:00:00`, v: value });

function dateSequence(start, length) {
  const dates = [];
  const cursor = new Date(`${start}T12:00:00`);
  for (let index = 0; index < length; index += 1) {
    dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function recordsForDailyTotals(start, totals) {
  return dateSequence(start, totals.length).map((date, index) => hourlyRecord(date, totals[index]));
}

function year(result, value = 2024) {
  return result.yearly.find((row) => row.year === value);
}

async function loadWorkbook(fileName) {
  const buffer = await fs.readFile(path.join(DATA_DIR, fileName));
  return {
    name: fileName,
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    },
  };
}

test("daily totals strictly below 1 mm are dry and exactly 1 mm is not dry", () => {
  const result = calculateDrySpells(recordsForDailyTotals("2024-04-01", [0.99, 1, 0]));
  assert.deepEqual(result.daily.map((row) => [row.date, row.total, row.isDry]), [
    ["2024-04-01", 0.99, true],
    ["2024-04-02", 1, false],
    ["2024-04-03", 0, true],
  ]);
});

test("4-day run does not qualify", () => {
  const row = year(calculateDrySpells(recordsForDailyTotals("2024-04-01", [0, 0, 0, 0, 1])));
  assert.equal(row.daysAtLeast5, 0);
  assert.equal(row.daysAtLeast7, 0);
});

for (const [length, atLeast5, atLeast7] of [[5, 5, 0], [6, 6, 0], [7, 7, 7], [10, 10, 10]]) {
  test(`${length}-day run contributes its full length to the correct nested totals`, () => {
    const row = year(calculateDrySpells(recordsForDailyTotals("2024-04-01", [...Array(length).fill(0), 1])));
    assert.equal(row.daysAtLeast5, atLeast5);
    assert.equal(row.daysAtLeast7, atLeast7);
    assert.equal(row.runs[0].length, length);
  });
}

test("wet days split consecutive dry runs", () => {
  const row = year(calculateDrySpells(recordsForDailyTotals("2024-04-01", [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1])));
  assert.deepEqual(row.runs.map((run) => run.length), [5, 7]);
  assert.equal(row.daysAtLeast5, 12);
  assert.equal(row.daysAtLeast7, 7);
});

test("runs do not cross the April or September seasonal boundaries", () => {
  const result = calculateDrySpells([
    hourlyRecord("2024-03-28", 0),
    hourlyRecord("2024-04-07", 1),
    hourlyRecord("2024-09-26", 1),
    hourlyRecord("2024-10-05", 0),
  ]);
  const row = year(result);
  assert.equal(row.runs[0].startDate, "2024-04-01");
  assert.equal(row.runs[0].endDate, "2024-04-06");
  assert.equal(row.runs[0].length, 6);
  assert.equal(row.runs.at(-1).endDate, "2024-09-30");
});

test("missing hours use the existing zero-rainfall reconstruction assumption", () => {
  const result = calculateDrySpells([
    { d: "2024-04-01T12:10:00", v: 0.4 },
    { d: "2024-04-01T12:40:00", v: 0.6 },
    { d: "2024-04-06T12:00:00", v: 1 },
  ]);
  assert.equal(result.hourly[0].depthMm, 0.5);
  assert.equal(result.hourly[1].depthMm, 0);
  assert.equal(year(result).daysAtLeast5, 5);
});

test("partial first and final years expose exact available seasonal coverage", () => {
  const result = calculateDrySpells([
    hourlyRecord("2021-04-06", 1),
    hourlyRecord("2022-09-15", 1),
  ]);
  assert.deepEqual(year(result, 2021), assertPartial(year(result, 2021), "2021-04-06", "2021-09-30", 178));
  assert.deepEqual(year(result, 2022), assertPartial(year(result, 2022), "2022-04-01", "2022-09-15", 168));
});

function assertPartial(row, start, end, count) {
  assert.equal(row.availableStart, start);
  assert.equal(row.availableEnd, end);
  assert.equal(row.availableSeasonalDays, count);
  assert.equal(row.isPartial, true);
  return row;
}

test("empty and invalid input return empty results", () => {
  assert.deepEqual(calculateDrySpells([]).yearly, []);
  assert.deepEqual(calculateDrySpells([{ d: "invalid", v: "bad" }]).yearly, []);
});

test("real Shajkoc workbook matches required annual dry-spell totals", async () => {
  const station = await importWorkbook(await loadWorkbook("Te_dhenat_Shajkoc - Intensiteti i reshjeve.xls"));
  const result = calculateDrySpells(station.measurements.rain_intensity.hourly);
  assert.deepEqual(result.yearly.map((row) => [row.year, row.daysAtLeast5, row.daysAtLeast7]), [
    [2021, 119, 85],
    [2022, 61, 55],
    [2023, 86, 59],
    [2024, 107, 91],
    [2025, 119, 109],
    [2026, 6, 0],
  ]);
});
