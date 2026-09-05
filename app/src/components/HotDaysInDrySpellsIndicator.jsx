import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateHotDaysInDrySpells } from "../lib/hotDaysInDrySpells.js";

const AMBER = "#f5a742";
const RED = "#c63a2b";
const GREY = "#8999a2";
const MONTHS = [["Apr", 0], ["May", 30], ["Jun", 61], ["Jul", 91], ["Aug", 122], ["Sep", 153]];
const seasonOffset = (date) => Math.round((Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) - Date.UTC(Number(date.slice(0, 4)), 3, 1)) / 86400000);

function TimelineTooltip({ item, x, y }) {
  if (!item) return null;
  return (
    <div className="indicator-tooltip" style={{ position: "absolute", left: x + 10, top: y + 10, zIndex: 2, pointerEvents: "none" }}>
      <strong>{item.type === "run" ? item.year : item.date}</strong>
      {item.type === "run" ? <><span>Start: {item.startDate}</span><span>End: {item.endDate}</span><span>Length: {item.length} days</span><span>{item.length >= 7 ? "≥7-day dry spell" : "≥5-day dry spell"}</span></> : <><span>Daily maximum: {item.temperature.toLocaleString(undefined, { maximumFractionDigits: 1 })}°C</span><span>{item.inside5 ? "Inside qualifying dry spell" : "Outside qualifying dry spell"}</span><span>{item.inside7 ? "Belongs to a ≥7-day spell" : "Not in a ≥7-day spell"}</span></>}
    </div>
  );
}

// Five different marks and not one of them was named: the reader could not tell
// a small grey circle from a large red one, or an amber block from a salmon one.
function TimelineLegend() {
  const items = [
    { color: "#dce5ea", label: "Common April–September coverage" },
    { color: AMBER, label: "Dry spell of 5–6 days" },
    { color: "#e67c73", label: "Dry spell of 7 days or more" },
    { color: RED, label: "Hot day (≥30 °C) inside a dry spell", round: true },
    { color: GREY, label: "Hot day outside a dry spell", round: true },
  ];
  return (
    <div className="swatch-legend">
      {items.map((item) => (
        <span key={item.label}>
          <i className={item.round ? "round" : undefined} style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function CompoundTimeline({ yearly }) {
  const [tooltip, setTooltip] = useState(null);
  const left = 96;
  const plotWidth = 500;
  const scale = plotWidth / 183;
  const height = 76 + yearly.length * 42;
  const show = (event, item) => setTooltip({ item, x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
  return (
    <div style={{ position: "relative" }} onMouseLeave={() => setTooltip(null)}>
      <TimelineLegend />
      <svg viewBox={`0 0 620 ${height}`} style={{ width: "100%", height: 360, display: "block" }} role="img" aria-label="Hot days overlaid on dry spells from April through September">
        {MONTHS.map(([month, offset]) => <g key={month}><line x1={left + offset * scale} x2={left + offset * scale} y1="26" y2={height - 28} stroke="#dce5ea" /><text x={left + offset * scale + 3} y={height - 8} fill="#5f7079" fontSize="11">{month}</text></g>)}
        {yearly.map((row, index) => {
          const y = 40 + index * 42;
          const coverageX = left + seasonOffset(row.availableCommonStart) * scale;
          const coverageWidth = Math.max(3, (seasonOffset(row.availableCommonEnd) - seasonOffset(row.availableCommonStart) + 1) * scale);
          const compound5 = new Set(row.compound5Dates);
          const compound7 = new Set(row.compound7Dates);
          return <g key={row.year}>
            <text x={left - 10} y={y + 5} textAnchor="end" fill="#42545d" fontSize="12" fontWeight={row.isPartial ? 700 : 400}>{row.year}{row.isPartial ? "*" : ""}</text>
            <line x1={coverageX} x2={coverageX + coverageWidth} y1={y} y2={y} stroke="#dce5ea" strokeWidth="8" strokeLinecap="round" />
            {row.dryRuns.map((run) => <rect key={run.startDate} x={left + seasonOffset(run.startDate) * scale} y={y - 6} width={Math.max(3, run.length * scale)} height="12" rx="3" fill={run.length >= 7 ? "#e67c73" : AMBER} onMouseMove={(event) => show(event, { ...run, year: row.year, type: "run" })} />)}
            {row.hotDayDates.map((date) => <circle key={date} cx={left + (seasonOffset(date) + 0.5) * scale} cy={y} r={compound5.has(date) ? 5 : 3} fill={compound5.has(date) ? RED : GREY} stroke="#fff" strokeWidth="1" onMouseMove={(event) => show(event, { type: "hot", date, temperature: row.hotDayTemperatures[date], inside5: compound5.has(date), inside7: compound7.has(date) })} />)}
            {row.isPartial && <text x={left - 10} y={y + 18} textAnchor="end" fill="#5f7079" fontSize="9.5">{row.availableCommonStart?.slice(5)}–{row.availableCommonEnd?.slice(5)}</text>}
          </g>;
        })}
      </svg>
      <TimelineTooltip {...tooltip} />
    </div>
  );
}

function CountLabel({ x, y, width, value }) {
  return <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#17242b" fontSize="10" fontWeight="700">{value}</text>;
}
function CompoundTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const row = item.payload;
  const share = row.totalHotDays ? item.value / row.totalHotDays * 100 : 0;
  return <div className="indicator-tooltip"><strong>{row.year}{row.isPartial ? " (partial)" : ""}</strong><span>{item.dataKey === "compound5Count" ? "Hot days in ≥5-day spells" : "Hot days in ≥7-day spells"}: {item.value}</span><span>Total hot days: {row.totalHotDays}</span><span>Share of all hot days represented by this bar: {Math.round(share)}%</span><span>Common coverage: {row.availableCommonStart} – {row.availableCommonEnd}</span><span>{row.isPartial ? "Partial record" : "Full record"}</span></div>;
}

export default function HotDaysInDrySpellsIndicator({ rainfallMeasurement, temperatureMeasurement }) {
  const result = useMemo(() => calculateHotDaysInDrySpells(rainfallMeasurement?.hourly, temperatureMeasurement?.hourly), [rainfallMeasurement, temperatureMeasurement]);
  if (!result.yearly.length) return null;
  return <section className="card landslide-indicator">
    <div className="indicator-grid">
      <div className="indicator-panel"><div className="indicator-heading"><h2>Hot days in dry spells</h2><p>Hot days overlaid on qualifying dry runs during April–September.</p></div><CompoundTimeline yearly={result.yearly} /><p className="indicator-assumption">* Partly observed season — the dates under the year give the common rainfall-and-temperature coverage.</p></div>
      <div className="indicator-panel"><div className="indicator-heading"><h2>Annual compound heat–drought days</h2><p>Compound ≥7-day counts are included in compound ≥5-day counts.</p></div>
        <ResponsiveContainer width="100%" height={360}><BarChart data={result.yearly} margin={{ top: 42, right: 18, left: 14, bottom: 28 }}><CartesianGrid stroke="#dce5ea" vertical={false} /><XAxis dataKey="year" tickFormatter={(year) => `${year}${result.yearly.find((row) => row.year === year)?.isPartial ? "*" : ""}`} /><YAxis width={64} allowDecimals={false} label={{ value: "Compound days", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#475569", fontSize: 12, fontWeight: 600 } }} /><Tooltip content={<CompoundTooltip />} /><Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12, paddingBottom: 6 }} /><Bar dataKey="compound5Count" name="Hot days in ≥5-day spells" fill={AMBER} radius={[3, 3, 0, 0]}><LabelList dataKey="compound5Count" content={<CountLabel />} /></Bar><Bar dataKey="compound7Count" name="Hot days in ≥7-day spells (included in ≥5)" fill={RED} minPointSize={(value) => (value ? 2 : 0)} radius={[3, 3, 0, 0]}><LabelList dataKey="compound7Count" content={<CountLabel />} /></Bar></BarChart></ResponsiveContainer>
        <div className="compound-share-panel">
          <strong>Share of hot days in ≥5-day dry spells:</strong>
          <div className="compound-share-grid">
            {result.yearly.map((row) => (
              <span key={row.year} className="compound-share-item">
                <span>{row.year}{row.isPartial ? "*" : ""}</span>
                <strong>{Math.round(row.compound5Share)}%</strong>
              </span>
            ))}
          </div>
        </div>
        <p className="indicator-assumption">Percentages show the share of all hot days (daily maximum ≥30°C) that occurred within a ≥5-day dry spell; they do not compare the orange and red bars. * Partial record means the common April–September rainfall and temperature record does not cover the full season.</p>
      </div>
    </div>
    <p className="indicator-explanation">This indicator counts days when daily maximum temperature reached at least 30°C while the same date belonged to a qualifying dry spell during April–September.</p>
    <p className="indicator-assumption">Compound ≥7-day counts are included in compound ≥5-day counts. Dry days use daily rainfall below 1 mm; temperature uses daily maximum ≥30°C. Existing missing-rainfall-hour reconstruction assumptions apply. Only overlapping dates from the same station are combined. 2021 and 2026 are partial records.</p>
  </section>;
}
