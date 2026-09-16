import { useMemo } from "react";
import ChartFrame from "./ChartFrame.jsx";
import { Area, CartesianGrid, ComposedChart, Legend, Line, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { calculateFloodFrequency } from "../lib/floodFrequency.js";
import { yAxisLabel } from "./chartLabels.jsx";

const CURVE = "#1e6f8c";
const BAND = "#cfdfe6";
const COMPLETE = "#c1452c";
const PARTIAL = "#7b8a95";

// Water-level 5 — annual maxima against return period, with a Gumbel fit. The
// record is six years long, so the extrapolation stops at three times that and
// the confidence band is drawn wide and first: the honest reading of this chart
// is how little a short record can say, not the number on the curve.
export default function FloodFrequencyChart({ measurement, unit, title, description, axisLabel, digits = 2, explanation, assumption, t }) {
  const result = useMemo(() => calculateFloodFrequency(measurement?.daily), [measurement]);
  if (!result.curve.length) return null;

  const format = (value) => t.number(Number(value), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const complete = result.points.filter((point) => !point.partial);
  const partial = result.points.filter((point) => point.partial);
  const gridTicks = [2, 5, 10, 20, 50].filter((tick) => tick <= result.maxReturnPeriod);

  function FrequencyTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    if (row.year == null) return null;
    return (
      <div className="indicator-tooltip">
        <strong>{row.year}{row.partial ? ` · ${t("partialYear")}` : ""}</strong>
        <span>{t("annualMaximum")}: {format(row.value)} {unit} ({row.date})</span>
        <span>{t("returnPeriod")}: {t.number(row.returnPeriod, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {t("yearsShort")}</span>
      </div>
    );
  }

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <p className="indicator-callout">
        {t("recordLength").replace("{n}", result.years)} · {t("completeYearsCount", { count: result.completeYears })} · {t("extrapolationCap").replace("{n}", result.maxReturnPeriod)}
      </p>
      <ChartFrame t={t} indicator="flood-frequency" rows={[
        ...result.curve.map(row => ({ ...row, series: "Gumbel fit" })),
        ...result.points.map(row => ({ ...row, series: "Annual maximum" })),
      ]} columns={[
        { key: "series", label: "Series" }, { key: "year", label: "Year" },
        { key: "date", label: "Date" }, { key: "returnPeriod", label: "Return period (years)" },
        { key: "value", label: `Value (${unit})` }, { key: "lower", label: `Lower confidence limit (${unit})` },
        { key: "upper", label: `Upper confidence limit (${unit})` }, { key: "partial", label: "Partial year" },
      ]} width="100%" height={380}>
        <ComposedChart data={result.curve} margin={{ top: 26, right: 30, left: 56, bottom: 40 }}>
          <CartesianGrid stroke="#eef2f6" />
          <XAxis
            dataKey="returnPeriod"
            type="number"
            scale="log"
            domain={[1.05, result.maxReturnPeriod]}
            ticks={[1.1, 2, 5, 10, 20, 50].filter((tick) => tick <= result.maxReturnPeriod)}
            tickFormatter={(value) => t.number(value)}
            tick={{ fontSize: 11 }}
            label={{ value: t("returnPeriodAxis"), position: "insideBottom", offset: -8, fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            width={74}
            type="number"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => t.number(Number(value), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            label={yAxisLabel(axisLabel)}
          />
          <Tooltip content={<FrequencyTooltip />} />
          <Legend verticalAlign="top" align="left" height={26} />
          {/* the interval is drawn as a transparent pad up to its lower edge
              plus the band above it, since recharts areas fill to the axis */}
          <Area dataKey="lower" stackId="ci" stroke="none" fill="transparent" legendType="none" isAnimationActive={false} />
          <Area dataKey="band" stackId="ci" name={t("confidenceBand")} stroke="none" fill={BAND} fillOpacity={0.75} isAnimationActive={false} />
          <Line dataKey="value" name={t("gumbelFit")} stroke={CURVE} strokeWidth={2.4} dot={false} isAnimationActive={false} />
          <Scatter data={complete} dataKey="value" name={t("completeYearMax")} fill={COMPLETE} isAnimationActive={false} />
          <Scatter data={partial} dataKey="value" name={t("partialYearMax")} fill={PARTIAL} shape="triangle" isAnimationActive={false} />
        </ComposedChart>
      </ChartFrame>
      {gridTicks.length > 0 && (
        <p className="indicator-callout">
          {gridTicks.map((years) => {
            const point = result.curve.reduce((best, row) => (Math.abs(row.returnPeriod - years) < Math.abs(best.returnPeriod - years) ? row : best), result.curve[0]);
            return `${years} ${t("yearsShort")}: ${format(point.value)} ${unit}`;
          }).join(" · ")}
        </p>
      )}
      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("coverage")}: {result.start} – {result.end}.
      </p>
    </section>
  );
}
