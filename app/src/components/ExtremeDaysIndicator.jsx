import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DEFAULT_EXTREME_COUNT, calculateExtremeDays } from "../lib/extremeDays.js";

// Temperatura 5 — the coldest and hottest days on record, cold bars below the
// zero line and hot bars above it.
const COLD = "#1f77b4";
const HEAT = "#d62728";

const formatTemp = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const asDayMonthYear = (date) => `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`;

export default function ExtremeDaysIndicator({ measurement, count = DEFAULT_EXTREME_COUNT, t }) {
  const result = useMemo(() => calculateExtremeDays(measurement?.hourly, count), [measurement, count]);
  const data = useMemo(
    () => result.rows.map((row) => ({ ...row, label: asDayMonthYear(row.date) })),
    [result.rows],
  );
  if (!data.length) return null;

  const values = data.map((row) => row.value);
  const domain = [Math.floor(Math.min(...values)) - 5, Math.ceil(Math.max(...values)) + 5];

  // A negative bar hangs below the zero line, so its label sits under the bar's
  // lower edge; a positive bar's label sits above its top edge.
  function ValueLabel({ x, y, width, height, value }) {
    return (
      <text
        x={x + width / 2}
        y={value < 0 ? y + height + 13 : y - 6}
        textAnchor="middle"
        fill="#3f4d57"
        fontSize="10"
        fontWeight="600"
      >
        {formatTemp(value)}°C
      </text>
    );
  }

  function ExtremeTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.label}</strong>
        <span>{row.type === "cold" ? t("dailyMinimumShort") : t("dailyMaximumShort")}: {formatTemp(row.value)} °C</span>
        <span>{row.type === "cold" ? t("coldestDaysLegend") : t("hottestDaysLegend")}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("extremeDaysTitle").replace(/\{n\}/g, count)}</h2>
        <p>{t("extremeDaysDesc")}</p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 26, right: 24, left: 46, bottom: 42 }}>
          <CartesianGrid stroke="#e6ecf0" vertical={false} />
          <XAxis
            dataKey="label"
            interval={0}
            tick={{ fontSize: 10 }}
            tickMargin={8}
            label={{ value: t("date"), position: "insideBottom", offset: -22, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={68}
            domain={domain}
            tick={{ fontSize: 11 }}
            label={{ value: t("airTemperatureAxis"), angle: -90, position: "insideLeft", offset: -10 }}
          />
          <Tooltip content={<ExtremeTooltip />} cursor={{ fill: "rgba(15,23,42,0.05)" }} />
          <Legend
            verticalAlign="top"
            height={26}
            payload={[
              { value: t("coldestDaysLegend"), type: "square", color: COLD },
              { value: t("hottestDaysLegend"), type: "square", color: HEAT },
            ]}
          />
          <ReferenceLine y={0} stroke={COLD} strokeWidth={1.2} />
          <Bar dataKey="value" isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={`${row.type}-${row.date}`} fill={row.type === "cold" ? COLD : HEAT} />
            ))}
            <LabelList content={<ValueLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("extremeDaysExplanation")}</p>
      <p className="indicator-assumption">
        {t("extremeDaysAssumption")
          .replace("{days}", result.observedDays.toLocaleString())
          .replace("{start}", result.firstDate)
          .replace("{end}", result.lastDate)}
      </p>
    </section>
  );
}
