import { CHART_PALETTE } from "../lib/chartPalette.js";
import ChartFrame from "./ChartFrame.jsx";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, ComposedChart, Tooltip, XAxis, YAxis } from "recharts";
import { CLASSIFIED_BANDS, calculateRainyDays } from "../lib/rainyDays.js";
import { topLegendProps, xAxisLabel, yAxisLabel } from "./chartLabels.jsx";

const LINE = "#c63a2b";

const formatCount = (t, value) => t.number(Number(value), { maximumFractionDigits: 0 });

function YearTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{row.year}{row.isPartial ? ` (${t("partialYear")})` : ""}</strong>
      {CLASSIFIED_BANDS.map((band) => (
        <span key={band.id}>{band.label}: {row[band.id]}</span>
      ))}
      <span>{t("classifiedDays")}: {row.classifiedDays}</span>
      <span>{t("lightRainDays")}: {row.light}</span>
      <span>{t("rainDays")}: {row.rainDays}</span>
      <span>{t("observedDays")}: {row.observedDays}</span>
      <span>{t("coverage")}: {row.availableStart} – {row.availableEnd}</span>
    </div>
  );
}

function MonthTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="indicator-tooltip">
      <strong>{t("months")[row.month - 1]} · {t("yearCount", { count: row.yearCount })}</strong>
      <span>{row.available ? `${t("rainDaysAllYears")}: ${row.rainDays}` : t("chartMissingValue")}</span>
      <span>{t("rainDaysPerYear")}: {t.number(row.averagePerYear)}</span>
      <span>{t("shareOfDays")}: {t.number(row.sharePercent)}%</span>
      <span>{t("observedDays")}: {row.observedDays}{row.years.length ? ` (${row.years.join(", ")})` : ""}</span>
    </div>
  );
}

function TotalLabel({ t, x, y, width, value }) {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 7} textAnchor="middle" fill="#17242b" fontSize="11" fontWeight="700">
      {formatCount(t, value)}
    </text>
  );
}

export default function RainyDaysIndicator({ measurement, t }) {
  const result = useMemo(() => calculateRainyDays(measurement?.hourly), [measurement]);
  const monthlyData = useMemo(
    () => result.monthly.map((row) => ({ ...row, label: t("months")[row.month - 1] })),
    [result.monthly, t],
  );
  if (!result.yearly.length) return null;

  return (
    <section className="card landslide-indicator">
      <div className="indicator-grid">
        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>{t("rainyDaysTitle")}</h2>
            <p>{t("rainyDaysDesc")}</p>
          </div>
          <ChartFrame t={t} rows={result.yearly} columns={[{key:"year",label:"Year"},...CLASSIFIED_BANDS.map(b=>({key:b.id,label:b.label})),{key:"classifiedDays",label:"Days ≥30 mm"},{key:"light",label:"Days 1–<30 mm"},{key:"rainDays",label:"Total rain days ≥1 mm"},{key:"observedDays",label:"Observed days (reconstruction basis)"},{key:"availableStart",label:"Coverage start"},{key:"availableEnd",label:"Coverage end"},{key:"isPartial",label:"Partial year"}]} indicator="rainy-days-indicator-1" width="100%" height={340}>
            <BarChart data={result.yearly} margin={{ top: 30, right: 18, left: 40, bottom: 30 }}>
              <CartesianGrid stroke="#dce5ea" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickFormatter={(year) => {
                  const row = result.yearly.find((item) => item.year === year);
                  return row?.isPartial ? `${year}*` : String(year);
                }}
              />
              <YAxis width={60} allowDecimals={false} tick={{ fontSize: 12 }} label={yAxisLabel(t("rainyDaysAxis"))} />
              <Tooltip content={<YearTooltip t={t} />} />
              <Legend
                {...topLegendProps}
                payload={CLASSIFIED_BANDS.map((band) => ({ value: band.label, type: "square", color: band.color, id: band.id }))}
              />
              {CLASSIFIED_BANDS.map((band, index) => (
                <Bar key={band.id} dataKey={band.id} stackId="bands" fill={band.color} radius={index === CLASSIFIED_BANDS.length - 1 ? [4, 4, 0, 0] : undefined}>
                  {index === CLASSIFIED_BANDS.length - 1 && <LabelList dataKey="classifiedDays" content={<TotalLabel t={t} />} />}
                </Bar>
              ))}
            </BarChart>
          </ChartFrame>
          <p className="indicator-assumption">{t("partialYearExcluded")}</p>
        </div>

        <div className="indicator-panel">
          <div className="indicator-heading">
            <h2>{t("rainyDaysMonthlyTitle")}</h2>
            <p>{t("rainyDaysMonthlyDesc")}</p>
          </div>
          <ChartFrame t={t} rows={monthlyData} columns={[{key:"label",label:"Month"},{key:"rainDays",label:"Days ≥30 mm"},{key:"sharePercent",label:"Days ≥30 mm (%)"},{key:"averagePerYear",label:"Days ≥30 mm per year"},{key:"yearCount",label:"Contributing years"},{key:"years",label:"Years"},{key:"observedDays",label:"Observed days (reconstruction basis)"},{key:"available",label:"Available"}]} indicator="rainy-days-indicator-2" width="100%" height={340}>
            <ComposedChart data={monthlyData} margin={{ top: 30, right: 46, left: 40, bottom: 30 }}>
              <CartesianGrid stroke="#dce5ea" vertical={false} />
              <XAxis dataKey="label" tickFormatter={label => `${monthlyData.find(row => row.label === label)?.available ? "" : "× "}${label}`} interval={0} tick={{ fontSize: 11 }} label={xAxisLabel(t("month"), -14)} />
              <YAxis yAxisId="left" width={58} allowDecimals={false} tick={{ fontSize: 12 }} label={yAxisLabel(t("rainyDaysAxisAllYears"))} />
              <YAxis tickFormatter={(value) => t.number(value)}
                yAxisId="right"
                orientation="right"
                width={54}
                tick={{ fontSize: 12, fill: LINE }}
                unit="%"
                label={{ value: t("shareOfDays"), angle: 90, position: "insideRight", style: { textAnchor: "middle", fill: LINE, fontSize: 12, fontWeight: 600 } }}
              />
              <Tooltip filterNull={false} content={<MonthTooltip t={t} />} />
              {/* two scales on one plot, and neither the line nor the axes were
                  named anywhere: the legend now says which series reads against
                  which side */}
              <Legend
                {...topLegendProps}
                payload={[
                  { value: `${t("classifiedDays")} (${t("leftAxisSuffix")})`, type: "square", color: CHART_PALETTE.rainfall, id: "bars" },
                  { value: `${t("shareOfDays")} (${t("rightAxisSuffix")})`, type: "line", color: LINE, id: "share" },
                ]}
              />
              <Bar yAxisId="left" dataKey="rainDays" name={t("classifiedDays")} fill={CHART_PALETTE.rainfall} radius={[4, 4, 0, 0]}>
                {monthlyData.map((row) => <Cell key={row.month} fill={CHART_PALETTE.rainfall} />)}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="sharePercent" name={t("shareOfDays")} stroke={LINE} strokeWidth={2.4} dot={{ r: 3, fill: LINE }} isAnimationActive={false} />
            </ComposedChart>
          </ChartFrame>
          <p className="chart-axis-note">{t("dualAxisNote")}</p>
          {monthlyData.some(row => !row.available) && <p className="chart-axis-note">{t("missingMonthNote")}</p>}
        </div>
      </div>
      <p className="indicator-explanation">{t("rainyDaysExplanation")}</p>
      <p className="indicator-assumption">{t("rainyDaysAssumption")}</p>
    </section>
  );
}
