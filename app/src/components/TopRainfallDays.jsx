import ChartFrame from "./ChartFrame.jsx";
import Methodology from "./Methodology.jsx";
import { CHART_PALETTE, REFERENCE_DASH } from "../lib/chartPalette.js";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { INTENSITY_BANDS, bandOf, calculateRainyDays } from "../lib/rainyDays.js";
import { axisScale } from "../lib/chartAxis.js";
import { topLegendProps, xAxisLabel } from "./chartLabels.jsx";

// Reshje — the wettest days on record, ranked. Bars carry the same band colours
// as the yearly rain-day chart, so a red bar means the same thing in both.
export const DEFAULT_TOP_DAYS = 15;

const BELOW_RAIN_DAY = { id: "belowRainDay", color: CHART_PALETTE.severity.light };
const rankedBand = total => bandOf(total) ?? BELOW_RAIN_DAY;
const bandLabelKey = {
  belowRainDay: "rainBandBelow",
  light: "rainBandLight",
  moderate: "rainBandModerate",
  heavy: "rainBandHeavy",
  extreme: "rainBandExtreme",
};

// The top classified band doubles as the high-rainfall marker: no new threshold
// is invented, it is the ">80 mm" boundary already in use.
const HIGH_RAINFALL_MM = 80;

const asDayMonthYear = (date, t) =>
  `${date.slice(8, 10)} ${t("months")[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;

export default function TopRainfallDays({ measurement, count = DEFAULT_TOP_DAYS, t }) {
  const result = useMemo(() => calculateRainyDays(measurement?.hourly), [measurement]);

  const data = useMemo(() => {
    const ranked = [...result.daily]
      .sort((a, b) => b.total - a.total || a.date.localeCompare(b.date))
      .slice(0, count);
    return ranked.map((row) => ({
      ...row,
      label: asDayMonthYear(row.date, t),
      color: rankedBand(row.total).color,
    }));
  }, [result.daily, count, t]);

  if (!data.length) return null;

  const format = (value) => t.number(Number(value), { maximumFractionDigits: 1 });
  const largest = data[0].total;
  const showThreshold = largest >= HIGH_RAINFALL_MM;
  const rainfallScale = axisScale(data.map((row) => row.total), { unit: "mm", includeZero: true });

  function ValueLabel({ x, y, width, height, value }) {
    return (
      <text x={x + width + 7} y={y + height / 2 + 4} fill="#17242b" fontSize="10.5" fontWeight="700">
        {format(value)} mm
      </text>
    );
  }

  function DayTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    const band = rankedBand(row.total);
    return (
      <div className="indicator-tooltip">
        <strong>{row.label}</strong>
        <span>{t("dailyRainfallAxis")}: {format(row.total)} mm</span>
        {band && <span>{t(bandLabelKey[band.id])}</span>}
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("topRainDaysTitle").replace("{n}", count)}</h2>
        <p>{t("topRainDaysDesc")}</p>
      </div>
      <ChartFrame t={t} rows={data} columns={[{"key":"date","label":"Date"},{"key":"total","label":"Rainfall (mm)"},{key:"category",label:"Rainfall band",value:row=>t(bandLabelKey[rankedBand(row.total).id])}]} indicator="top-rainfall-days-1" width="100%" height={Math.max(354, data.length * 27 + 120)}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 96, left: 90, bottom: 36 }}>
          <CartesianGrid stroke="#eef2f6" horizontal={false} />
          <XAxis tickFormatter={(value) => t.number(value)}
            type="number"
            domain={rainfallScale.domain}
            ticks={rainfallScale.ticks}
            tick={{ fontSize: 10 }}
            label={xAxisLabel(t("dailyRainfallAxis"), -18)}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={88}
            interval={0}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#3f4d57" }}
          />
          <Tooltip content={<DayTooltip />} cursor={{ fill: "rgba(15,23,42,0.05)" }} />
          {/* topLegendProps reserves a gap under the swatches: the 80 mm
              marker prints its label at the top of the plot, and at 26px it
              landed on the "> 80 mm" entry of the legend. */}
          <Legend
            {...topLegendProps}
            payload={[...(data.some(row => row.total < 1) ? [BELOW_RAIN_DAY] : []), ...INTENSITY_BANDS].map((band) => ({ value: t(bandLabelKey[band.id]), type: "square", color: band.color }))}
          />
          {showThreshold && (
            <ReferenceLine
              x={HIGH_RAINFALL_MM}
              stroke={CHART_PALETTE.reference}
              strokeDasharray={REFERENCE_DASH}
              label={{ value: t("highRainfallMarker"), position: "top", fill: CHART_PALETTE.reference, fontSize: 10, fontWeight: 700 }}
            />
          )}
          <Bar dataKey="total" barSize={15} radius={[0, 3, 3, 0]} isAnimationActive={false}>
            {data.map((row) => <Cell key={row.date} fill={row.color} />)}
            <LabelList content={<ValueLabel />} />
          </Bar>
        </BarChart>
      </ChartFrame>
      <Methodology t={t}>
        <p className="indicator-explanation">{t("topRainDaysExplanation")}</p>
        <p className="indicator-assumption">{t("topRainDaysAssumption")}</p>
      </Methodology>
      <p className="indicator-assumption">
        {t("coverage")}: {result.daily[0].date} – {result.daily.at(-1).date}.
      </p>
    </section>
  );
}
