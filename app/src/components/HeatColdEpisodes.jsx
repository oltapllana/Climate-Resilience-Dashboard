import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  COLD_PERIOD_MIN_DAYS, COLD_PERIOD_THRESHOLD_C,
  HEAT_WAVE_MIN_DAYS, HEAT_WAVE_THRESHOLD_C,
  calculateHeatStress,
} from "../lib/heatStress.js";

// Temperatura 4/5 — individual heat waves and cold periods as a ranked
// timeline. The review's two complaints about the original were overlapping
// text and no colour distinction between the categories, so the episode label
// lives on the axis (never over a bar) and the two types are red and blue.
const HEAT = "#d62728";
const COLD = "#1f77b4";

const formatTemp = (value) => `${value > 0 ? "+" : ""}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
const asDayMonthYear = (date) => `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`;

export const MAX_EPISODES_PER_TYPE = 6;

export default function HeatColdEpisodes({ measurement, t }) {
  const result = useMemo(() => calculateHeatStress(measurement?.hourly), [measurement]);

  // A five-year record throws off far more qualifying episodes than fit on one
  // readable chart, so only the longest few of each type are drawn. The count
  // left out is stated below the chart rather than silently dropped.
  const data = useMemo(() => {
    const take = (type) => result.episodes.filter((episode) => episode.type === type).slice(0, MAX_EPISODES_PER_TYPE);
    return [...take("heat"), ...take("cold")].map((episode, index) => ({
      ...episode,
      // the y axis is categorical, so identical date ranges still need unique keys
      key: `${episode.type}-${episode.startDate}-${index}`,
      title: episode.type === "heat" ? t("heatWaveLabel") : t("coldPeriodLabel"),
      range: `${asDayMonthYear(episode.startDate)} – ${asDayMonthYear(episode.endDate)}`,
    }));
  }, [result.episodes, t]);

  if (!data.length) return null;
  const hiddenCount = result.episodes.length - data.length;

  function EpisodeTick({ x, y, payload }) {
    const row = data.find((item) => item.key === payload.value);
    if (!row) return null;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={-8} y={-4} textAnchor="end" fill="#17242b" fontSize="10.5" fontWeight="700">{row.title}</text>
        <text x={-8} y={9} textAnchor="end" fill="#5b6b78" fontSize="10">{row.range}</text>
      </g>
    );
  }

  function BarLabel({ x, y, width, height, index }) {
    const row = data[index];
    if (!row) return null;
    return (
      <text x={x + width + 8} y={y + height / 2 + 4} fill="#17242b" fontSize="10.5" fontWeight="600">
        {row.length} {t("days")} · {t("peakShort")}: {formatTemp(row.peak)}°C
      </text>
    );
  }

  function EpisodeTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="indicator-tooltip">
        <strong>{row.title}</strong>
        <span>{row.range}</span>
        <span>{t("duration")}: {row.length} {t("days")}</span>
        <span>{t("peakShort")}: {formatTemp(row.peak)} °C</span>
      </div>
    );
  }

  const longest = Math.max(...data.map((row) => row.length));

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("episodesTitle")}</h2>
        <p>{t("episodesDesc")}</p>
      </div>
      <p className="indicator-callout">
        {t("episodesDefinition")
          .replace("{heatDays}", HEAT_WAVE_MIN_DAYS)
          .replace("{heatThreshold}", HEAT_WAVE_THRESHOLD_C)
          .replace("{coldDays}", COLD_PERIOD_MIN_DAYS)
          .replace("{coldThreshold}", COLD_PERIOD_THRESHOLD_C)}
      </p>
      <ResponsiveContainer width="100%" height={Math.max(320, data.length * 42 + 90)}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 150, left: 128, bottom: 34 }}>
          <CartesianGrid stroke="#dce5ea" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, Math.ceil(longest * 1.05)]}
            tick={{ fontSize: 11 }}
            label={{ value: t("durationAxis"), position: "insideBottom", offset: -16, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis type="category" dataKey="key" width={120} tickLine={false} interval={0} tick={<EpisodeTick />} />
          <Tooltip content={<EpisodeTooltip />} cursor={{ fill: "rgba(15,23,42,0.05)" }} />
          <Legend
            verticalAlign="top"
            height={26}
            payload={[
              { value: t("heatWaveLabel"), type: "square", color: HEAT },
              { value: t("coldPeriodLabel"), type: "square", color: COLD },
            ]}
          />
          <Bar dataKey="length" barSize={20} radius={[0, 3, 3, 0]} isAnimationActive={false}>
            {data.map((row) => <Cell key={row.key} fill={row.type === "heat" ? HEAT : COLD} />)}
            <LabelList content={<BarLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("episodesExplanation")}</p>
      <p className="indicator-assumption">
        {t("episodesAssumption")
          .replace("{heat}", result.heatWaves.length)
          .replace("{cold}", result.coldPeriods.length)}
        {hiddenCount > 0 && ` ${t("episodesTruncated").replace("{shown}", MAX_EPISODES_PER_TYPE).replace("{hidden}", hiddenCount)}`}
      </p>
    </section>
  );
}
