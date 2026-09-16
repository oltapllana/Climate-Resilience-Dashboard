import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transformSync } from "esbuild";
import { makeT, STRINGS } from "../i18n.js";

test("Institutional titles are translated without changing geographic names", () => {
  assert.equal(makeT("en")("appTitle"), "Podujeva Climate Resilience Dashboard");
  assert.equal(makeT("sq")("appTitle"), "Paneli i Qëndrueshmërisë Klimatike – Podujevë");
  assert.equal(makeT("en")("boundary"), "Podujevë municipality");
  const html = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.ok(html.includes(`<title>${makeT("en")("appTitle")}</title>`));
});

test("day and year counts use singular, plural, and zero forms in both locales", () => {
  for (const [lang, day, days, year, years] of [["en", "day", "days", "year", "years"], ["sq", "ditë", "ditë", "vit", "vite"]]) {
    const t = makeT(lang);
    for (const count of [0, 1, 2, 54]) {
      assert.equal(t("dayCount", { count }), `${count} ${count === 1 ? day : days}`);
      assert.equal(t("yearCount", { count }), `${count} ${count === 1 ? year : years}`);
    }
    assert.equal(t("dayCount", { count: "1" }), `1 ${day}`);
  }
});

test("threshold summaries interpolate current counts without QA wording", () => {
  for (const lang of ["en", "sq"]) {
    const t = makeT(lang);
    const summary = (days, years) => t("landslideThresholdTriggered", {
      days: t("dayCount", { count: days }), years: t("yearCount", { count: years }), duration: 2, ratio: 120,
    });
    assert.ok(summary(1, 1).includes(t("dayCount", { count: 1 })));
    assert.ok(summary(54, 2).includes(t("yearCount", { count: 2 })));
    assert.notEqual(summary(1, 1), summary(54, 2));
    assert.doesNotMatch(summary(54, 2), /\{\w+\}|Threshold check|Kontrolli i pragut|\(s\)/);
    assert.match(summary(54, 2), /120%/);
  }
});

test("reference sample copy agrees with one and several values and years", () => {
  for (const lang of ["en", "sq"]) {
    const t = makeT(lang);
    for (const count of [1, 2]) {
      const text = t("windowSampleSize", {
        values: t("referenceValueCount", { count }), years: t("referenceYearCount", { count }),
      });
      assert.ok(text.includes(t("referenceValueCount", { count })));
      assert.ok(text.includes(t("referenceYearCount", { count })));
      assert.doesNotMatch(text, /\{\w+\}|\(s\)|vit\(e\)/);
    }
  }
  assert.equal(makeT("en")("completeYearsCount", { count: 1 }), "1 fully observed year");
  assert.equal(makeT("sq")("completeYearsCount", { count: 1 }), "1 vit i vëzhguar plotësisht");
});

test("new translation parameters preserve old array, fallback, and replacement callers", () => {
  const t = makeT("en");
  assert.deepEqual(t("months"), STRINGS.en.months);
  assert.equal(t("missingKey"), "missingKey");
  assert.equal(makeT("unknown")("dayCount", { count: 2 }), "2 days");
  assert.match(t("percentileThresholdValue").replace("{value}", "122"), /122/);
  assert.equal(t("heatWaveCount", { count: 1 }), "1 heat wave");
  assert.equal(t("coldPeriodCount", { count: 2 }), "2 cold periods");
});

test("reviewed public copy has no optional-plural or dataset-specific date placeholders", () => {
  for (const lang of ["en", "sq"]) {
    const t = makeT(lang);
    for (const key of ["solarTrendTitle", "freezeThawMethodology", "heavySnowMethodology", "snowfallMethodology", "hotDryMethodology"]) {
      assert.doesNotMatch(t(key), /2021|2026|Shajkoc|Six events|Gjashtë ngjarje/);
    }
    for (const value of Object.values(STRINGS[lang])) {
      if (typeof value === "string") assert.doesNotMatch(value, /day\(s\)|year\(s\)|vit\(e\)/);
    }
  }
});

test("existing chart headings use sentence case and preserve proper nouns", () => {
  const t = makeT("en");
  assert.equal(t("evolution"), "Annual trend");
  assert.equal(t("anomalies"), "Monthly anomalies");
  assert.equal(t("windRose"), "Wind rose");
  assert.equal(makeT("sq")("evolution"), "Trendi vjetor");
  assert.match(t("annualTrendTitleTds"), /TDS/);
});

test("methodology uses a closed native disclosure with localised summary and retained content", () => {
  const source = fs.readFileSync(new URL("../components/Methodology.jsx", import.meta.url), "utf8");
  const { code } = transformSync(source.replace("export default function", "function"), { loader: "jsx" });
  const Methodology = new Function("React", `${code}; return Methodology;`)(React);
  for (const lang of ["en", "sq"]) {
    const t = makeT(lang);
    const markup = renderToStaticMarkup(React.createElement(Methodology, { t }, React.createElement("p", null, t("landslideThresholdCaveat"))));
    assert.match(markup, /^<details class="chart-methodology"><summary>/);
    assert.ok(markup.includes(`<summary>${t("methodologyAndLimitations")}</summary>`));
    assert.doesNotMatch(markup, /<details[^>]*\bopen\b/);
    assert.ok(markup.includes(t("landslideThresholdCaveat")));
  }
});
