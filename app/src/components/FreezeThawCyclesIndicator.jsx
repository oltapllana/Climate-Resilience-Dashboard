import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateFreezeThawCycles } from "../lib/freezeThawCycles.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BLUE = ["#edf4f7", "#d2e4eb", "#a8cedc", "#71adbf", "#397f99", "#17536d"];
const threshold = "Daily minimum < −2.2°C and daily maximum > 0°C";

function heatColor(value, maximum) {
  if (value == null) return "#f2f4f5";
  if (value === 0 || maximum === 0) return BLUE[0];
  return BLUE[Math.min(BLUE.length - 1, Math.max(1, Math.ceil(value / maximum * (BLUE.length - 1))))];
}

function AnnualTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <div className="indicator-tooltip"><strong>{row.year}{row.isPartial ? "*" : ""}</strong><span>{t("annualTotal")}: {row.annualTotal}</span><span>{t("available")}: {row.availableStart} – {row.availableEnd}</span><span>{row.isPartial ? t("partialYear") : t("fullYear")}</span></div>;
}

function ValueLabel({ x, y, width, height, value }) {
  return <text x={x + width + 7} y={y + height / 2 + 4} fill="#17242b" fontSize="11" fontWeight="700">{value}</text>;
}

function Heatmap({ yearly, t }) {
  const [tip, setTip] = useState(null);
  const maximum = Math.max(0, ...yearly.flatMap((row) => row.monthlyCounts.filter((value) => value != null)));
  const left = 62;
  const top = 34;
  const cellWidth = 42;
  const cellHeight = 38;
  const width = left + cellWidth * 12 + 10;
  const height = top + cellHeight * yearly.length + 36;
  return <div style={{ position: "relative", overflowX: "auto" }} onMouseLeave={() => setTip(null)}>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: 570, height: 350, display: "block" }} role="img" aria-label={t("freezeThawTitle")}>
      {MONTHS.map((month, index) => <text key={month} x={left + index * cellWidth + cellWidth / 2} y="21" textAnchor="middle" fill="#52646d" fontSize="11">{t("months")[index]}</text>)}
      {yearly.map((row, rowIndex) => <g key={row.year}>
        <text x={left - 8} y={top + rowIndex * cellHeight + 23} textAnchor="end" fill="#42545d" fontSize="12" fontWeight={row.isPartial ? 700 : 400}>{row.year}{row.isPartial ? "*" : ""}</text>
        {row.months.map((month, column) => {
          const x = left + column * cellWidth;
          const y = top + rowIndex * cellHeight;
          const fill = heatColor(month.count, maximum);
          const dark = month.count != null && BLUE.indexOf(fill) >= 4;
          return <g key={month.month} onMouseMove={(event) => setTip({ x: event.nativeEvent.offsetX + 8, y: event.nativeEvent.offsetY + 8, row, month })}>
            <rect x={x + 1} y={y + 1} width={cellWidth - 3} height={cellHeight - 3} rx="3" fill={fill} stroke={month.available ? "#d2dde2" : "#e0e4e6"} strokeDasharray={month.available ? undefined : "3 2"} />
            {month.count != null && <text x={x + cellWidth / 2} y={y + 23} textAnchor="middle" fill={dark ? "#fff" : "#23363f"} fontSize="12" fontWeight="700">{month.count}</text>}
          </g>;
        })}
      </g>)}
    </svg>
    {tip && <div className="indicator-tooltip" style={{ position: "absolute", left: tip.x, top: tip.y, zIndex: 2, pointerEvents: "none" }}><strong>{tip.row.year} {t("months")[tip.month.month - 1]}</strong><span>{tip.month.available ? `${t("qualifyingDays")}: ${tip.month.count}` : t("outsideAvailableRecord")}</span><span>{tip.month.available ? (tip.month.isPartial ? t("partialMonthCoverage") : t("coveredMonth")) : t("unavailable")}</span><span>{t("freezeThawDesc")}</span></div>}
  </div>;
}

export default function FreezeThawCyclesIndicator({ measurement, t }) {
  const result = useMemo(() => calculateFreezeThawCycles(measurement?.hourly), [measurement]);
  if (!result.yearly.length) return null;
  return <section className="card landslide-indicator">
    <div className="indicator-grid">
      <div className="indicator-panel"><div className="indicator-heading"><h2>{t("freezeThawTitle")}</h2><p>{t("freezeThawDesc")}</p></div><Heatmap yearly={result.yearly} t={t} /><p className="indicator-assumption">{t("freezeThawHeatmapNote")}</p></div>
      <div className="indicator-panel"><div className="indicator-heading"><h2>{t("freezeThawAnnualTitle")}</h2><p>{t("freezeThawAnnualDesc")}</p></div>
        <ResponsiveContainer width="100%" height={360}><BarChart data={result.yearly} layout="vertical" margin={{ top: 16, right: 42, left: 18, bottom: 42 }}><CartesianGrid stroke="#dce5ea" horizontal={false} /><XAxis type="number" allowDecimals={false} label={{ value: t("freezeThawAxis"), position: "insideBottom", offset: -24, style: { textAnchor: "middle", fill: "#475569", fontSize: 12, fontWeight: 600 } }} /><YAxis type="category" dataKey="year" width={54} tickFormatter={(value) => `${value}${result.yearly.find((row) => row.year === value)?.isPartial ? "*" : ""}`} /><Tooltip content={<AnnualTooltip t={t} />} /><Bar dataKey="annualTotal" name={t("freezeThawAxis")} radius={[0, 3, 3, 0]}>{result.yearly.map((row) => <Cell key={row.year} fill={row.isPartial ? "#8999a2" : "#397f99"} />)}<LabelList dataKey="annualTotal" content={<ValueLabel />} /></Bar></BarChart></ResponsiveContainer>
        <p className="indicator-assumption">{t("freezeThawYearNote")}</p>
      </div>
    </div>
    <p className="indicator-explanation">{t("freezeThawExplanation")}</p>
    <p className="indicator-assumption">{t("freezeThawMethodology")}</p>
  </section>;
}
