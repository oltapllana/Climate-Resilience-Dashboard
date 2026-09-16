import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildSync } from "esbuild";
import { makeT } from "../i18n.js";
import { initialMapBounds, createInitialViewController } from "./mapViewPolicy.js";
import { latestObservationDate } from "./footerMetadata.js";

const boundary = JSON.parse(fs.readFileSync(new URL("../../public/podujeve-boundary.geojson", import.meta.url), "utf8"));
function component(name) {
  const filename = fileURLToPath(new URL(`../components/${name}.jsx`, import.meta.url));
  const { outputFiles } = buildSync({ entryPoints: [filename], bundle: true, write: false,
    platform: "node", format: "cjs", packages: "external", jsx: "automatic" });
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(fileURLToPath(new URL("../../", import.meta.url)));
  module._compile(outputFiles[0].text, filename);
  return module.exports.default;
}

test("initial map bounds enclose the actual municipality geometry, ahead of unrelated station bounds", () => {
  const bounds = initialMapBounds(boundary, [{ lat: 0, lon: 0 }]);
  const [[south, west], [north, east]] = bounds;
  for (const ring of boundary.geometry.coordinates) {
    for (const [lon, lat] of ring) assert.ok(lat >= south && lat <= north && lon >= west && lon <= east);
  }
  assert.ok(south > 42 && north < 44 && west > 20 && east < 22);
  assert.ok(south <= 42.911 && north >= 42.911 && west <= 21.193 && east >= 21.193);
});

test("missing boundary falls back to valid visible station coordinates, or leaves the existing view", () => {
  assert.deepEqual(initialMapBounds(null, [{ lat: 42.9, lon: 21.1 }, { lat: 43, lon: 21.2 }, { lat: NaN, lon: 20 }]), [[42.9,21.1],[43,21.2]]);
  assert.equal(initialMapBounds(null, []), null);
  assert.equal(initialMapBounds({ type: "Polygon", coordinates: [] }, [{ lat: 500, lon: 21 }]), null);
});

test("initial fit waits for boundary loading and fits just once despite later data or locale renders", () => {
  const calls = [];
  const map = { fitBounds: (...args) => calls.push(args) };
  const controller = createInitialViewController();
  assert.equal(controller.fit(map, null, [{ lat: 42.9, lon: 21.1 }], false), false);
  assert.equal(controller.fit(map, boundary, [], true), true);
  assert.equal(controller.fit(map, boundary, [{ lat: 0, lon: 0 }], true), false);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][0], initialMapBounds(boundary));
  assert.equal(calls[0][1].animate, false);
});

test("user interaction before a delayed boundary response prevents automatic fitting", () => {
  const controller = createInitialViewController();
  controller.interact();
  assert.equal(controller.fit({ fitBounds() { assert.fail("must preserve user view"); } }, boundary, [], true), false);
});

test("station picker renders a named native single-selection radio group in EN and SQ", () => {
  const ConfigPanel = component("ConfigPanel");
  const markers = [{ id: "a", name_en: "Station A", name_sq: "Stacioni A", type: "meteo", measCount: 2 }, { id: "b", name_en: "Station B", name_sq: "Stacioni B", type: "hydro", measCount: 1, imported: true }];
  for (const lang of ["en", "sq"]) {
    const t = makeT(lang);
    const html = renderToStaticMarkup(React.createElement(ConfigPanel, { markers, selectedId: "b", lang, t, onSelect() {}, removeImported() {}, canUpload: false }));
    const radios = [...html.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map(m => m[0]);
    assert.equal(radios.length, 2);
    assert.equal(radios.filter(r => r.includes('checked=""')).length, 1);
    assert.ok(radios[1].includes('value="b"') && radios[1].includes('checked=""'));
    assert.equal(radios[0].match(/name="([^"]+)"/)[1], radios[1].match(/name="([^"]+)"/)[1]);
    for (const radio of radios) assert.ok(html.includes(`id="${radio.match(/aria-labelledby="([^"]+)"/)[1]}"`));
    assert.ok(html.includes(`<legend class="cfg-label">${t("station")}</legend>`));
    assert.equal((html.match(/class="remove-btn"/g) ?? []).length, 1);
    assert.ok(html.includes(t("removeStationNamed", { station: markers[1][`name_${lang}`] })));
    assert.ok(!html.includes("✕"));
  }
});

test("latest observation is the maximum valid loaded observation date, not database creation time", () => {
  const stations = [{ created_at: "2030-01-01", measurements: { a: { stats: { end: "2024-12-31" } }, b: { stats: { end: "2025-02-03" } } } }, { measurements: { a: { stats: { end: "2025-02-30" } }, b: { stats: { end: "invalid" } } } }];
  assert.equal(latestObservationDate(stations), "2025-02-03");
  assert.equal(latestObservationDate([]), null);
  assert.equal(latestObservationDate([{ measurements: {} }]), null);
});

test("footer renders supported EN/SQ metadata, package version and accurate observation scope", () => {
  const Footer = component("InstitutionalFooter");
  const pkg = JSON.parse(fs.readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  for (const lang of ["en", "sq"]) {
    const t = makeT(lang);
    const html = renderToStaticMarkup(React.createElement(Footer, { stations: [{ measurements: { rain: { stats: { end: "2025-02-03" } } } }], t }));
    assert.match(html, /^<footer/);
    assert.ok(html.includes(t("footerSources")) && html.includes(t("footerObservationScope")));
    assert.ok(html.includes(`<time dateTime="2025-02-03">2025-02-03</time>`));
    assert.ok(html.includes(`<dd>${pkg.version}</dd>`));
    assert.ok(html.includes('href="https://www.openstreetmap.org/copyright"'));
    assert.doesNotMatch(html, /mailto:|<img|href="#|href="\/about|href="\/methodology/);
    const empty = renderToStaticMarkup(React.createElement(Footer, { stations: [], t }));
    assert.ok(!empty.includes("<time"));
  }
});
