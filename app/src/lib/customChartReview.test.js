import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildSync } from "esbuild";
import { makeT } from "../i18n.js";
import { processWindData, processWindRiskHeatmap } from "./windRose.js";
import { calculateMonthYearGrid, rampColor, readableTextColor } from "./monthYearGrid.js";
import { contrastingText } from "./chartPalette.js";
import { windRoseRows, windRoseColumns, windRiskRows, windRiskColumns, monthYearRows, matrixRows, dryTimelineRows, compoundTimelineRows } from "./customChartData.js";
import { csvText } from "./chartExport.js";

function component(name) {
  const filename = fileURLToPath(new URL(`../components/${name}.jsx`, import.meta.url));
  const { outputFiles } = buildSync({ entryPoints: [filename], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", jsx: "automatic" });
  const module = new Module(filename); module.filename = filename;
  module.paths = Module._nodeModulePaths(fileURLToPath(new URL("../../", import.meta.url)));
  module._compile(outputFiles[0].text, filename); return module.exports;
}
const hourly = [{ d: "2024-01-01T00:00:00", v: 0 }, { d: "2024-01-02T00:00:00", v: 11 }, { d: "2024-01-01T01:00:00", v: 2 }];
test("wind risk retains observed zero versus missing, without changing the percentage formula", () => {
  const result = processWindRiskHeatmap({ hourly }); const rows = windRiskRows(result);
  assert.equal(rows.length, 288);
  assert.deepEqual(rows[0], { month: 1, hour: 0, percentage: 50, observed: true, count: 2, highRiskCount: 1, threshold: 10.8 });
  assert.equal(rows[1].percentage, 0); assert.equal(rows[1].observed, true);
  assert.equal(rows[2].percentage, null); assert.equal(rows[2].observed, false);
  assert.equal(result.heatmapData.Jan[0], "50.00");
  assert.ok(csvText(rows, windRiskColumns).includes("1,2,,false,0,0,10.8"));
});
test("blank and invalid wind readings are not observations of calm wind", () => {
  const result = processWindRiskHeatmap({ hourly: [null, "", NaN].map(v => ({ d: "2024-01-01T00:00:00", v })) });
  assert.equal(result.observations.Jan[0].count, 0); assert.equal(result.heatmapData.Jan[0], null);
});
test("wind rose exports existing exact bin counts and plotted percentages", () => {
  const direction = { daily: [{ d: "2024-01-01", v: 0 }, { d: "2024-01-02", v: 90 }, { d: "2024-01-03", v: 0 }] };
  const speed = { daily: [{ d: "2024-01-01", v: 2 }, { d: "2024-01-02", v: 6 }, { d: "2024-01-03", v: 2 }] };
  const before = JSON.stringify([direction, speed]); const result = processWindData(direction, speed); const rows = windRoseRows(result);
  assert.equal(rows.length, 112); assert.equal(rows.reduce((sum, r) => sum + r.count, 0), 3);
  assert.deepEqual(rows.find(r => r.direction === "N" && r.bin === "1.0 - 3.0"), { direction: "N", bin: "1.0 - 3.0", count: 2, percentage: 66.67, directionMean: 2 });
  assert.ok(csvText(rows, windRoseColumns).includes("N,1.0 - 3.0,2,66.67,2"));
  assert.equal(JSON.stringify([direction, speed]), before);
});
test("month/year export separates measured zero, excluded sample and absent month", () => {
  const daily = [...Array.from({ length: 10 }, (_, i) => ({ d: `2024-01-${String(i + 1).padStart(2, "0")}`, v: 0 })), { d: "2024-02-01", v: 8 }];
  const result = calculateMonthYearGrid(daily), rows = monthYearRows(result);
  assert.equal(result.cells.size, 1); assert.equal(result.skippedCells, 1); assert.equal(rows.length, 12);
  assert.deepEqual(rows.slice(0, 3), [
    { year: 2024, month: 1, value: 0, observedDays: 10, status: "observed" },
    { year: 2024, month: 2, value: null, observedDays: 1, status: "excluded" },
    { year: 2024, month: 3, value: null, observedDays: 0, status: "missing" },
  ]);
});
test("absent monthly readings never become a measured zero mean", () => {
  const daily = Array.from({ length: 12 }, (_, i) => ({ d: `2024-01-${String(i + 1).padStart(2, "0")}`, v: i % 2 ? null : " " }));
  assert.equal(calculateMonthYearGrid(daily).cells.size, 0);
});
test("a wind rose without paired records has no defined percentage", () => {
  const result = processWindData({ daily: [{ d: "2024-01-01", v: 0 }] }, { daily: [{ d: "2024-01-02", v: 2 }] });
  assert.ok(windRoseRows(result).every(row => row.count === 0 && row.percentage === null));
});
test("all monthly matrices retain nullable counts and month/year coverage flags", () => {
  const rows = matrixRows([{ year: 2024, availableStart: "2024-02-12", availableEnd: "2024-12-31", isPartial: true,
    months: [{ month: 1, count: null, available: false, isPartial: false }, { month: 2, count: 0, available: true, isPartial: true }] }]);
  assert.equal(rows[0].count, null); assert.equal(rows[0].available, false);
  assert.equal(rows[1].count, 0); assert.equal(rows[1].partial, true); assert.equal(rows[1].partialYear, true);
});
test("dry timeline exports only displayed runs plus explicit coverage, not hidden short runs", () => {
  const rows = dryTimelineRows([{ year: 2024, isPartial: true, availableStart: "2024-04-02", availableEnd: "2024-09-30", runs: [
    { startDate: "2024-04-02", endDate: "2024-04-05", length: 4 }, { startDate: "2024-05-01", endDate: "2024-05-07", length: 7 },
  ] }]);
  assert.equal(rows.length, 2); assert.equal(rows[0].type, "Coverage"); assert.equal(rows[0].days, undefined);
  assert.equal(rows[1].start, "2024-05-01"); assert.equal(rows[1].days, 7); assert.equal(rows[1].partial, true);
});
test("compound timeline preserves event dates, temperatures and nested membership", () => {
  const rows = compoundTimelineRows([{ year: 2024, availableCommonStart: "2024-04-01", availableCommonEnd: "2024-09-30", isPartial: false,
    dryRuns: [{ startDate: "2024-04-01", endDate: "2024-04-07", length: 7 }], hotDayDates: ["2024-04-03", "2024-04-20"], hotDayTemperatures: { "2024-04-03": 32.4, "2024-04-20": 31 }, compound5Dates: ["2024-04-03"], compound7Dates: ["2024-04-03"] }]);
  assert.equal(rows.length, 4); assert.equal(rows[1].days, 7);
  assert.equal(rows[2].temperature, 32.4); assert.equal(rows[2].inside5, true); assert.equal(rows[2].inside7, true);
  assert.equal(rows[3].inside5, false); assert.equal(rows[3].inside7, false);
});
test("actual custom wind-risk SVG has EN/SQ controls, explicit missing marks and a lazy table", () => {
  const Chart = component("WindRiskHeatmap").WindRiskHeatmap;
  for (const lang of ["en", "sq"]) {
    const t = makeT(lang); const html = renderToStaticMarkup(React.createElement(Chart, { speedData: { hourly }, t }));
    assert.ok(html.includes(t("downloadCsv"))); assert.ok(html.includes(t("downloadPng")));
    assert.ok(html.includes(t("viewChartData"))); assert.ok(html.includes(t("chartStatusMissing")));
    assert.match(html, /role="img"/); assert.match(html, /×/); assert.ok(!html.includes("<tbody>"));
  }
});
test("actual month/year SVG renders distinct excluded and missing symbols", () => {
  const Chart = component("MonthYearHeatmap").default;
  const daily = [...Array.from({ length: 10 }, (_, i) => ({ d: `2024-01-${String(i + 1).padStart(2, "0")}`, v: 5 })), { d: "2024-02-01", v: 8 }];
  const html = renderToStaticMarkup(React.createElement(Chart, { measurement: { daily }, title: "Monthly mean", t: makeT("en"), unit: "W/m²" }));
  assert.match(html, />×<\/text>/); assert.match(html, />—<\/text>/); assert.match(html, /Download PNG/);
});
test("custom cell text meets AA contrast throughout the heatmap ramp", () => {
  const luminance = color => { const rgb = color.startsWith("#") ? [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)) : color.match(/[\d.]+/g).map(Number); const c=rgb.map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722; };
  const fills = Array.from({ length: 101 }, (_, i) => rampColor(i / 100)).concat(["#0466cc", "#4da6ff", "#99ccff", "#ffcc99", "#ff9933", "#cc0000", "#397f99", "#71adbf"]);
  for (const fill of fills) { const values=[luminance(fill),luminance(contrastingText(fill))].sort((a,b)=>a-b);assert.ok((values[1]+.05)/(values[0]+.05)>=4.5,fill); }
  assert.equal(readableTextColor(.75), contrastingText(rampColor(.75)));
});
