// Client-side import: read an Excel/txt sensor file in the browser and turn it
// into the same station object shape the built-in JSON uses, so the dashboard
// can render it directly. Supports both raw formats found in the dataset:
//   (A) "Llap" format: header block then rows of  <dd.mm.yyyy HH:MM:SS> <value> <unit>
//   (B) "Shajkoc" format: columns  Station | Datee | CorrValue | StationName
// plus a generic 2-column <timestamp> <value> sheet.

import * as XLSX from "xlsx";

// measurement catalogue (mirrors etl/build_data.py MEAS)
//
// `qc` is the physically plausible range for a single sample: sensor dropouts
// otherwise enter the aggregates as real observations (the Podujevë air-temp
// file carries a -55 °C reading, which set the station minimum and stretched
// the daily min/max band). Samples outside the range are discarded.
//
// `circular` marks a direction in degrees. It must NOT be averaged
// arithmetically -- the mean of 350° and 10° is 0° (north), not 180° (south).
const MEAS = {
  water_level:   { label_en: "Water level",         label_sq: "Niveli i ujit",          unit: "m",      cat: "hydro", kind: "avg", qc: [-10, 50] },
  water_temp:    { label_en: "Water temperature",   label_sq: "Temperatura e ujit",     unit: "°C",     cat: "hydro", kind: "avg", qc: [-5, 40] },
  conductivity:  { label_en: "Conductivity",        label_sq: "Përçueshmëria",          unit: "mS",     cat: "hydro", kind: "avg", qc: [0, 100] },
  salinity:      { label_en: "Salinity",            label_sq: "Kripshmëria",            unit: "SAL",    cat: "hydro", kind: "avg", qc: [0, 100] },
  tds:           { label_en: "TDS",                 label_sq: "TDS",                    unit: "g/l",    cat: "hydro", kind: "avg", qc: [0, 100] },
  // Kosovo's record low is about -32.5 °C and its record high about 42 °C
  air_temp:      { label_en: "Air temperature",     label_sq: "Temperatura e ajrit",    unit: "°C",     cat: "meteo", kind: "avg", qc: [-35, 45] },
  rainfall:      { label_en: "Rainfall",            label_sq: "Reshjet",                unit: "mm",     cat: "meteo", kind: "sum", qc: [0, 500] },
  // the world-record one-minute rainfall is ~38 mm/min; the Shajkoc file carries
  // 1440 mm/min spikes (minutes-per-day leaking into the value column)
  rain_intensity:{ label_en: "Rainfall intensity",  label_sq: "Intensiteti i reshjeve", unit: "mm/min", cat: "meteo", kind: "avg", qc: [0, 60] },
  humidity:      { label_en: "Humidity",            label_sq: "Lagështia",              unit: "%",      cat: "meteo", kind: "avg", qc: [0, 100] },
  pressure:      { label_en: "Air pressure",        label_sq: "Shtypja e ajrit",        unit: "hPa",    cat: "meteo", kind: "avg", qc: [800, 1100] },
  solar:         { label_en: "Solar radiation",     label_sq: "Rrezatimi diellor",      unit: "W/m²",   cat: "meteo", kind: "avg", qc: [-50, 1500], clampLo: 0 },
  wind_speed:    { label_en: "Wind speed",          label_sq: "Shpejtësia e erës",      unit: "m/s",    cat: "meteo", kind: "avg", qc: [0, 75] },
  wind_dir:      { label_en: "Wind direction",      label_sq: "Drejtimi i erës",        unit: "°",      cat: "meteo", kind: "avg", qc: [0, 360], circular: true },
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

// ---- station name from file name ------------------------------------------
// Files for the same place arrive as "Te_dhenat_Shajkoc - Drejtimi i Eres",
// "Te_dhenat_Shajkoc - Intensiteti i reshjeve", "Hydro_Lluzhan_Water_Level_2026...",
// etc. To group them under one station (the way etl/build_data.py does with its
// SOURCES table), strip measurement words / timestamps off the end and generic
// prefixes off the front, leaving just the place name ("Shajkoc", "Lluzhan").
const MEAS_WORDS = new Set([
  "level", "niveli", "nivel", "water", "uji", "ujit",
  "temp", "tem", "temperature", "temperatura",
  "intensity", "intensiteti", "reshjet", "reshjeve", "rain", "rainfall", "precipitation",
  "conductivity", "percueshmeria", "salinity", "salanity", "kripshmeria", "tds",
  "humidity", "lageshtija", "lageshtia", "pressure", "shtypja",
  "solar", "radiation", "rrezatimi",
  "wind", "eres", "erës", "era", "speed", "shpejtesia", "shpejtësia",
  "drejtimi", "direction", "ajrit", "air",
  "i", "e", "se", "of", "the",
]);
const PREFIX_WORDS = new Set(["te", "të", "dhenat", "dhënat", "data", "hydro", "meteo", "st"]);

export function stationNameFromFile(baseName) {
  const tokens = baseName
    .replace(/([a-zëç])([A-Z])/g, "$1 $2") // split camelCase ("SolarRadiation")
    .split(/[_\s\-–]+/)
    .filter(Boolean);
  // drop trailing measurement words, connectives and numeric timestamps
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1].toLowerCase().replace(/\d+$/, ""); // "eres1" -> "eres"
    if (last === "" || MEAS_WORDS.has(last)) tokens.pop();
    else break;
  }
  // drop generic "data"/sensor-type prefixes
  while (tokens.length > 1 && PREFIX_WORDS.has(tokens[0].toLowerCase())) tokens.shift();
  return tokens.join(" ") || baseName;
}

// ---- known stations --------------------------------------------------------
// The fixed set of monitoring stations for the Podujevë municipality. Every
// uploaded file is routed to one of these by matching the file name against
// the aliases, so e.g. "Batllave_Reshjet" and "Batllave_Intensity" both land
// in the Batllavë station. `fallbackAliases` catch files whose name carries no
// place at all (Temp_Ujit, Conductivity, TDS, ... belong to Turiqicë/Orllan,
// same as in etl/build_data.py). Files matching nothing get their own station
// named after the file.
// Coordinates are fixed (verified against OpenStreetMap) so the known stations
// always land exactly where they belong; only unknown uploads get geocoded.
export const KNOWN_STATIONS = [
  { id: "imported_lluzhan", municipality: "Podujevë", settlement: "Lluzhan",         name_en: "Lluzhan (Llapi river)", name_sq: "Lluzhan (Lumi Llap)", lat: 42.82224, lon: 21.16759, aliases: ["lluzhan"] },
  { id: "imported_turiqice_orllan", municipality: "Podujevë", settlement: "Turiqicë", name_en: "Turiqicë / Orllan",     name_sq: "Turiqicë / Orllan",   lat: 42.85400, lon: 21.33355, aliases: ["turiqic", "orllan"],
    fallbackAliases: ["temp_ujit", "conductivity", "salanity", "salinity", "tds"] },
  { id: "imported_lupc", municipality: "Podujevë", settlement: "Lupç i Epërm",            name_en: "Lupç (Ep.)",            name_sq: "Lupç (Ep.)",          lat: 42.85432, lon: 21.09473, aliases: ["lupc", "lupe"] },
  { id: "imported_millosheve", municipality: "Obiliq", settlement: "Milloshevë",      name_en: "Milloshevë",            name_sq: "Milloshevë",          lat: 42.72261, lon: 21.08361, aliases: ["milloshev"] },
  { id: "imported_batllave", municipality: "Podujevë", settlement: "Batllavë",        name_en: "Batllavë (reservoir)",  name_sq: "Batllavë (liqeni)",   lat: 42.83674, lon: 21.25282, aliases: ["batllav"] },
  { id: "imported_kerpimeh", municipality: "Podujevë", settlement: "Kërpimeh",        name_en: "Kërpimeh",              name_sq: "Kërpimeh",            lat: 42.99384, lon: 21.15722, aliases: ["kerpimeh"] },
  { id: "imported_podujeve", municipality: "Podujevë", settlement: "Podujevë",        name_en: "Podujevë (town)",       name_sq: "Podujevë (qyteti)",   lat: 42.90780, lon: 21.19253, aliases: ["podujev"] },
  { id: "imported_pollate", municipality: "Podujevë", settlement: "Pollatë",         name_en: "Pollatë",               name_sq: "Pollatë",             lat: 43.05227, lon: 21.11822, aliases: ["pollat"] },
  { id: "imported_shajkoc", municipality: "Podujevë", settlement: "Shajkoc",         name_en: "Shajkoc (auto meteo)",  name_sq: "Shajkoc (meteo automatike)", lat: 42.85690, lon: 21.24971, aliases: ["shajkoc"] },
];

// lowercase + strip diacritics so "Lupë"/"Kërpimeh" match plain-ascii aliases
const fold = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function matchStation(fileName) {
  const s = fold(fileName);
  for (const st of KNOWN_STATIONS) {
    if (st.aliases.some((a) => s.includes(a))) return st;
  }
  for (const st of KNOWN_STATIONS) {
    if ((st.fallbackAliases || []).some((a) => s.includes(a))) return st;
  }
  return null;
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
const ymdh = (d) => `${ymd(d)}T${String(d.getHours()).padStart(2, "0")}:00`;
const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const round = (v) => (v == null ? null : Math.round(v * 1000) / 1000);

// ---- aggregation (mirrors etl/build_data.py aggregate) --------------------
const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => sum(a) / a.length;

// Vector (circular) mean for directions in degrees.
function circMean(a) {
  let s = 0, c = 0;
  for (const v of a) {
    const r = (v * Math.PI) / 180;
    s += Math.sin(r);
    c += Math.cos(r);
  }
  // opposing directions cancel out -> no meaningful mean direction
  if (Math.abs(s) < 1e-9 && Math.abs(c) < 1e-9) return null;
  const d = (Math.atan2(s, c) * 180) / Math.PI;
  return d < 0 ? d + 360 : d;
}

const daysInMonth = (y, m) => new Date(y, m, 0).getDate(); // m is 1-based

// A month at either end of the record is only partly observed, so its TOTAL is
// not comparable with a full month's (a station starting on the 14th shows a
// half-month of rain). Such months stay in the daily/monthly charts -- they are
// real observations -- but are excluded from the climatology and from the
// annual totals, where they would otherwise read as dry anomalies.
function partialMonths(first, last, kind) {
  const p = new Set();
  if (kind !== "sum") return p; // a mean over half a month is still a valid mean
  if (first.getDate() !== 1) p.add(ym(first));
  if (last.getDate() !== daysInMonth(last.getFullYear(), last.getMonth() + 1)) p.add(ym(last));
  return p;
}

function aggregate(samples, def) {
  const kind = def.kind;
  const [lo, hi] = def.qc || [-Infinity, Infinity];

  // QC: drop physically impossible samples before anything else reads them
  const clean = [];
  let dropped = 0;
  for (const s of samples) {
    if (s.val < lo || s.val > hi) {
      dropped++;
      continue;
    }
    // small negative excursions are sensor noise around zero (e.g. solar at night)
    const val = def.clampLo != null && s.val < def.clampLo ? def.clampLo : s.val;
    clean.push({ ts: s.ts, val });
  }
  if (!clean.length) return null;
  clean.sort((a, b) => a.ts - b.ts);

  const dayG = {}, hourG = {}, monG = {}, climG = {};
  for (const { ts, val } of clean) {
    const dk = ymd(ts), hk = ymdh(ts), mk = ym(ts);
    (dayG[dk] = dayG[dk] || []).push(val);
    (hourG[hk] = hourG[hk] || []).push(val);
    (monG[mk] = monG[mk] || []).push(val);
  }

  const avg = def.circular ? circMean : mean;
  const partial = partialMonths(clean[0].ts, clean[clean.length - 1].ts, kind);

  const hourly = Object.keys(hourG).sort().map((h) => {
    const a = hourG[h];
    if (kind === "sum") return { d: h, v: round(sum(a)) };
    if (def.circular) return { d: h, v: round(circMean(a)) };
    return { d: h, v: round(mean(a)), lo: round(Math.min(...a)), hi: round(Math.max(...a)) };
  });

  const daily = Object.keys(dayG).sort().map((d) => {
    const a = dayG[d];
    if (kind === "sum") return { d, v: round(sum(a)) };
    // a min/max direction is meaningless on a compass, so directions get no band
    if (def.circular) return { d, v: round(circMean(a)) };
    return { d, v: round(mean(a)), lo: round(Math.min(...a)), hi: round(Math.max(...a)) };
  });

  const monthly = Object.keys(monG).sort().map((m) => {
    const row = { m, v: round(kind === "sum" ? sum(monG[m]) : avg(monG[m])) };
    if (partial.has(m)) row.partial = true;
    return row;
  });

  // Climatology = the average January, the average February, ...
  if (kind === "sum") {
    // the mean of the monthly TOTALS for that calendar month. NOT the grand
    // total over the month count, which divides a 5-year January sum by the ~60
    // months of the record and so lands ~12x too low (47 mm/year of rain).
    for (const row of monthly) {
      if (row.v == null || row.partial) continue;
      (climG[+row.m.slice(5)] ||= []).push(row.v);
    }
    // a record too short to contain one whole month would otherwise have no
    // climatology at all: fall back to the partial months rather than nothing
    if (!Object.keys(climG).length) {
      for (const row of monthly) if (row.v != null) (climG[+row.m.slice(5)] ||= []).push(row.v);
    }
  } else {
    // means are taken over the samples themselves
    for (const { ts, val } of clean) (climG[ts.getMonth() + 1] ||= []).push(val);
  }
  const climatology = Object.keys(climG).map(Number).sort((a, b) => a - b)
    .map((mo) => ({ month: mo, v: round(avg(climG[mo])) }));

  // loop instead of Math.min(...all): spreading 100k+ samples overflows the stack
  let mn = Infinity, mx = -Infinity, total = 0;
  for (const { val } of clean) {
    if (val < mn) mn = val;
    if (val > mx) mx = val;
    total += val;
  }
  const stats = {
    count: clean.length,
    dropped,
    start: ymd(clean[0].ts),
    end: ymd(clean[clean.length - 1].ts),
    min: round(mn),
    max: round(mx),
    mean: round(def.circular ? circMean(clean.map((s) => s.val)) : total / clean.length),
    overall: round(kind === "sum" ? total : def.circular ? circMean(clean.map((s) => s.val)) : total / clean.length),
  };
  return { daily, hourly, monthly, climatology, stats };
}

// ---- duplicate-measurement cleanup ----------------------------------------
// Older imports split multi-sensor sheets into "wind_dir" + "wind_dir_2".
// Fold such suffixed duplicates back into the base measurement by merging the
// aggregated series (union of days/months; overlapping entries are averaged
// for "avg" measurements and added for "sum" ones).
function mergeMeas(a, b) {
  const kind = a.kind;
  const avg = a.circular ? circMean : mean;
  const byD = new Map(a.daily.map((x) => [x.d, x]));
  for (const x of b.daily) {
    const cur = byD.get(x.d);
    if (!cur) byD.set(x.d, x);
    else if (kind === "sum") byD.set(x.d, { d: x.d, v: round(cur.v + x.v) });
    else if (a.circular) byD.set(x.d, { d: x.d, v: round(circMean([cur.v, x.v])) });
    else
      byD.set(x.d, {
        d: x.d,
        v: round((cur.v + x.v) / 2),
        lo: round(Math.min(cur.lo ?? cur.v, x.lo ?? x.v)),
        hi: round(Math.max(cur.hi ?? cur.v, x.hi ?? x.v)),
      });
  }
  const daily = [...byD.values()].sort((p, q) => (p.d < q.d ? -1 : 1));

  const byM = new Map(a.monthly.map((x) => [x.m, x]));
  for (const x of b.monthly) {
    const cur = byM.get(x.m);
    if (!cur) byM.set(x.m, x);
    else
      byM.set(x.m, {
        ...cur,
        m: x.m,
        v: round(kind === "sum" ? cur.v + x.v : avg([cur.v, x.v])),
        // the merged month is only whole if it was whole in both series
        ...(cur.partial || x.partial ? { partial: true } : {}),
      });
  }
  const monthly = [...byM.values()].sort((p, q) => (p.m < q.m ? -1 : 1));

  const climG = {};
  for (const x of monthly) {
    if (x.v == null || x.partial) continue;
    (climG[+x.m.slice(5)] ||= []).push(x.v);
  }
  const climatology = Object.keys(climG).map(Number).sort((p, q) => p - q)
    .map((mo) => ({ month: mo, v: round(avg(climG[mo])) }));

  const n = a.stats.count + b.stats.count;
  const stats = {
    count: n,
    start: a.stats.start < b.stats.start ? a.stats.start : b.stats.start,
    end: a.stats.end > b.stats.end ? a.stats.end : b.stats.end,
    min: Math.min(a.stats.min, b.stats.min),
    max: Math.max(a.stats.max, b.stats.max),
    mean: round((a.stats.mean * a.stats.count + b.stats.mean * b.stats.count) / n),
    overall:
      kind === "sum"
        ? round(a.stats.overall + b.stats.overall)
        : round((a.stats.mean * a.stats.count + b.stats.mean * b.stats.count) / n),
  };
  return { ...a, daily, monthly, climatology, stats };
}

// Returns the same object when nothing needed fixing, so callers can detect change.
export function dedupeMeasurements(measurements) {
  let out = measurements;
  for (const key of Object.keys(measurements)) {
    const m = key.match(/^(.+)_\d+$/);
    if (!m || !out[m[1]]) continue;
    if (out === measurements) out = { ...measurements };
    out[m[1]] = mergeMeas(out[m[1]], out[key]);
    delete out[key];
  }
  return out;
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

// The Lluzhan loggers export tab-separated text, not a workbook. Handing that to
// XLSX.read({cellDates:true}) lets it guess at the date strings with US
// conventions, so "12.04.2026" (12 April) comes back as 4 December 2026 -- every
// timestamp whose day is <= 12 silently lands in the wrong month, and dates in
// the future appear. The format is fixed and documented, so parse it directly:
//   <dd.mm.yyyy HH:MM:SS> \t <value> \t <unit>
function parseDelimitedText(text) {
  const samples = [];
  let unit = "";
  for (const line of text.split(/\r?\n/)) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    if (!/^\d{2}\.\d{2}\.\d{4}/.test(parts[0])) continue; // skip the header block
    const ts = parseTs(parts[0]);
    const val = num(parts[1]);
    if (!ts || val == null) continue;
    samples.push({ ts, val });
    if (!unit && parts[2]) unit = String(parts[2]).trim();
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
export async function importWorkbook(file, { lat = null, lon = null } = {}) {
  // no hardcoded coordinates: the caller geocodes the station name via Nominatim
  const buf = await file.arrayBuffer();
  const baseName = file.name.replace(/\.[^.]+$/, "");

  // Collect samples per measurement across ALL sheets first, then aggregate
  // once: sheets like "Shpejtesia eres1"/"Shpejtesia eres2" are two sensors of
  // the same series and must become ONE "Wind speed" measurement (the same way
  // etl/build_data.py concatenated them), not "Wind speed" + "Wind speed (2)".
  const byMeas = {}; // measId -> { samples, unit }
  const add = (measId, samples, unit) => {
    const slot = (byMeas[measId] = byMeas[measId] || { samples: [], unit: "" });
    for (const s of samples) slot.samples.push(s); // no spread: sheets can hold 100k+ rows
    if (!slot.unit && unit) slot.unit = unit;
  };

  if (/\.(txt|csv)$/i.test(file.name)) {
    const text = new TextDecoder("utf-8").decode(buf);
    const { samples, unit } = parseDelimitedText(text);
    if (samples.length >= 2) add(guessMeasId(baseName, unit), samples, unit);
  } else {
    const wb = XLSX.read(buf, { cellDates: true });
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
      if (!rows.length) continue;
      const { samples, unit } = rowsToSamples(rows);
      if (samples.length < 2) continue;

      const metaName = stationMeta(rows);
      add(guessMeasId(sheetName, metaName, baseName, unit), samples, unit);
    }
  }

  const measurements = {};
  let type = "meteo";
  for (const [measId, { samples, unit }] of Object.entries(byMeas)) {
    const def = MEAS[measId] || MEAS.generic;
    const agg = aggregate(samples, def);
    if (!agg) continue; // every sample failed the plausibility check
    measurements[measId] = {
      label_en: def.label_en,
      label_sq: def.label_sq,
      // the catalogue unit wins for known measurements: the raw files carry
      // mis-encoded unit strings ("Â°C") that then fail to match the axis
      // labels in Charts.jsx. Only an unrecognized series keeps the file's unit.
      unit: measId === "generic" ? unit || def.unit : def.unit,
      cat: def.cat,
      kind: def.kind,
      ...(def.circular ? { circular: true } : {}),
      ...agg,
    };
    if (def.cat === "hydro") type = "hydro";
  }

  if (!Object.keys(measurements).length) {
    throw new Error("No recognizable time-series found in this file.");
  }

  // group by station: files are routed to one of the known monitoring stations
  // via file-name aliases (so every "Te_dhenat_Shajkoc - ..." upload lands in
  // Shajkoc); unrecognized files get their own station named after the file
  const known = matchStation(baseName);
  const fileName = stationNameFromFile(baseName);
  const name_en = known ? known.name_en : fileName;
  const name_sq = known ? known.name_sq : fileName;
  const id = known
    ? known.id
    : "imported_" + fileName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return {
    id,
    name_en,
    name_sq,
    // municipality/settlement drive the settlement-boundary overlay on the map
    municipality: known ? known.municipality : "",
    settlement: known ? known.settlement : fileName,
    lat: known ? known.lat : lat,
    lon: known ? known.lon : lon,
    type,
    imported: true,
    measurements,
  };
}
