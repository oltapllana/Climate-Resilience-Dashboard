import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateHotDaysInDrySpells } from "../lib/hotDaysInDrySpells.js";

const AMBER = "#f5a742";
const RED = "#c63a2b";
const GREY = "#8999a2";
const MONTHS = [["Apr", 0], ["May", 30], ["Jun", 61], ["Jul", 91], ["Aug", 122], ["Sep", 153]];
const seasonOffset = (date) => Math.round((Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) - Date.UTC(Number(date.slice(0, 4)), 3, 1)) / 86400000);

function TimelineTooltip({ item, x, y, t }) {
  if (!item) return null;
  return (
    <div className="indicator-tooltip" style={{ position: "absolute", left: x + 10, top: y + 10, zIndex: 2, pointerEvents: "none" }}>
      <strong>{item.type === "run" ? item.year : item.date}</strong>
      {item.type === "run" ? <><span>{t("start")}: {item.startDate}</span><span>{t("end")}: {item.endDate}</span><span>{t("duration")}: {item.length} {t("days")}</span><span>{item.length >= 7 ? t("hotDryRunLong") : t("hotDryRunShort")}</span></> : <><span>{t("dailyMaximumShort")}: {item.temperature.toLocaleString(undefined, { maximumFractionDigits: 1 })}°C</span><span>{item.inside5 ? t("insideDrySpell") : t("outsideDrySpell")}</span><span>{item.inside7 ? t("insideLongDrySpell") : t("outsideLongDrySpell")}</span></>}
    </div>
  );
}

// Five different marks and not one of them was named: the reader could not tell
// a small grey circle from a large red one, or an amber block from a salmon one.
function TimelineLegend({ t }) {
  const items = [
    { color: "#dce5ea", label: t("commonAprSepCoverage") },
    { color: AMBER, label: t("hotDryRunShort") },
    { color: "#e67c73", label: t("hotDryRunLong") },
    { color: RED, label: t("hotDayInsideDry"), round: true },
    { color: GREY, label: t("hotDayOutsideDry"), round: true },
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

function CompoundTimeline({ yearly, t }) {
  const [tooltip, setTooltip] = useState(null);
  const left = 96;
  const plotWidth = 500;
  const scale = plotWidth / 183;
  const height = 76 + yearly.length * 42;
  const show = (event, item) => setTooltip({ item, x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
  return (
    <div style={{ position: "relative" }} onMouseLeave={() => setTooltip(null)}>
      <TimelineLegend t={t} />
      <svg viewBox={`0 0 620 ${height}`} style={{ width: "100%", height: 360, display: "block" }} role="img" aria-label={t("hotDryAria")}>
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
      <TimelineTooltip {...tooltip} t={t} />
    </div>
  );
}

function CountLabel({ x, y, width, value }) {
  return <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#17242b" fontSize="10" fontWeight="700">{value}</text>;
}
function CompoundTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const row = item.payload;
  const share = row.totalHotDays ? item.value / row.totalHotDays * 100 : 0;
  return <div className="indicator-tooltip"><strong>{row.year}{row.isPartial ? ` (${t("partialRecord")})` : ""}</strong><span>{item.dataKey === "compound5Count" ? t("hotDaysInFiveDry") : t("hotDaysInSevenDry")}: {item.value}</span><span>{t("totalHotDays")}: {row.totalHotDays}</span><span>{t("hotDaysShareDetail")}: {Math.round(share)}%</span><span>{t("commonCoverage")}: {row.availableCommonStart} – {row.availableCommonEnd}</span><span>{row.isPartial ? t("partialRecord") : t("fullRecord")}</span></div>;
}

export default function HotDaysInDrySpellsIndicator({ rainfallMeasurement, temperatureMeasurement, t }) {
  const result = useMemo(() => calculateHotDaysInDrySpells(rainfallMeasurement?.hourly, temperatureMeasurement?.hourly), [rainfallMeasurement, temperatureMeasurement]);
  if (!result.yearly.length) return null;
  const completeYearly = result.yearly.filter((row) => !row.isPartial);
  return <section className="card landslide-indicator">
    <div className="indicator-grid">
      <div className="indicator-panel"><div className="indicator-heading"><h2>{t("hotDryTitle")}</h2><p>{t("hotDryDesc")}</p></div><CompoundTimeline yearly={result.yearly} t={t} /><p className="indicator-assumption">* {t("partialYearExcluded")}</p></div>
      <div className="indicator-panel"><div className="indicator-heading"><h2>{t("hotDryAnnualTitle")}</h2><p>{t("hotDryAnnualDesc")}</p></div>
        <ResponsiveContainer width="100%" height={360}><BarChart data={completeYearly} margin={{ top: 66, right: 18, left: 14, bottom: 28 }}><CartesianGrid stroke="#dce5ea" vertical={false} /><XAxis dataKey="year" /><YAxis width={64} allowDecimals={false} label={{ value: t("compoundDaysAxis"), angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#475569", fontSize: 12, fontWeight: 600 } }} /><Tooltip content={<CompoundTooltip t={t} />} /><Legend verticalAlign="top" height={48} wrapperStyle={{ fontSize: 12, paddingBottom: 12, lineHeight: "20px" }} /><Bar dataKey="compound5Count" name={t("hotDaysInFiveDry")} fill={AMBER} radius={[3, 3, 0, 0]}><LabelList dataKey="compound5Count" content={<CountLabel />} /></Bar><Bar dataKey="compound7Count" name={t("hotDaysInSevenDry")} fill={RED} minPointSize={(value) => (value ? 2 : 0)} radius={[3, 3, 0, 0]}><LabelList dataKey="compound7Count" content={<CountLabel />} /></Bar></BarChart></ResponsiveContainer>
        <div className="compound-share-panel">
          <strong>{t("hotDryShare")}</strong>
          <div className="compound-share-grid">
            {completeYearly.map((row) => (
              <span key={row.year} className="compound-share-item">
                <span>{row.year}{row.isPartial ? "*" : ""}</span>
                <strong>{Math.round(row.compound5Share)}%</strong>
              </span>
            ))}
          </div>
        </div>
        <p className="indicator-assumption">{t("hotDryShareNote")}</p>
      </div>
    </div>
    <p className="indicator-explanation">{t("hotDryDesc")}</p>
    <p className="indicator-assumption">{t("hotDryMethodology")}</p>
  </section>;
}
