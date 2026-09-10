import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateHeavySnowfall } from "../lib/heavySnowfall.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function AnnualTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <div className="indicator-tooltip"><strong>{row.year}{row.isPartial ? "*" : ""}</strong><span>{t("heavySnowAxis")}: {row.annualTotal}</span><span>{t("commonCoverage")}: {row.availableStart} – {row.availableEnd}</span><span>{row.isPartial ? t("partialYear") : t("fullYear")}</span></div>;
}

function Heatmap({ yearly, t }) {
  const [tip, setTip] = useState(null);
  const left = 62, top = 34, cellWidth = 42, cellHeight = 38;
  const width = left + cellWidth * 12 + 10;
  const height = top + cellHeight * yearly.length + 36;
  return <div style={{ position: "relative", overflowX: "auto" }} onMouseLeave={() => setTip(null)}>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: 570, height: 350, display: "block" }} role="img" aria-label={t("heavySnowTitle")}>
      {MONTHS.map((month, index) => <text key={month} x={left + index * cellWidth + cellWidth / 2} y="21" textAnchor="middle" fill="#52646d" fontSize="11">{t("months")[index]}</text>)}
      {yearly.map((row, rowIndex) => <g key={row.year}>
        <text x={left - 8} y={top + rowIndex * cellHeight + 23} textAnchor="end" fill="#42545d" fontSize="12" fontWeight={row.isPartial ? 700 : 400}>{row.year}{row.isPartial ? "*" : ""}</text>
        {row.months.map((month, column) => {
          const x = left + column * cellWidth, y = top + rowIndex * cellHeight;
          const fill = month.count == null ? "#f2f4f5" : month.count > 0 ? "#397f99" : "#edf4f7";
          return <g key={month.month} onMouseMove={(event) => setTip({ x: event.nativeEvent.offsetX + 8, y: event.nativeEvent.offsetY + 8, row, month })}>
            <rect x={x + 1} y={y + 1} width={cellWidth - 3} height={cellHeight - 3} rx="3" fill={fill} stroke="#d2dde2" strokeDasharray={month.available ? undefined : "3 2"} />
            {month.count != null && <text x={x + cellWidth / 2} y={y + 23} textAnchor="middle" fill={month.count > 0 ? "#fff" : "#23363f"} fontSize="12" fontWeight="700">{month.count}</text>}
          </g>;
        })}
      </g>)}
    </svg>
    {tip && <div className="indicator-tooltip" style={{ position: "absolute", left: tip.x, top: tip.y, zIndex: 2, pointerEvents: "none" }}><strong>{t("months")[tip.month.month - 1]} {tip.row.year}</strong><span>{tip.month.available ? `${t("eventCount")}: ${tip.month.count}` : t("eventCountUnavailable")}</span><span>{tip.month.available ? (tip.month.isPartial ? t("partialMonthCoverage") : t("coveredMonth")) : t("outsideCommonCoverage")}</span><span>{t("heavySnowDefinition")}</span></div>}
  </div>;
}

function ValueLabel({ x, y, width, height, value }) {
  return <text x={x + Math.max(width, 0) + 7} y={y + height / 2 + 4} fill="#17242b" fontSize="11" fontWeight="700">{value}</text>;
}

export default function HeavySnowfallIndicator({ stationId, rainfallMeasurement, temperatureMeasurement, t }) {
  const result = useMemo(() => calculateHeavySnowfall(
    { stationId, hourly: rainfallMeasurement?.hourly },
    { stationId, hourly: temperatureMeasurement?.hourly }
  ), [stationId, rainfallMeasurement, temperatureMeasurement]);
  if (!result.yearly.length) return null;
  return <section className="card landslide-indicator">
    <div className="indicator-grid">
      <div className="indicator-panel">
        <div className="indicator-heading"><h2>{t("heavySnowTitle")}</h2><p>{t("heavySnowDesc")}</p></div>
        <Heatmap yearly={result.yearly} t={t} />
        <p className="indicator-assumption">{t("heavySnowHeatmapNote")}</p>
        <div className="event-list"><strong>{t("heavySnowEvents")}</strong>{result.events.map((event) => <div key={event.date}>{event.date}: {event.precipitation.toFixed(1)} mm, {event.meanTemperature.toFixed(1)}°C</div>)}</div>
      </div>
      <div className="indicator-panel">
        <div className="indicator-heading"><h2>{t("annualTotal")}</h2><p>{t("heavySnowAnnualDesc")}</p></div>
        <ResponsiveContainer width="100%" height={360}><BarChart data={result.yearly} layout="vertical" margin={{ top: 16, right: 42, left: 18, bottom: 42 }}><CartesianGrid stroke="#dce5ea" horizontal={false} /><XAxis type="number" allowDecimals={false} domain={[0, "dataMax + 1"]} label={{ value: t("heavySnowAxis"), position: "insideBottom", offset: -24, style: { textAnchor: "middle", fill: "#475569", fontSize: 12, fontWeight: 600 } }} /><YAxis type="category" dataKey="year" width={54} tickFormatter={(value) => `${value}${result.yearly.find((row) => row.year === value)?.isPartial ? "*" : ""}`} /><Tooltip content={<AnnualTooltip t={t} />} /><Bar dataKey="annualTotal" name={t("heavySnowAxis")} minPointSize={3} radius={[0, 3, 3, 0]}>{result.yearly.map((row) => <Cell key={row.year} fill={row.isPartial ? "#8999a2" : "#397f99"} />)}<LabelList dataKey="annualTotal" content={<ValueLabel />} /></Bar></BarChart></ResponsiveContainer>
        <p className="indicator-assumption">{t("snowfallYearNote")}</p>
      </div>
    </div>
    <p className="indicator-explanation">{t("heavySnowDesc")}</p>
    <p className="indicator-assumption">{t("heavySnowMethodology")}</p>
  </section>;
}
