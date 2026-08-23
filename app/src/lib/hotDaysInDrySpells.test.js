import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { importWorkbook } from "./importExcel.js";
import { calculateHotDaysInDrySpells } from "./hotDaysInDrySpells.js";

const DATA_DIR = process.env.COMPOUND_TEST_DATA || path.resolve("test-data");

function dates(start, length) {
  const result = [];
  const cursor = new Date(`${start}T12:00:00`);
  for (let index = 0; index < length; index += 1) {
    result.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

const rainfall = (start, totals) => dates(start, totals.length).map((date, index) => ({ d: `${date}T12:00`, v: totals[index] }));
const temperatures = (start, maxima) => dates(start, maxima.length).map((date, index) => ({ d: `${date}T15:00`, v: maxima[index] }));
const row = (result, year = 2024) => result.yearly.find((item) => item.year === year);

test("annual chart separates bar counts from the explicitly described hot-day share", async () => {
  const source = await fs.readFile(new URL("../components/HotDaysInDrySpellsIndicator.jsx", import.meta.url), "utf8");

  assert.match(source, /LabelList dataKey="compound5Count" content=\{<CountLabel \/>\}/);
  assert.match(source, /LabelList dataKey="compound7Count" content=\{<CountLabel \/>\}/);
  assert.match(source, /Share of hot days in ≥5-day dry spells:/);
  assert.doesNotMatch(source, /compound5Label/);
  assert.match(source, /\* Partial record/);
});

async function workbook(fileName) {
  const buffer = await fs.readFile(path.join(DATA_DIR, fileName));
  return { name: fileName, arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
}

test("intersects local date keys and includes exact 30°C inside a 5–6-day run", () => {
  const result = calculateHotDaysInDrySpells(
    rainfall("2024-04-01", [0, 0, 0, 0, 0, 0, 1]),
    temperatures("2024-04-01", [20, 30, 20, 20, 20, 20, 20])
  );
  assert.deepEqual(row(result).hotDayDates, ["2024-04-02"]);
  assert.deepEqual(row(result).compound5Dates, ["2024-04-02"]);
  assert.deepEqual(row(result).compound7Dates, []);
});

test("7+-day results are nested within ≥5 results", () => {
  const result = calculateHotDaysInDrySpells(
    rainfall("2024-04-01", [0, 0, 0, 0, 0, 0, 0, 1]),
    temperatures("2024-04-01", [30, 20, 30, 20, 20, 20, 20, 20])
  );
  assert.deepEqual(row(result).compound5Dates, ["2024-04-01", "2024-04-03"]);
  assert.deepEqual(row(result).compound7Dates, row(result).compound5Dates);
});

test("hot days outside qualifying runs and dry days that are not hot are not compound", () => {
  const result = calculateHotDaysInDrySpells(
    rainfall("2024-04-01", [0, 0, 0, 0, 1, 1]),
    temperatures("2024-04-01", [20, 20, 20, 20, 30, 20])
  );
  assert.equal(row(result).totalHotDays, 1);
  assert.deepEqual(row(result).compound5Dates, []);
});

test("duplicate temperature dates count once and share uses the unrounded ratio", () => {
  const rain = rainfall("2024-04-01", [0, 0, 0, 0, 0, 1, 1, 1]);
  const temp = temperatures("2024-04-01", [30, 30, 20, 20, 20, 30, 20, 20]);
  temp.push({ d: "2024-04-01T16:00", v: 31 });
  const annual = row(calculateHotDaysInDrySpells(rain, temp));
  assert.equal(annual.totalHotDays, 3);
  assert.equal(annual.compound5Count, 2);
  assert.ok(Math.abs(annual.compound5Share - 200 / 3) < 1e-10);
  assert.equal(Math.round(annual.compound5Share), 67);
});

test("zero hot days returns a zero share", () => {
  const annual = row(calculateHotDaysInDrySpells(rainfall("2024-04-01", [0, 0, 0, 0, 0]), temperatures("2024-04-01", [20, 20, 20, 20, 20])));
  assert.equal(annual.totalHotDays, 0);
  assert.equal(annual.compound5Share, 0);
});

test("restricts results to April–September and common record coverage", () => {
  const result = calculateHotDaysInDrySpells(
    [{ d: "2024-03-25T12:00", v: 0 }, { d: "2024-10-05T12:00", v: 1 }],
    temperatures("2024-04-03", [30, 30, 30, 30, 30])
  );
  const annual = row(result);
  assert.equal(annual.availableCommonStart, "2024-04-03");
  assert.equal(annual.availableCommonEnd, "2024-04-07");
  assert.equal(annual.isPartial, true);
  assert.ok(annual.compound5Dates.every((date) => date >= annual.availableCommonStart && date <= annual.availableCommonEnd));
});

test("missing either input returns no compound years", () => {
  assert.deepEqual(calculateHotDaysInDrySpells([], temperatures("2024-04-01", [30])).yearly, []);
  assert.deepEqual(calculateHotDaysInDrySpells(rainfall("2024-04-01", [0]), []).yearly, []);
  assert.deepEqual(calculateHotDaysInDrySpells(null, null).yearly, []);
});

test("real Shajkoc workbooks match annual compound counts and shares", async () => {
  const rainStation = await importWorkbook(await workbook("Te_dhenat_Shajkoc - Intensiteti i reshjeve.xls"));
  const tempStation = await importWorkbook(await workbook("Te_dhenat_Shajkoc - Temperatura.xls"));
  const result = calculateHotDaysInDrySpells(
    rainStation.measurements.rain_intensity.hourly,
    tempStation.measurements.air_temp.hourly
  );
  const result2022 = result.yearly.find((item) => item.year === 2022);
  assert.equal(result2022.totalHotDays, 33);
  assert.equal(result2022.compound5Count, 15);
  assert.equal(result2022.compound7Count, 15);
  assert.equal(Math.round(result2022.compound5Share), 45);
  assert.deepEqual(result.yearly.map((item) => [item.year, item.totalHotDays, item.compound5Count, Math.round(item.compound5Share), item.compound7Count]), [
    [2021, 44, 36, 82, 19],
    [2022, 33, 15, 45, 15],
    [2023, 35, 27, 77, 18],
    [2024, 63, 57, 90, 55],
    [2025, 46, 40, 87, 33],
    [2026, 0, 0, 0, 0],
  ]);
  result.yearly.forEach((item) => {
    assert.ok(item.compound7Count <= item.compound5Count && item.compound5Count <= item.totalHotDays);
    assert.ok(item.compound7Dates.every((date) => item.compound5Dates.includes(date)));
    assert.ok(item.compound5Dates.every((date) => item.hotDayDates.includes(date) && item.drySpell5Dates.includes(date)));
    assert.ok(item.compound7Dates.every((date) => item.hotDayDates.includes(date) && item.drySpell7Dates.includes(date)));
  });
});
