import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateWindByDirection } from "../lib/windByDirection.js";

const BLUE = "#2b7fc4";
const HIGHLIGHT = "#e8a33d";

const formatSpeed = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

function DirectionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (row.meanSpeed == null) return null;
  return (
    <div className="indicator-tooltip">
      <strong>{row.direction}</strong>
      <span>Mean speed: {formatSpeed(row.meanSpeed)} m/s</span>
      <span>Max speed: {formatSpeed(row.maxSpeed)} m/s</span>
      <span>Share of observations: {row.share}%</span>
    </div>
  );
}

function BarLabel({ x, y, width, value }) {
  if (value == null) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#17242b" fontSize="10" fontWeight="700">
      {formatSpeed(value)}
    </text>
  );
}

export default function WindByDirection({ directionMeasurement, speedMeasurement, t }) {
  const result = useMemo(() => {
    // hourly is the finer record; daily is the fallback for imported stations
    const hourly = calculateWindByDirection(directionMeasurement, speedMeasurement, "hourly");
    return hourly.count ? hourly : calculateWindByDirection(directionMeasurement, speedMeasurement, "daily");
  }, [directionMeasurement, speedMeasurement]);

  if (!result.count) return null;
  const { strongest } = result;

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{t("windByDirectionTitle")}</h2>
        <p>{t("windByDirectionDesc")}</p>
      </div>
      {strongest && (
        <p className="indicator-callout">
          {t("strongestWindsFrom")}: <strong>{strongest.direction}</strong> ({formatSpeed(strongest.meanSpeed)} m/s)
        </p>
      )}
      <ResponsiveContainer width="100%" height={330}>
        <BarChart data={result.directions} margin={{ top: 26, right: 20, left: 44, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" vertical={false} />
          <XAxis
            dataKey="direction"
            tick={{ fontSize: 11 }}
            label={{ value: t("windDirectionAxis"), position: "insideBottom", offset: -14, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={64}
            tick={{ fontSize: 12 }}
            tickFormatter={formatSpeed}
            label={{ value: t("meanSpeedAxis"), angle: -90, position: "insideLeft", offset: -12 }}
          />
          <Tooltip content={<DirectionTooltip />} />
          <Bar dataKey="meanSpeed" radius={[4, 4, 0, 0]}>
            {result.directions.map((row) => (
              <Cell key={row.direction} fill={strongest && row.direction === strongest.direction ? HIGHLIGHT : BLUE} />
            ))}
            <LabelList content={<BarLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="indicator-explanation">{t("windByDirectionExplanation")}</p>
      <p className="indicator-assumption">
        {t("windByDirectionAssumption")} {result.count.toLocaleString()} {t("records").toLowerCase()}.
      </p>
    </section>
  );
}
