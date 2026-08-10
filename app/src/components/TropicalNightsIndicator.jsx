import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { calculateTropicalNights } from "../lib/tropicalNights.js";

const GREEN = "#2f7d32";
const WARM = "#d8653b";
const PARTIAL = "#aab8bf";

const formatTemperature = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
const formatCount = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });

function DailyTooltip({ active, payload }) {
  if (!active || !payload?.length || payload[0].payload.dailyMinimum == null) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.date}</strong>
      <span>Daily minimum: {formatTemperature(row.dailyMinimum)} °C</span>
      <span>{row.qualifying ? "Qualifying tropical night" : "Not qualifying"}</span>
    </div>
  );
}

function AnnualTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}</strong>
      <span>{row.count} tropical {row.count === 1 ? "night" : "nights"}</span>
      <span>Coverage: {row.availableStart} – {row.availableEnd}</span>
      <span>{row.isPartial ? "Partial record" : "Full calendar-year coverage"}</span>
      <span>{row.monthlyCounts.map((month) => `${month.month.slice(5)}: ${month.count}`).join(" · ")}</span>
    </div>
  );
}

function QualifyingDot({ cx, cy, payload }) {
  if (!payload?.qualifying) return null;
  return <circle cx={cx} cy={cy} r={4} fill={WARM} stroke="#fff" strokeWidth={1.4} />;
}

function ValueLabel({ x, y, width, value }) {
  return <text x={x + width / 2} y={y - 7} textAnchor="middle" fill="#17242b" fontSize="11" fontWeight="700">{formatCount(value)}</text>;
}

function withMissingGapMarkers(daily) {
  const chart = [];
  for (let index = 0; index < daily.length; index += 1) {
    const row = daily[index];
    if (index) {
      const prior = new Date(`${daily[index - 1].date}T12:00:00`);
      const current = new Date(`${row.date}T12:00:00`);
      if ((current - prior) / 86400000 > 1) chart.push({ date: `${daily[index - 1].date}…${row.date}`, dailyMinimum: null, qualifying: false });
    }
    chart.push(row);
  }
  return chart;
}

export default function TropicalNightsIndicator({ measurement }) {
  const result = useMemo(() => calculateTropicalNights(measurement?.hourly), [measurement]);
  const chartData = useMemo(() => withMissingGapMarkers(result.dailyMinimumSeries), [result.dailyMinimumSeries]);
  if (!result.dailyMinimumSeries.length) return null;

  const maxAnnual = Math.max(1, ...result.annualCounts.map((row) => row.count));
  const warmest = result.warmestNight;
  const partialYears = result.annualCounts.filter((row) => row.isPartial).map((row) => row.year).join(" and ");

  return (
    <section className="card landslide-indicator">
      <div className="indicator-grid">
        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>Tropical nights</h2>
            <p>Observed daily minimum temperature across the full record.</p>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData} margin={{ top: 25, right: 22, left: 42, bottom: 28 }}>
              <CartesianGrid stroke="#dce5ea" />
              <XAxis dataKey="date" minTickGap={48} tick={{ fontSize: 10 }} />
              <YAxis width={62} tick={{ fontSize: 12 }} tickFormatter={formatTemperature} label={{ value: "Daily minimum (°C)", angle: -90, position: "insideLeft", offset: -10 }} />
              <Tooltip content={<DailyTooltip />} />
              <ReferenceLine y={20} stroke="#17242b" strokeDasharray="6 4" label={{ value: "20°C", position: "insideTopRight", fill: "#17242b", fontSize: 11, fontWeight: 700 }} />
              {warmest.date && <ReferenceLine x={warmest.date} stroke={WARM} strokeDasharray="4 4" label={{ value: `${warmest.date} · ${formatTemperature(warmest.temperature)}°C`, position: "top", fill: WARM, fontSize: 10, fontWeight: 700 }} />}
              <Line type="monotone" dataKey="dailyMinimum" stroke={GREEN} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="dailyMinimum" stroke="transparent" strokeWidth={0} dot={<QualifyingDot />} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>Annual count</h2>
            <p>Calendar dates with an observed daily minimum strictly above 20°C.</p>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={result.annualCounts.map((row) => ({ ...row, yearLabel: `${row.year}${row.isPartial ? "*" : ""}` }))} margin={{ top: 30, right: 18, left: 14, bottom: 28 }}>
              <CartesianGrid stroke="#dce5ea" vertical={false} />
              <XAxis dataKey="yearLabel" />
              <YAxis allowDecimals={false} domain={[0, maxAnnual + 1]} label={{ value: "Count of nights", angle: -90, position: "insideLeft" }} />
              <Tooltip content={<AnnualTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {result.annualCounts.map((row) => <Cell key={row.year} fill={row.isPartial ? PARTIAL : GREEN} />)}
                <LabelList content={<ValueLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="indicator-assumption">* Partial record</p>
        </div>
      </div>

      <p className="indicator-explanation">A tropical night occurs when the observed daily minimum temperature remains strictly above 20°C.</p>
      <p className="indicator-assumption">
        Daily minima use available hourly observations; missing temperature hours and days are not filled or interpolated. Annual bars are shown for readability while monthly counts remain available. {partialYears ? `${partialYears} are partial records. ` : ""}This is a single-station result; the short record is insufficient for a confident trend.
      </p>
      <p className="indicator-assumption">
        Coverage: {result.firstObservationDate} – {result.lastObservationDate}. Total: {result.totalCount}. Warmest night: {warmest.date} ({formatTemperature(warmest.temperature)} °C).
      </p>
    </section>
  );
}
