import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ErrorBar, Label, Legend, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateMonthlyMeanProfile } from "../lib/monthlyMeanProfile.js";
import { SEASON_DEFINITIONS, seasonOf } from "../lib/seasons.js";

// Rrezatimi 2 — monthly means with the between-year standard deviation as
// whiskers, bars coloured by meteorological season.
export default function MonthlyMeanProfile({ measurement, unit, title, description, axisLabel, explanation, assumption, digits = 0, t }) {
  const result = useMemo(() => calculateMonthlyMeanProfile(measurement?.daily), [measurement]);

  const data = useMemo(
    () => result.monthly.map((row) => {
      const season = seasonOf(row.monthNumber);
      return { ...row, label: t("monthsFull")[row.monthNumber - 1], season: season.id, color: season.color };
    }),
    [result.monthly, t],
  );

  if (!data.some((row) => row.mean != null)) return null;
  const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
  const { max, min } = result;

  const highs = data.filter((row) => row.mean != null).map((row) => row.high);
  const headroom = Math.max(...highs) * 1.14;

  function MonthTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    if (row.mean == null) return null;
    return (
      <div className="indicator-tooltip">
        <strong>{row.label}</strong>
        <span>{t("mean")}: {format(row.mean)} {unit}</span>
        <span>± {format(row.stdDev)} {unit} ({t("standardDeviation")})</span>
        <span>{t(row.season)}</span>
        <span>{t("completeYearsCounted")}: {row.yearCount}{row.years.length ? ` (${row.years.join(", ")})` : ""}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {max && min && (
        <p className="indicator-callout">
          {t("max")}: <strong>{max ? t("monthsFull")[max.monthNumber - 1] : ""} ({format(max.mean)} {unit})</strong> · {t("min")}: <strong>{t("monthsFull")[min.monthNumber - 1]} ({format(min.mean)} {unit})</strong>
        </p>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 30, right: 26, left: 50, bottom: 42 }}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="label" interval={0} tick={{ fontSize: 10 }} tickMargin={8} angle={-30} textAnchor="end" height={56} />
          <YAxis
            width={72}
            domain={[0, Math.ceil(headroom / 50) * 50]}
            tick={{ fontSize: 11 }}
            tickFormatter={format}
            label={{ value: axisLabel, angle: -90, position: "insideLeft", offset: -10 }}
          />
          <Tooltip content={<MonthTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
          <Legend
            verticalAlign="top"
            align="left"
            height={26}
            payload={SEASON_DEFINITIONS.map((season) => ({ value: t(season.id), type: "square", color: season.color }))}
          />
          <Bar dataKey="mean" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((row) => <Cell key={row.monthNumber} fill={row.color} />)}
            <ErrorBar dataKey="stdDev" width={5} strokeWidth={1.3} stroke="#2f3b44" direction="y" />
          </Bar>
          {max && (
            <ReferenceDot x={t("monthsFull")[max.monthNumber - 1]} y={max.high} r={0} isFront>
              <Label
                value={`${t("max")}: ${t("monthsFull")[max.monthNumber - 1]} (${format(max.mean)} ${unit})`}
                position="top"
                offset={12}
                fill="#c0392b"
                fontSize={11}
                fontWeight={700}
              />
            </ReferenceDot>
          )}
          {min && (
            <ReferenceDot x={t("monthsFull")[min.monthNumber - 1]} y={min.high} r={0} isFront>
              <Label
                value={`${t("min")}: ${t("monthsFull")[min.monthNumber - 1]} (${format(min.mean)} ${unit})`}
                position="top"
                offset={12}
                fill="#1f6fb2"
                fontSize={11}
                fontWeight={700}
              />
            </ReferenceDot>
          )}
        </BarChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.firstDate} – {result.lastDate}.
        {result.skippedMonths > 0 && ` ${t("monthlyProfileSkipped").replace("{n}", result.skippedMonths)}`}
      </p>
    </section>
  );
}
