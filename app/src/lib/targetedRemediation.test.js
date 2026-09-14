import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { makeT } from '../i18n.js';
import { effectiveClimatology } from './climatology.js';
import { calculateRainyDays, bandOf } from './rainyDays.js';
import { csvText } from './chartExport.js';
import { CHART_PALETTE } from './chartPalette.js';

// Capture the real component's public frame props, without a layout engine.
// This verifies data/schema wiring, not browser rendering or PNG downloads.
const cache = new Map();
async function render(name, props, exported = 'default') {
  if (!cache.has(name)) {
    const filename = fileURLToPath(new URL(`../components/${name}.jsx`, import.meta.url));
    const result = await build({ entryPoints: [filename], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', logLevel: 'silent', plugins: [{ name: 'capture-frame', setup(b) {
      b.onLoad({ filter: /[\\/]ChartFrame\.jsx$/ }, () => ({ contents: `import React from 'react'; export const ChartContext=React.createContext({}); export default function Frame(props){globalThis.__remediationFrames.push(props);return null;}`, loader: 'jsx' }));
    }}] });
    const mod = new Module(filename); mod.filename = filename;
    mod.paths = Module._nodeModulePaths(fileURLToPath(new URL('../../', import.meta.url)));
    mod._compile(result.outputFiles[0].text, filename); cache.set(name, mod.exports);
  }
  globalThis.__remediationFrames = [];
  const html = renderToStaticMarkup(React.createElement(cache.get(name)[exported], props));
  return { html, frames: globalThis.__remediationFrames };
}
const keys = frame => frame.columns.map(c => c.key);
const elements = node => React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(elements)] : [];
const base = { stats: {count:2,overall:2,min:0,max:4,start:'2024-01-01',end:'2025-12-31'}, daily:[], hourly:[], climatology:[], monthly:[], unit:'mm', kind:'sum',label_en:'Rainfall',label_sq:'Reshjet' };
const rain = [{d:'2024-01-01T00:00:00',v:2},{d:'2024-01-02T00:00:00',v:40}];

test('F1: rainfall monthly evolution stays absent for one, two and three complete calendar years', async () => {
  for (const years of [1,2,3]) for (const id of ['rainfall','rain_intensity']) {
    const monthly=Array.from({length:12*years},(_,i)=>({m:`${2023+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`,v:10}));
    const {frames}=await render('Dashboard',{data:{name_en:'Test',measurements:{[id]:{...base,monthly}}},measId:id,lang:'en',t:makeT('en'),setMeasId(){}});
    assert.ok(!frames.some(f=>f.indicator==='monthly-evolution'));
  }
  const {frames}=await render('Dashboard',{data:{name_en:'Test',measurements:{water_temp:{...base,unit:'°C',kind:'avg',daily:[{d:'2024-01-01',v:3},{d:'2024-12-31',v:5},{d:'2025-01-01',v:4},{d:'2025-12-31',v:6}]}}},measId:'water_temp',lang:'en',t:makeT('en'),setMeasId(){}});
  assert.ok(frames.some(f=>f.indicator==='annual-trend-chart-1'));
});
test('F2: climatology retains twelve categories and separates observed zero from missing', async () => {
  const series={...base,climatology:[{month:1,v:0}]};
  const rows=effectiveClimatology(series);
  assert.equal(rows.length,12); assert.equal(rows[0].v,0); assert.equal(rows[0].available,true);
  assert.equal(rows[1].v,null); assert.equal(rows[1].available,false);
  for(const lang of ['en','sq']) {
    const {frames}=await render('Charts',{series,t:makeT(lang),unit:'mm',isSum:true},'ClimatologyChart');
    assert.equal(frames[0].rows.length,12); assert.ok(keys(frames[0]).includes('available'));
    assert.ok(csvText(frames[0].rows,frames[0].columns).includes(',false'));
    assert.ok(elements(frames[0].children).some(e=>e.props.dataKey==='month'&&e.props.interval===0));
  }
});
test('F2: wholly absent rainfall months differ from observed zero, including interior gaps', async () => {
  const input=[...rain,{d:'2024-03-01T00:00:00',v:0}];
  const result=calculateRainyDays(input);
  assert.equal(result.monthly[1].rainDays,null); assert.equal(result.monthly[1].available,false);
  assert.equal(result.monthly[2].rainDays,0); assert.equal(result.monthly[2].available,true);
  const observedFebruary=calculateRainyDays([...input,{d:'2024-02-01T00:00:00',v:0}]).monthly[1];
  assert.equal(observedFebruary.rainDays,0); assert.equal(observedFebruary.available,true);
  const {frames}=await render('RainyDaysIndicator',{measurement:{hourly:input},t:makeT('en')});
  const frame=frames.find(f=>f.indicator==='rainy-days-indicator-2');
  assert.ok(keys(frame).includes('available')); assert.ok(keys(frame).includes('observedDays'));
  assert.equal(frame.rows[1].rainDays,null); assert.equal(frame.rows[2].rainDays,0);
  const csv=csvText(frame.rows,frame.columns);
  assert.ok(csv.includes('Feb,,,,0,,0,false'));
  assert.ok(csv.includes('Mar,0,0,0,1,2024,1,true'));
  const tooltip=elements(frame.children).find(e=>e.props.content?.props?.t);
  assert.equal(tooltip.props.filterNull,false);
  const missingTip=renderToStaticMarkup(React.cloneElement(tooltip.props.content,{active:true,payload:[{payload:frame.rows[1]}]}));
  assert.ok(missingTip.includes(makeT('en')('chartMissingValue')));
});
test('F3: disjoint calendar years do not establish monthly anomaly history', async () => {
  const series={monthly:[{m:'2024-12',v:4},{m:'2025-01',v:8}],climatology:[{month:12,v:4},{month:1,v:8}]};
  const {frames}=await render('Charts',{series,t:makeT('en'),unit:'mm'},'AnomaliesChart');
  assert.ok(!frames.length || frames[0].rows.every(r=>r.anom==null));
});
test('F3: anomaly eligibility follows each month, retaining genuine zero anomalies', async () => {
  const series={monthly:[{m:'2024-01',v:8},{m:'2025-01',v:8},{m:'2025-02',v:9}],climatology:[{month:1,v:8},{month:2,v:9}]};
  const {frames}=await render('Charts',{series,t:makeT('sq'),unit:'mm'},'AnomaliesChart');
  assert.deepEqual(frames[0].rows.map(r=>r.anom),[0,0,null]);
});
test('F3: supported repeated months retain the existing departure formula', async () => {
  const series={monthly:[{m:'2024-01',v:4},{m:'2025-01',v:8},{m:'2024-02',v:10},{m:'2025-02',v:14}],climatology:[{month:1,v:6},{month:2,v:12}]};
  const {frames}=await render('Charts',{series,t:makeT('en'),unit:'mm'},'AnomaliesChart');
  assert.deepEqual(frames[0].rows.map(r=>r.anom),[-2,2,-2,2]);
});
test('F4: 2 mm plus 40 mm retains definitions and explicit public labels in both languages', async () => {
  const result=calculateRainyDays(rain); assert.equal(result.yearly[0].rainDays,2); assert.equal(result.yearly[0].classifiedDays,1); assert.equal(result.monthly[0].rainDays,1);
  for(const lang of ['en','sq']) {
    const t=makeT(lang); const {html,frames}=await render('RainyDaysIndicator',{measurement:{hourly:rain},t});
    assert.ok(t('rainyDaysTitle').includes('30')); assert.ok(t('rainyDaysMonthlyTitle').includes('30'));
    assert.ok(t('rainDays').includes('1')); assert.ok(html.includes('30'));
    assert.match(frames[1].columns.find(c=>c.key==='rainDays').label,/30/);
  }
});
test('F5: rainfall alternatives include public totals, coverage and contributors', async () => {
  const {frames}=await render('RainyDaysIndicator',{measurement:{hourly:rain},t:makeT('en')});
  for(const key of ['light','rainDays','observedDays','availableStart','availableEnd']) assert.ok(keys(frames[0]).includes(key),key);
  for(const key of ['years','yearCount','observedDays','available']) assert.ok(keys(frames[1]).includes(key),key);
});
test('F5: temperature export retains observed days', async () => {
  const {frames}=await render('MonthlyTemperatureTrend',{measurement:{hourly:[{d:'2024-01-01T00:00:00',v:5}]},t:makeT('en')});
  assert.ok(keys(frames[0]).includes('observedDays'));
});
test('F5: mean rainfall export calls month contributors contributing years', async () => {
  const {frames}=await render('MonthlyRainfallIndicator',{measurement:{hourly:rain},t:makeT('en')});
  assert.equal(frames[0].columns.find(c=>c.key==='yearCount').label,'Contributing years');
});
test('F5: compound annual export includes denominator/share and explicit PNG caption', async () => {
  const hourly=[]; for(let m=4;m<=9;m++) for(let d=1;d<=new Date(2024,m,0).getDate();d++) hourly.push({d:`2024-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T12:00:00`,v:0});
  const {frames,html}=await render('HotDaysInDrySpellsIndicator',{rainfallMeasurement:{hourly},temperatureMeasurement:{hourly:hourly.map(r=>({...r,v:31}))},t:makeT('en')});
  const annual=frames.find(f=>f.indicator==='hot-days-in-dry-spells-indicator-1');
  for(const key of ['totalHotDays','compound5Share','compound7Share']) assert.ok(keys(annual).includes(key),key);
  assert.match(html,/data-export-caption/);
  assert.match(fs.readFileSync(new URL('./chartExport.js',import.meta.url),'utf8'),/context\.querySelectorAll\([^\n]*data-export-caption/);
});
test('F6: rainfall membership and legend descriptions agree at exact boundaries', async () => {
  const values=[0,.5,1,29.9,30,50,79.9,80,81];
  assert.deepEqual(values.map(v=>bandOf(v)?.id??null),[null,null,'light','light','moderate','heavy','heavy','extreme','extreme']);
  for(const lang of ['en','sq']) {
    const t=makeT(lang); assert.equal(t('rainBandExtreme'),'≥80 mm'); assert.equal(t('rainBandLight'),'1–<30 mm');
    const {frames}=await render('TopRainfallDays',{measurement:{hourly:values.map((v,i)=>({d:`2024-01-${String(i+1).padStart(2,'0')}T00:00:00`,v}))},t});
    const f=frames[0],category=f.columns.find(c=>c.key==='category');
    assert.equal(category.value(f.rows.find(r=>r.total===.5)),'<1 mm');
    assert.equal(category.value(f.rows.find(r=>r.total===80)),'≥80 mm');
  }
});
test('F7: evening pressure peak and morning trough have neutral EN/SQ callouts', async () => {
  const hourly=Array.from({length:24},(_,h)=>({d:`2024-01-01T${String(h).padStart(2,'0')}:00:00`,v:h===20?1010:h===6?990:1000}));
  for(const lang of ['en','sq']) {
    const {html}=await render('DiurnalPressureCycle',{measurement:{hourly},unit:'hPa',t:makeT(lang)});
    assert.ok(html.includes('20:00')&&html.includes('06:00'));
    const callout=html.match(/<p class="indicator-callout">(.*?)<\/p>/s)[1];
    assert.doesNotMatch(callout,/rises through the morning|falls through the afternoon|ftohja|ngrohja|rritet gjatë mëngjesit|bie gjatë pasdites/);
  }
});
test('F8: 80 mm annotation describes a rainfall boundary without flood validation claims',()=>{
  for(const lang of ['en','sq']) { const text=makeT(lang)('highRainfallMarker'); assert.ok(text.includes('80')); assert.doesNotMatch(text,/flood risk|rrezik nga vërshimet/i); }
});
test('F9: actual fractional return-period formatter uses EN/SQ decimals', async()=>{
  for(const lang of ['en','sq']) {
    const {frames}=await render('FloodFrequencyChart',{measurement:{daily:[2022,2023,2024].map((y,i)=>({d:`${y}-06-01`,v:i+1,hi:i+2}))},unit:'m',t:makeT(lang)});
    const axis=elements(frames[0].children).find(e=>e.props.dataKey==='returnPeriod');
    assert.equal(axis.props.tickFormatter(1.1),lang==='sq'?'1,1':'1.1');
  }
});
test('F10: ordinary monthly rainfall bar and legend share rainfall palette',async()=>{
  const {frames}=await render('RainyDaysIndicator',{measurement:{hourly:rain},t:makeT('en')});
  const nodes=elements(frames[1].children);
  assert.equal(nodes.find(e=>e.props.dataKey==='rainDays').props.fill,CHART_PALETTE.rainfall);
  assert.equal(nodes.find(e=>Array.isArray(e.props.payload)).props.payload[0].color,CHART_PALETTE.rainfall);
});
test('F11: README accurately describes optional Supabase persistence and startup',()=>{
  const readme=fs.readFileSync(new URL('../../../README.md',import.meta.url),'utf8');
  assert.doesNotMatch(readme,/Nothing is uploaded anywhere|placed at Prishtina by default/);
  assert.match(readme,/Supabase/); assert.match(readme,/memory/i);
});
