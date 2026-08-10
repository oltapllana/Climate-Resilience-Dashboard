import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateSnowfall } from "../lib/snowfall.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#edf4f7", "#d2e4eb", "#a8cedc", "#71adbf", "#397f99", "#17536d"];
const DEFINITION = "Precipitation >1 mm and daily mean temperature <0°C";

function colorFor(count, maximum) {
  if (count == null) return "#f2f4f5";
  if (count === 0 || maximum === 0) return COLORS[0];
  return COLORS[Math.min(COLORS.length - 1, Math.max(1, Math.ceil(count / maximum * (COLORS.length - 1))))];
}

function Heatmap({ yearly }) {
  const [tip, setTip] = useState(null);
  const maximum = Math.max(0, ...yearly.flatMap((row) => row.monthlyCounts.filter((count) => count != null)));
  const left = 62, top = 34, cellWidth = 42, cellHeight = 38;
  const width = left + cellWidth * 12 + 10;
  const height = top + cellHeight * yearly.length + 36;
  return <div style={{ position: "relative", overflowX: "auto" }} onMouseLeave={() => setTip(null)}>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: 570, height: 350, display: "block" }} role="img" aria-label="Snowfall proxy month by year heatmap">
      {MONTHS.map((month, index) => <text key={month} x={left + index * cellWidth + cellWidth / 2} y="21" textAnchor="middle" fill="#52646d" fontSize="11">{month}</text>)}
      {yearly.map((row, rowIndex) => <g key={row.year}>
        <text x={left - 8} y={top + rowIndex * cellHeight + 23} textAnchor="end" fill="#42545d" fontSize="12" fontWeight={row.isPartial ? 700 : 400}>{row.year}{row.isPartial ? "*" : ""}</text>
        {row.months.map((month, column) => {
          const x = left + column * cellWidth, y = top + rowIndex * cellHeight;
          const fill = colorFor(month.count, maximum);
          const dark = month.count != null && COLORS.indexOf(fill) >= 4;
          return <g key={month.month} onMouseMove={(event) => setTip({ x: event.nativeEvent.offsetX + 8, y: event.nativeEvent.offsetY + 8, row, month })}>
            <rect x={x + 1} y={y + 1} width={cellWidth - 3} height={cellHeight - 3} rx="3" fill={fill} stroke="#d2dde2" strokeDasharray={month.available ? undefined : "3 2"} />
            {month.count != null && <text x={x + cellWidth / 2} y={y + 23} textAnchor="middle" fill={dark ? "#fff" : "#23363f"} fontSize="12" fontWeight="700">{month.count}</text>}
          </g>;
        })}
      </g>)}
    </svg>
    {tip && <div className="indicator-tooltip" style={{ position: "absolute", left: tip.x, top: tip.y, zIndex: 2, pointerEvents: "none" }}><strong>{MONTHS[tip.month.month - 1]} {tip.row.year}</strong><span>{tip.month.available ? `Snowfall-proxy days: ${tip.month.count}` : "Snowfall-proxy days: N/A"}</span><span>{tip.month.available ? (tip.month.isPartial ? "Partial month coverage" : "Covered month") : "Outside common coverage"}</span><span>{DEFINITION}</span></div>}
  </div>;
}

function AnnualTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <div className="indicator-tooltip"><strong>{row.year}{row.isPartial ? "*" : ""}</strong><span>Annual total: {row.annualTotal}</span><span>Common coverage: {row.availableStart} – {row.availableEnd}</span><span>{row.isPartial ? "Partial year" : "Full year"}</span></div>;
}

function ValueLabel({ x, y, width, height, value }) {
  return <text x={x + Math.max(width, 0) + 7} y={y + height / 2 + 4} fill="#17242b" fontSize="11" fontWeight="700">{value}</text>;
}

export default function SnowfallIndicator({ stationId, rainfallMeasurement, temperatureMeasurement }) {
  const result = useMemo(() => calculateSnowfall(
    { stationId, hourly: rainfallMeasurement?.hourly },
    { stationId, hourly: temperatureMeasurement?.hourly }
  ), [stationId, rainfallMeasurement, temperatureMeasurement]);
  if (!result.yearly.length) return null;
  return <section className="card landslide-indicator">
    <div className="indicator-grid">
      <div className="indicator-panel">
        <div className="indicator-heading"><h2>Snowfall</h2><p>Month × year count of qualifying snowfall-proxy days.</p></div>
        <Heatmap yearly={result.yearly} />
        <p className="indicator-assumption">Increasing color intensity indicates more snowfall-proxy days; dashed blank cells are outside common coverage. * Partial year</p>
      </div>
      <div className="indicator-panel">
        <div className="indicator-heading"><h2>Annual total</h2><p>Calendar-year sum of monthly snowfall-proxy days.</p></div>
        <ResponsiveContainer width="100%" height={360}><BarChart data={result.yearly} layout="vertical" margin={{ top: 16, right: 42, left: 18, bottom: 42 }}><CartesianGrid stroke="#dce5ea" horizontal={false} /><XAxis type="number" allowDecimals={false} domain={[0, "dataMax + 1"]} label={{ value: "Snowfall days per year", position: "insideBottom", offset: -24 }} /><YAxis type="category" dataKey="year" width={54} tickFormatter={(value) => `${value}${result.yearly.find((row) => row.year === value)?.isPartial ? "*" : ""}`} /><Tooltip content={<AnnualTooltip />} /><Bar dataKey="annualTotal" name="Snowfall days" minPointSize={3} radius={[0, 3, 3, 0]}>{result.yearly.map((row) => <Cell key={row.year} fill={row.isPartial ? "#8999a2" : "#397f99"} />)}<LabelList dataKey="annualTotal" content={<ValueLabel />} /></Bar></BarChart></ResponsiveContainer>
        <p className="indicator-assumption">Blue = full year; gray = partial year. * Partial year</p>
      </div>
    </div>
    <p className="indicator-explanation">A day is classified as a snowfall proxy when reconstructed daily precipitation exceeds 1 mm and daily mean air temperature is below 0°C.</p>
    <p className="indicator-assumption">This is a liquid-equivalent proxy; precipitation phase is not directly measured. Rainfall inherits the missing-hour reconstruction assumption. Temperature means use available observations without interpolation. Only same-station overlapping dates are combined. Results use calendar years. 2021 and 2026 are partial. The short record is insufficient for a confident trend.</p>
  </section>;
}
