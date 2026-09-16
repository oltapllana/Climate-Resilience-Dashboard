import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildSync } from "esbuild";
import { makeT, STRINGS } from "../i18n.js";
import { formatNumber, updateDocumentTitle } from "./locale.js";
import { formatForAxis } from "./chartAxis.js";
import { orderedMeasurementIds } from "./measurementOrder.js";

// Bundle the actual JSX for server rendering without writing temporary fixtures.
function component(name) {
  const filename = fileURLToPath(new URL(`../components/${name}.jsx`, import.meta.url));
  const { outputFiles } = buildSync({ entryPoints: [filename], bundle: true, write: false,
    platform: "node", format: "cjs", packages: "external", jsx: "automatic" });
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(fileURLToPath(new URL("../../", import.meta.url)));
  module._compile(outputFiles[0].text, filename);
  return module.exports;
}

test("decimal separators and intended precision follow the selected locale", () => {
  assert.equal(formatNumber(268.4, "en"), "268.4");
  assert.equal(formatNumber(268.4, "sq"), "268,4");
  for (const [lang, separator] of [["en", "."], ["sq", ","]]) {
    const t = makeT(lang);
    assert.equal(t.number(99.9), `99${separator}9`);
    assert.equal(t.number(-0.004, { minimumFractionDigits: 3, maximumFractionDigits: 3 }), `-0${separator}004`);
    assert.equal(t.number(12, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), `12${separator}00`);
    assert.equal(formatForAxis(1.25, 2, lang), `1${separator}25`);
    assert.equal(formatForAxis(-0.001, 1, lang), "≈0");
    assert.equal(t.number(0), "0");
    assert.equal(t.number(null), "—");
    assert.equal(t.number(NaN), "—");
  }
});

test("numeric translation parameters localise without changing dates or version strings", () => {
  const t = makeT("sq");
  assert.match(t("percentileThresholdValue", { value: 268.4 }), /268,4/);
  assert.match(t("percentileThresholdValue", { value: "2026.09.12 / v1.0" }), /2026\.09\.12 \/ v1\.0/);
  assert.equal(t("yearCount", { count: 2026 }), "2026 vite");
});

test("actual monthly rainfall callout renders dynamic 268.4 mm in EN and 268,4 mm in SQ", () => {
  const MonthlyRainfall = component("MonthlyRainfallIndicator").default;
  const measurement = { hourly: [{ d: "2024-01-01T00:00:00", v: 134.2 }, { d: "2024-01-02T00:00:00", v: 134.2 }, { d: "2024-01-31T23:00:00", v: 0 }] };
  const before = JSON.stringify(measurement);
  for (const [lang, value] of [["en", "268.4"], ["sq", "268,4"]]) {
    const html = renderToStaticMarkup(React.createElement(MonthlyRainfall, { measurement, t: makeT(lang) }));
    assert.ok(html.includes(`(${value} mm)`), html);
    assert.match(html, /indicator-callout/);
    assert.ok(html.includes(makeT(lang)("rainfallWhiskerNote", { n: 3 })));
  }
  assert.equal(JSON.stringify(measurement), before);
});

test("measurement order is based on IDs, independent of locale labels and insertion order", () => {
  const measurements = {
    rain_intensity: { label_en: "Rainfall intensity", label_sq: "Intensiteti i reshjeve" },
    rainfall: { label_en: "Rainfall", label_sq: "Reshjet" },
    salinity: {},
  };
  for (const [lang, labels] of [["en", ["Rainfall", "Rainfall intensity"]], ["sq", ["Reshjet", "Intensiteti i reshjeve"]]]) {
    assert.deepEqual(orderedMeasurementIds(measurements, new Set(["salinity"])).map(id => measurements[id][`label_${lang}`]), labels);
  }
});

test("actual Dashboard selector keeps rainfall order and the selected measurement in both languages", () => {
  const Dashboard = component("Dashboard").default;
  const base = { stats: { count: 2, overall: 268.4, min: 0, max: 268.4, start: "2024-01-01", end: "2024-01-31" }, monthly: [], yearly: [], climatology: [] };
  const data = { name_en: "Test", name_sq: "Test", measurements: {
    rain_intensity: { ...base, label_en: "Rainfall intensity", label_sq: "Intensiteti i reshjeve", unit: "mm/h" },
    rainfall: { ...base, label_en: "Rainfall", label_sq: "Reshjet", unit: "mm" },
  } };
  for (const [lang, first, second] of [["en", "Rainfall", "Rainfall intensity"], ["sq", "Reshjet", "Intensiteti i reshjeve"]]) {
    const html = renderToStaticMarkup(React.createElement(Dashboard, { data, lang, measId: "rain_intensity", setMeasId() {}, t: makeT(lang) }));
    const buttons = [...html.matchAll(/<button[^>]*class="([^"]*)"[^>]*>([^<]+)<\/button>/g)];
    assert.deepEqual(buttons.filter(m => [first, second].includes(m[2])).map(m => m[2]), [first, second]);
    assert.ok(buttons.some(m => m[2] === second && /active/.test(m[1])), html);
    assert.ok(html.includes(lang === "sq" ? "268,4" : "268.4"));
  }
});

test("document title switches EN → SQ → EN using the same translation resources", () => {
  const document = { title: "Initial title" };
  for (const lang of ["en", "sq", "en"]) {
    updateDocumentTitle(makeT(lang), document);
    assert.equal(document.title, STRINGS[lang].appTitle);
  }
  const source = fs.readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
  assert.match(source, /useEffect\(\(\) => \{ updateDocumentTitle\(t\); \}, \[t\]\)/);
});

test("reviewed Albanian terminology and formal instructions remain consistent", () => {
  const sq = STRINGS.sq;
  assert.equal(sq.appTitle, "Paneli i Qëndrueshmërisë Klimatike – Podujevë");
  assert.match(sq.dualAxisNote, /^Shtyllat/);
  assert.match(sq.monthlyRainfallExplanation, /kuartilin e poshtëm.*kuartili i sipërm/);
  assert.match(sq.monthlyExtremesAssumption, /kutiza informuese/);
  assert.match(sq.importHint, /^Ngarkoni/);
  assert.equal(sq.signIn, "Kyçuni");
  assert.equal(sq.signOut, "Dilni");
  assert.equal(sq.removeStation, "Hiqni");
  assert.match(sq.drySpellsChartNote, /kaloni mbi bllok/);
  assert.doesNotMatch(Object.values(sq).flat().join("\n"), /\b[Bb]arrat\b|çerekshm|logues|tooltip|Trajtoji|mos i krahaso\b/);
});
