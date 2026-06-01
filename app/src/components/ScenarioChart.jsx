import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { scenarioClimatology, forecast } from "../lib/projection.js";

// Combined "climate scenarios" panel: a monthly (1–12) profile with the
// historic line plus RCP4.5/RCP8.5 projected period lines, a scenario toggle,
// and a next-5-months forecast — mirroring the reference dashboard's layout.

export default function ScenarioChart({ meas, t, unit, label }) {
  const [scenario, setScenario] = useState("all");

  const scen = useMemo(() => scenarioClimatology(meas, scenario), [meas, scenario]);
  const fc = useMemo(() => forecast(meas, 5), [meas]);

  // merge scenario lines into one dataset keyed by month
  const climData = scen.lines[0].data.map((_, i) => {
    const row = { month: t("months")[i] };
    scen.lines.forEach((ln) => (row[ln.period] = ln.data[i].v));
    return row;
  });

  return (
    <div className="card">
      <div className="section-title">
        <h2>{t("scenarioTitle")}</h2>
      </div>
      <p className="desc">
        {t("scenarioDesc")} · {label} ({unit})
      </p>

      <div className="seg" style={{ marginBottom: 8 }}>
        {["all", "rcp45", "rcp85"].map((s) => (
          <button key={s} className={scenario === s ? "active" : ""} onClick={() => setScenario(s)}>
            {s === "all" ? t("allScenarios") : s === "rcp45" ? "RCP4.5" : "RCP8.5"}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={270}>
        <LineChart data={climData} margin={{ top: 6, right: 14, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={44} />
          <Tooltip formatter={(v) => `${v == null ? "—" : v} ${unit}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {scen.lines.map((ln) => (
            <Line
              key={ln.period}
              type="monotone"
              dataKey={ln.period}
              name={ln.period === "historic" ? `${ln.label} (${t("historic")})` : `${ln.label} (${scenario === "all" ? t("allScenarios") : scenario === "rcp45" ? "RCP4.5" : "RCP8.5"})`}
              stroke={ln.color}
              strokeWidth={ln.period === "historic" ? 2.5 : 2}
              dot={{ r: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* next 5 months forecast */}
      <div className="section-title" style={{ marginTop: 14 }}>
        <h2 style={{ fontSize: 15 }}>{t("forecastTitle")}</h2>
      </div>
      <p className="desc">{t("forecastDesc")}</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={fc.rows} margin={{ top: 6, right: 14, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" />
          <XAxis dataKey="m" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 12 }} width={44} />
          <Tooltip formatter={(v) => (v == null ? "—" : `${v} ${unit}`)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="actual" name={t("observed")} stroke="#2f7d32" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="rcp45" name="RCP4.5" stroke="#2bb6d8" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} connectNulls />
          <Line type="monotone" dataKey="rcp85" name="RCP8.5" stroke="#d6453d" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <p className="desc" style={{ marginTop: 8, fontStyle: "italic" }}>
        {t("projectionNote")}
      </p>
    </div>
  );
}
