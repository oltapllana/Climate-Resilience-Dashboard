import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildSync } from "esbuild";
import { csvText, exportFilename } from "./chartExport.js";
import { makeT } from "../i18n.js";
import { updateDocumentTitle, documentMetadata, PUBLIC_URL, SOCIAL_IMAGE_URL } from "./locale.js";
import { SERIES_DASHES } from "./chartPalette.js";

function component(name) {
  const filename = fileURLToPath(new URL(`../components/${name}.jsx`, import.meta.url));
  const { outputFiles } = buildSync({ entryPoints: [filename], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", jsx: "automatic" });
  const module = new Module(filename); module.filename = filename;
  module.paths = Module._nodeModulePaths(fileURLToPath(new URL("../../", import.meta.url)));
  module._compile(outputFiles[0].text, filename); return module.exports;
}
test("CSV quotes text, escapes quotes/newlines and preserves UTF-8", () => {
  assert.equal(csvText([{a:'Podujevë, "city"\nstation',b:268.4}], [{key:'a',label:'Station'},{key:'b',label:'Rainfall (mm)'}]), '\uFEFFStation,Rainfall (mm)\r\n"Podujevë, ""city""\nstation",268.4');
});
test("CSV retains missing values, zero, precision and explicit estimated flags", () => {
  assert.equal(csvText([{v:null,est:false},{v:0,est:false},{v:1.23456789,est:true},{v:NaN,est:false}], [{key:'v'},{key:'est'}]), '\uFEFFv,est\r\n,false\r\n0,false\r\n1.23456789,true\r\n,false');
});
test("CSV exports only selected columns and guards spreadsheet formulas in text", () => {
  const text=csvText([{name:'=SUM(1)',v:-2.5,debug:'secret'}],[{key:'name'},{key:'v'},{key:'unit',value:()=> 'mm'}]);
  assert.equal(text,"\uFEFFname,v,unit\r\n'=SUM(1),-2.5,mm");
  assert.ok(!text.includes('secret'));
});
test("filenames are deterministic and safe for station and indicator names", () => {
  assert.equal(exportFilename('Batllavë (reservoir)','Monthly rainfall','csv'),'podujeva_batllave_reservoir_monthly_rainfall.csv');
  assert.equal(exportFilename('../Podujevë','Rain / wind','png'),'podujeva_podujeve_rain_wind.png');
});
test("actual monthly chart provides displayed public columns, no rendering offsets", () => {
  const src=fs.readFileSync(new URL('../components/MonthlyRainfallIndicator.jsx',import.meta.url),'utf8');
  const schema=JSON.parse(src.match(/columns=\{(\[.*?\])\}/)[1]);
  assert.deepEqual(schema.map(c=>c.key),['label','mean','q1','q3','lowest','highest','yearCount','years']);
  assert.equal(csvText([{label:'Jan',mean:268.4,q1:null,q3:null,lowest:268.4,highest:268.4,yearCount:1,years:[2024],quartileMid:999}],schema).split('\r\n')[1],'Jan,268.4,,,268.4,268.4,1,2024');
});
test("actual chart renders named native CSV/PNG controls and data disclosure in EN/SQ", () => {
  const Chart=component('MonthlyRainfallIndicator').default;
  const measurement={hourly:[{d:'2024-01-01T00:00:00',v:134.2},{d:'2024-01-02T00:00:00',v:134.2},{d:'2024-01-31T23:00:00',v:0}]};
  for(const lang of ['en','sq']) {
    const t=makeT(lang);const html=renderToStaticMarkup(React.createElement(Chart,{measurement,t}));
    assert.ok(html.includes(t('downloadCsv')));assert.ok(html.includes(t('downloadPng')));
    assert.ok(html.includes(t('viewChartData')));assert.match(html,/aria-labelledby=/);
    assert.ok(!html.includes('<tbody>'),'large tables render only on demand');
  }
});
test("runtime EN → SQ → EN updates metadata and html language without duplicates", () => {
  const metas=new Map();const target={documentElement:{},head:{append(el){metas.set(el.key,el);}},
    createElement(){return {setAttribute(k,v){if(k==='name'||k==='property')this.key=v;else this[k]=v;}};},
    querySelector(selector){return metas.get(selector.match(/="([^"]+)"/)[1]);}};
  for(const lang of ['en','sq','en']) {
    const t=makeT(lang);updateDocumentTitle(t,target);
    assert.equal(target.title,t('appTitle'));assert.equal(target.documentElement.lang,lang);
    assert.equal(metas.get('description').content,t('metaDescription'));
    assert.equal(metas.get('og:title').content,t('appTitle'));
    assert.equal(metas.get('og:description').content,t('metaDescription'));
    assert.equal(metas.get('og:locale').content,lang==='sq'?'sq_AL':'en_GB');
    assert.equal(metas.get('og:url').content,PUBLIC_URL);
    assert.equal(metas.get('og:image').content,SOCIAL_IMAGE_URL);
    assert.equal(metas.get('twitter:card').content,'summary');
    assert.equal(metas.get('twitter:description').content,t('metaDescription'));
    assert.equal(metas.size,14);
  }
  assert.ok(documentMetadata(makeT('en')).some(m=>m.property==='og:url'&&m.content===PUBLIC_URL));
  assert.ok(documentMetadata(makeT('en')).some(m=>m.property==='og:image'&&m.content===SOCIAL_IMAGE_URL));
});
test("default link-preview metadata is present in source HTML before JavaScript runs", () => {
  const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
  assert.match(html,/<meta name="description"/);
  assert.match(html,/<meta property="og:url" content="https:\/\/climate-dashboard-podujeva\.onrender\.com"/);
  assert.match(html,/<meta property="og:image" content="https:\/\/climate-dashboard-podujeva\.onrender\.com\/favicon\.svg"/);
  assert.match(html,/<meta name="twitter:card" content="summary"/);
});
test("comparison lines have non-colour styles and estimated bars use hatching", () => {
  assert.equal(new Set(SERIES_DASHES).size,6);
  const src=fs.readFileSync(new URL('../components/LandslideRainfallIndicator.jsx',import.meta.url),'utf8');
  assert.match(src,/strokeDasharray=\{SERIES_DASHES/);
  assert.match(src,/function SeriesMarker/);
  for(const shape of ['<circle','<rect','<polygon','<path']) assert.ok(src.includes(shape),shape);
  const charts=fs.readFileSync(new URL('../components/Charts.jsx',import.meta.url),'utf8');
  assert.match(charts,/<pattern id=\{estimatedPattern\}/);assert.match(charts,/d.est \? `url\(#/);
  const rain=fs.readFileSync(new URL('../components/RainyDaysIndicator.jsx',import.meta.url),'utf8');
  assert.match(rain,/<pattern key=\{band.id\}/);assert.match(rain,/content=\{<SegmentLabel/);
});

test("long indicator methodology is collapsed consistently", () => {
  for(const name of ['PrecipitationExtremesIndicator','TopRainfallDays','HotDaysInDrySpellsIndicator','SnowfallIndicator','HeavySnowfallIndicator','FreezeThawCyclesIndicator']) {
    const src=fs.readFileSync(new URL(`../components/${name}.jsx`,import.meta.url),'utf8');
    assert.match(src,/import Methodology from/);assert.match(src,/<Methodology t=\{t\}>/);
  }
});
test("targeted text/control colours meet AA contrast on their backgrounds", () => {
  const luminance=hex=>{const c=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
  for(const [a,b] of [['ffffff','2f7d32'],['556170','f4f7f4'],['334155','ffffff'],['155b8c','e3f0fa'],['17242b','ffffff']]) {
    const [lo,hi]=[luminance(a),luminance(b)].sort((x,y)=>x-y);assert.ok((hi+.05)/(lo+.05)>=4.5,`${a}/${b}`);
  }
});
