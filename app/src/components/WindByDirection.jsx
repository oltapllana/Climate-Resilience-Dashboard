import ChartFrame from "./ChartFrame.jsx";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { calculateWindByDirection } from "../lib/windByDirection.js";
import { xAxisLabel, yAxisLabel } from "./chartLabels.jsx";

const BLUE = "#2b7fc4";
const HIGHLIGHT = "#e8a33d";

const formatSpeed = (t, value) => t.number(Number(value), { maximumFractionDigits: 2 });

function DirectionTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (row.meanSpeed == null) return null;
  return (
    <div className="indicator-tooltip">
      <strong>{row.direction}</strong>
      <span>{t("meanSpeed")}: {formatSpeed(t, row.meanSpeed)} m/s</span>
      <span>{t("maxSpeed")}: {formatSpeed(t, row.maxSpeed)} m/s</span>
      <span>{t("shareOfObservations")}: {t.number(row.share)}%</span>
    </div>
  );
}

function BarLabel({ t, x, y, width, value }) {
  if (value == null) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#17242b" fontSize="10" fontWeight="700">
      {formatSpeed(t, value)}
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
          {t("strongestWindsFrom")}: <strong>{strongest.direction}</strong> ({formatSpeed(t, strongest.meanSpeed)} m/s)
        </p>
      )}
      <ChartFrame t={t} rows={result.directions} columns={[{"key":"direction","label":"Direction"},{"key":"meanSpeed","label":"Mean speed (m/s)"},{"key":"maxSpeed","label":"Maximum speed (m/s)"},{"key":"share","label":"Observations (%)"}]} indicator="wind-by-direction-1" width="100%" height={330}>
        <BarChart data={result.directions} margin={{ top: 26, right: 20, left: 44, bottom: 30 }}>
          <CartesianGrid stroke="#dce5ea" vertical={false} />
          <XAxis
            dataKey="direction"
            tick={{ fontSize: 11 }}
            label={xAxisLabel(t("windDirectionAxis"), -14)}
          />
          <YAxis
            width={64}
            tick={{ fontSize: 12 }}
            tickFormatter={formatSpeed.bind(null, t)}
            label={yAxisLabel(t("meanSpeedAxis"))}
          />
          <Tooltip content={<DirectionTooltip t={t} />} />
          <Bar dataKey="meanSpeed" radius={[4, 4, 0, 0]}>
            {result.directions.map((row) => (
              <Cell key={row.direction} fill={strongest && row.direction === strongest.direction ? HIGHLIGHT : BLUE} />
            ))}
            <LabelList content={<BarLabel t={t} />} />
          </Bar>
        </BarChart>
      </ChartFrame>
      <p className="indicator-explanation">{t("windByDirectionExplanation")}</p>
      <p className="indicator-assumption">
        {t("windByDirectionAssumption")} {t.number(result.count, { maximumFractionDigits: 3 })} {t("records").toLowerCase()}.
      </p>
    </section>
  );
}
