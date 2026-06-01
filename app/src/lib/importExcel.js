// Client-side import: read an Excel/txt sensor file in the browser and turn it
// into the same station object shape the built-in JSON uses, so the dashboard
// can render it directly. Supports both raw formats found in the dataset:
//   (A) "Llap" format: header block then rows of  <dd.mm.yyyy HH:MM:SS> <value> <unit>
//   (B) "Shajkoc" format: columns  Station | Datee | CorrValue | StationName
// plus a generic 2-column <timestamp> <value> sheet.

import * as XLSX from "xlsx";

// measurement catalogue (mirrors etl/build_data.py MEAS)
const MEAS = {
  water_level:   { label_en: "Water level",         label_sq: "Niveli i ujit",          unit: "m",      cat: "hydro", kind: "avg" },
  water_temp:    { label_en: "Water temperature",   label_sq: "Temperatura e ujit",     unit: "°C",     cat: "hydro", kind: "avg" },
  conductivity:  { label_en: "Conductivity",        label_sq: "Përçueshmëria",          unit: "mS",     cat: "hydro", kind: "avg" },
  salinity:      { label_en: "Salinity",            label_sq: "Kripshmëria",            unit: "SAL",    cat: "hydro", kind: "avg" },
  tds:           { label_en: "TDS",                 label_sq: "TDS",                    unit: "g/l",    cat: "hydro", kind: "avg" },
  air_temp:      { label_en: "Air temperature",     label_sq: "Temperatura e ajrit",    unit: "°C",     cat: "meteo", kind: "avg" },
  rainfall:      { label_en: "Rainfall",            label_sq: "Reshjet",                unit: "mm",     cat: "meteo", kind: "sum" },
  rain_intensity:{ label_en: "Rainfall intensity",  label_sq: "Intensiteti i reshjeve", unit: "mm/min", cat: "meteo", kind: "avg" },
  humidity:      { label_en: "Humidity",            label_sq: "Lagështia",              unit: "%",      cat: "meteo", kind: "avg" },
  pressure:      { label_en: "Air pressure",        label_sq: "Shtypja e ajrit",        unit: "hPa",    cat: "meteo", kind: "avg" },
  solar:         { label_en: "Solar radiation",     label_sq: "Rrezatimi diellor",      unit: "W/m²",   cat: "meteo", kind: "avg" },
  wind_speed:    { label_en: "Wind speed",          label_sq: "Shpejtësia e erës",      unit: "m/s",    cat: "meteo", kind: "avg" },
  wind_dir:      { label_en: "Wind direction",      label_sq: "Drejtimi i erës",        unit: "°",      cat: "meteo", kind: "avg" },
  generic:       { label_en: "Value",               label_sq: "Vlera",                  unit: "",       cat: "meteo", kind: "avg" },
};

function guessMeasId(...texts) {
  const s = texts.join(" ").toLowerCase();
  const has = (...k) => k.some((w) => s.includes(w));
  if (has("intensit")) return "rain_intensity";
  if (has("reshj", "rain", "precip", "rainfall")) return "rainfall";
  if (has("nivel", "level", "water_level")) return "water_level";
  if (has("water_temp", "temp_ujit", "uji", "water temperature")) return "water_temp";
  if (has("conduct", "përçue", "percue")) return "conductivity";
  if (has("salin", "krip")) return "salinity";
  if (has("tds")) return "tds";
  if (has("lagesht", "humid")) return "humidity";
  if (has("shtypj", "pressure", "presion")) return "pressure";
  if (has("solar", "rrezat", "radiation")) return "solar";
  if (has("shpejtesi", "wind speed", "shpejtësi")) return "wind_speed";
  if (has("drejtim", "direction", "wind dir")) return "wind_dir";
  if (has("temperatur", "temp", "ajri", "air")) return "air_temp";
  return "generic";
}

// ---- date parsing ---------------------------------------------------------
function parseTs(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF ? XLSX.SSF.parse_date_code(v) : null;
    if (d) return new Date(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, Math.floor(d.S || 0));
    return null;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function num(v) {
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (v == null) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : null;
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const round = (v) => (v == null ? null : Math.round(v * 1000) / 1000);

// ---- aggregation (mirrors etl/build_data.py aggregate) --------------------
function aggregate(samples, kind) {
  samples.sort((a, b) => a.ts - b.ts);
  const dayG = {}, monG = {}, climG = {};
  for (const { ts, val } of samples) {
    const dk = ymd(ts), mk = ym(ts), mo = ts.getMonth() + 1;
    (dayG[dk] = dayG[dk] || []).push(val);
    (monG[mk] = monG[mk] || []).push(val);
    (climG[mo] = climG[mo] || []).push(val);
  }
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const mean = (a) => sum(a) / a.length;

  const daily = Object.keys(dayG).sort().map((d) => {
    const a = dayG[d];
    return kind === "sum"
      ? { d, v: round(sum(a)) }
      : { d, v: round(mean(a)), lo: round(Math.min(...a)), hi: round(Math.max(...a)) };
  });
  const monthly = Object.keys(monG).sort().map((m) => ({ m, v: round(kind === "sum" ? sum(monG[m]) : mean(monG[m])) }));

  const nMonths = Object.keys(monG).length || 1;
  const climatology = Object.keys(climG).map(Number).sort((a, b) => a - b).map((mo) => {
    const a = climG[mo];
    return { month: mo, v: round(kind === "sum" ? sum(a) / nMonths : mean(a)) };
  });

  const all = samples.map((s) => s.val);
  const stats = {
    count: samples.length,
    start: ymd(samples[0].ts),
    end: ymd(samples[samples.length - 1].ts),
    min: round(Math.min(...all)),
    max: round(Math.max(...all)),
    mean: round(mean(all)),
    overall: round(kind === "sum" ? sum(all) : mean(all)),
  };
  return { daily, monthly, climatology, stats };
}

// ---- sheet -> samples -----------------------------------------------------
function rowsToSamples(rows) {
  // returns { samples, unit } from an array-of-arrays sheet
  // detect Shajkoc header
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const r = (rows[i] || []).map((c) => String(c).toLowerCase());
    if (r.some((c) => c.includes("datee")) && r.some((c) => c.includes("corrvalue"))) {
      headerIdx = i;
      break;
    }
  }
  const samples = [];
  let unit = "";
  if (headerIdx >= 0) {
    const head = rows[headerIdx].map((c) => String(c).toLowerCase());
    const di = head.findIndex((c) => c.includes("datee"));
    const vi = head.findIndex((c) => c.includes("corrvalue"));
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const ts = parseTs(rows[i][di]);
      const val = num(rows[i][vi]);
      if (ts && val != null) samples.push({ ts, val });
    }
    return { samples, unit };
  }
  // Llap / generic: find first row whose col0 looks like a date
  for (let i = 0; i < rows.length; i++) {
    const c0 = rows[i][0];
    const ts = parseTs(c0);
    if (ts && c0 != null && /\d/.test(String(c0))) {
      const val = num(rows[i][1]);
      if (val != null) {
        samples.push({ ts, val });
        if (!unit && rows[i][2]) unit = String(rows[i][2]).trim();
      }
    }
  }
  return { samples, unit };
}

function stationMeta(rows) {
  // try to read "Station name :" from Llap header
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const c0 = String(rows[i][0] || "");
    if (c0.toLowerCase().includes("station name")) return String(rows[i][1] || "").trim();
  }
  return "";
}

// ---- public API -----------------------------------------------------------
export async function importWorkbook(file, { lat = 42.663, lon = 21.162 } = {}) {
  // default location = Prishtina center (imported stations placed here unless edited)
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  const baseName = file.name.replace(/\.[^.]+$/, "");

  const measurements = {};
  let type = "meteo";
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    if (!rows.length) continue;
    const { samples, unit } = rowsToSamples(rows);
    if (samples.length < 2) continue;

    const metaName = stationMeta(rows);
    const measId = guessMeasId(sheetName, metaName, baseName, unit);
    const def = MEAS[measId] || MEAS.generic;
    const agg = aggregate(samples, def.kind);

    // ensure a unique key if the same measurement appears twice
    let key = measId;
    let n = 2;
    while (measurements[key]) key = `${measId}_${n++}`;

    measurements[key] = {
      label_en: def.label_en + (key !== measId ? ` (${sheetName})` : ""),
      label_sq: def.label_sq + (key !== measId ? ` (${sheetName})` : ""),
      unit: unit || def.unit,
      cat: def.cat,
      kind: def.kind,
      ...agg,
    };
    if (def.cat === "hydro") type = "hydro";
  }

  if (!Object.keys(measurements).length) {
    throw new Error("No recognizable time-series found in this file.");
  }

  const id = "imported_" + baseName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return {
    id,
    name_en: baseName,
    name_sq: baseName,
    lat,
    lon,
    type,
    imported: true,
    measurements,
  };
}
