import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateDrySpells } from "../lib/drySpells.js";
import { yAxisLabel } from "./chartLabels.jsx";

const AMBER = "#f5a742";
const RED = "#c63a2b";
const MONTHS = [
  ["Apr", 0], ["May", 30], ["Jun", 61], ["Jul", 91], ["Aug", 122], ["Sep", 153],
];
const SEASON_TICKS = [0, 14, 28, 44, 59, 75, 90, 105, 120, 136, 151, 167, 182];
const SEASON_DAYS = 183;

function seasonOffset(date) {
  const year = Number(date.slice(0, 4));
  return Math.round((Date.UTC(year, Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) - Date.UTC(year, 3, 1)) / 86400000);
}

function seasonTickLabel(offset, t) {
  const date = new Date(Date.UTC(2024, 3, 1 + offset));
  return `${t("months")[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

function RunTooltip({ run, x, y, t }) {
  if (!run) return null;
  return (
    <div className="indicator-tooltip" style={{ position: "absolute", left: x + 10, top: y + 10, pointerEvents: "none", zIndex: 2 }}>
      <strong>{run.year}</strong>
      <span>{t("start")}: {run.startDate}</span>
      <span>{t("end")}: {run.endDate}</span>
      <span>{t("duration")}: {run.length} {t("days")}</span>
      <span>{run.classification}</span>
    </div>
  );
}

// The runs chart is drawn by hand, so it never picked up a Recharts legend and
// the reader was left to guess what the amber and red blocks meant.
function RunsLegend({ t }) {
  const items = [
    { color: "#dce5ea", label: t("aprilSeptemberSeason") },
    { color: AMBER, label: t("dryRunShort") },
    { color: RED, label: t("dryRunLong") },
  ];
  return (
    <div className="swatch-legend">
      {items.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function SeasonalRunsChart({ yearly, t }) {
  const [tooltip, setTooltip] = useState(null);
  const height = 76 + yearly.length * 42;
  const left = 96;
  const width = 500;
  const scale = width / SEASON_DAYS;
  return (
    <div style={{ position: "relative", width: "100%" }} onMouseLeave={() => setTooltip(null)}>
      <RunsLegend t={t} />
      <svg viewBox={`0 0 620 ${height + 12}`} role="img" aria-label={t("drySpellsAria")} style={{ display: "block", width: "100%", height: 360 }}>
        {MONTHS.map(([month, offset]) => {
          const x = left + offset * scale;
          return (
            <g key={month}>
              <line x1={x} x2={x} y1="28" y2={height - 28} stroke="#dce5ea" />
            </g>
          );
        })}
        {SEASON_TICKS.map((offset) => {
          const x = left + offset * scale;
          return (
            <g key={offset}>
              <line x1={x} x2={x} y1={height - 31} y2={height - 24} stroke="#8999a2" />
              <text x={x} y={height - 8} textAnchor="middle" fill="#5f7079" fontSize="9">{seasonTickLabel(offset, t)}</text>
            </g>
          );
        })}
        <text x={left + width / 2} y={height + 8} textAnchor="middle" fill="#5f7079" fontSize="10">{t("calendarDaySeason")}</text>
        {yearly.map((row, rowIndex) => {
          const y = 40 + rowIndex * 42;
          return (
            <g key={row.year}>
              <text x={left - 10} y={y + 5} textAnchor="end" fill="#42545d" fontSize="12" fontWeight={row.isPartial ? 700 : 400}>
                {row.year}{row.isPartial ? "*" : ""}
              </text>
              <line x1={left} x2={left + width} y1={y} y2={y} stroke="#dce5ea" strokeWidth="8" strokeLinecap="round" />
              {row.runs.filter((run) => run.length >= 5).map((run) => {
                const x = left + seasonOffset(run.startDate) * scale;
                const segmentWidth = Math.max(3, run.length * scale);
                const enriched = { ...run, year: row.year };
                return (
                  <g key={`${run.startDate}-${run.endDate}`}>
                    <rect
                      x={x}
                      y={y - 7}
                      width={segmentWidth}
                      height="14"
                      rx="3"
                      fill={run.length >= 7 ? RED : AMBER}
                      onMouseMove={(event) => setTooltip({ run: enriched, x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })}
                    />
                    <text x={x + segmentWidth / 2} y={y - 11} textAnchor="middle" fill="#42545d" fontSize="9" fontWeight="700">{run.length}d</text>
                  </g>
                );
              })}
              {row.isPartial && (
                <text x={left} y={y + 22} fill="#5f7079" fontSize="9.5">
                  {t("covered")}: {row.availableStart?.slice(5)} – {row.availableEnd?.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <RunTooltip {...tooltip} t={t} />
    </div>
  );
}

function BarLabel({ x, y, width, value }) {
  return <text x={x + width / 2} y={y - 7} textAnchor="middle" fill="#17242b" fontSize="11" fontWeight="700">{value}</text>;
}

function AnnualTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const row = item.payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}{row.isPartial ? ` (${t("partialRecord")})` : ""}</strong>
      <span>{t("thresholdUsed")}: {item.dataKey === "daysAtLeast5" ? "≥5" : "≥7"}</span>
      <span>{t("qualifyingDays")}: {item.value}</span>
      <span>{t("availableSeason")}: {row.availableSeasonalDays} {t("days")}</span>
      <span>{row.isPartial ? t("partialRecord") : t("fullAprSepRecord")}</span>
    </div>
  );
}

export default function DrySpellsIndicator({ measurement, t }) {
  const result = useMemo(() => calculateDrySpells(measurement?.hourly), [measurement]);
  if (!result.yearly.length) return null;
  const completeYearly = result.yearly.filter((row) => !row.isPartial);

  return (
    <section className="card landslide-indicator">
      <div className="indicator-grid">
        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>{t("drySpellsTitle")}</h2>
            <p>{t("drySpellsDesc")}</p>
          </div>
          <SeasonalRunsChart yearly={result.yearly} t={t} />
          <p className="indicator-assumption">{t("drySpellsChartNote")}</p>
          <p className="indicator-assumption">{t("drySpellsPartialNote")}</p>
        </div>

        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>{t("drySpellsAnnualTitle")}</h2>
            <p>{t("drySpellsAnnualDesc")}</p>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={completeYearly} margin={{ top: 34, right: 18, left: 14, bottom: 28 }}>
              <CartesianGrid stroke="#dce5ea" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis width={64} allowDecimals={false} label={yAxisLabel(t("drySpellsAxis"))} />
              <Tooltip content={<AnnualTooltip t={t} />} />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12, paddingBottom: 6 }} />
              <Bar dataKey="daysAtLeast5" name={t("dryRunFiveLegend")} fill={AMBER} radius={[3, 3, 0, 0]}>
                <LabelList content={<BarLabel />} />
              </Bar>
              <Bar dataKey="daysAtLeast7" name={t("dryRunSevenLegend")} fill={RED} radius={[3, 3, 0, 0]}>
                <LabelList content={<BarLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="indicator-explanation">{t("drySpellsExplanation")}</p>
      <p className="indicator-assumption">{t("drySpellsAssumption")} {t("drySpellsCoverageNote")}</p>
    </section>
  );
}
