import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CLASSIFIED_BANDS, INTENSITY_BANDS, bandOf, calculateRainyDays } from "../lib/rainyDays.js";

// Reshje — the wettest days on record, ranked. Bars carry the same band colours
// as the yearly rain-day chart, so a red bar means the same thing in both.
export const DEFAULT_TOP_DAYS = 15;

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
      color: (bandOf(row.total) ?? INTENSITY_BANDS[0]).color,
    }));
  }, [result.daily, count, t]);

  if (!data.length) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
  const largest = data[0].total;
  const showThreshold = largest >= HIGH_RAINFALL_MM;

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
    const band = bandOf(row.total);
    return (
      <div className="indicator-tooltip">
        <strong>{row.label}</strong>
        <span>{t("dailyRainfallAxis")}: {format(row.total)} mm</span>
        {band && <span>{band.label}</span>}
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("topRainDaysTitle").replace("{n}", count)}</h2>
        <p>{t("topRainDaysDesc")}</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(330, data.length * 27 + 96)}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 96, left: 90, bottom: 36 }}>
          <CartesianGrid stroke="#eef2f6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, Math.ceil(largest * 1.06)]}
            tick={{ fontSize: 10 }}
            label={{ value: t("dailyRainfallAxis"), position: "insideBottom", offset: -18, fontSize: 12, fontWeight: 600 }}
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
          <Legend
            verticalAlign="top"
            height={26}
            payload={CLASSIFIED_BANDS.map((band) => ({ value: band.label, type: "square", color: band.color }))}
          />
          {showThreshold && (
            <ReferenceLine
              x={HIGH_RAINFALL_MM}
              stroke="#d64545"
              strokeDasharray="5 4"
              label={{ value: t("highRainfallMarker"), position: "top", fill: "#d64545", fontSize: 10, fontWeight: 700 }}
            />
          )}
          <Bar dataKey="total" barSize={15} radius={[0, 3, 3, 0]} isAnimationActive={false}>
            {data.map((row) => <Cell key={row.date} fill={row.color} />)}
            <LabelList content={<ValueLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("topRainDaysExplanation")}</p>
      <p className="indicator-assumption">{t("topRainDaysAssumption")}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.daily[0].date} – {result.daily.at(-1).date}.
      </p>
    </section>
  );
}
