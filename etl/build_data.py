"""
ETL: convert the raw hydro-meteo sensor files (Llap/*.xlsx, Lluzhan/*.txt,
Shajkoc/*.xls) into compact aggregated JSON for the dashboard frontend.

Output (written to ../app/public/data/):
  stations.json          -> index of stations (id, name, GIS metadata, measurements)
  <station_id>.json       -> per-station series with daily / monthly / climatology aggregates

Run:  python etl/build_data.py
"""
import json
import os
import re
import glob
import math
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "app", "public", "data")
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------------------
# Measurement metadata: category + canonical unit + how to aggregate
# kind: "avg" -> daily mean/min/max, monthly mean ; "sum" -> daily/monthly total
#
# qc: the physically plausible range of a single sample. Sensor dropouts would
#     otherwise enter the aggregates as real observations (the Podujevë air-temp
#     file carries a -55 °C reading). Samples outside the range are discarded.
# circular: a bearing in degrees, which must be vector-averaged rather than
#     arithmetically averaged (the mean of 350° and 10° is 0°, not 180°).
#
# Keep in sync with the browser-side catalogue in app/src/lib/importExcel.js.
# ---------------------------------------------------------------------------
MEAS = {
    "water_level":   {"label_en": "Water level",        "label_sq": "Niveli i ujit",        "unit": "m",      "cat": "hydro",  "kind": "avg", "qc": (-10, 50)},
    "water_temp":    {"label_en": "Water temperature",  "label_sq": "Temperatura e ujit",   "unit": "°C",     "cat": "hydro",  "kind": "avg", "qc": (-5, 40)},
    "conductivity":  {"label_en": "Conductivity",       "label_sq": "Përçueshmëria",        "unit": "mS",     "cat": "hydro",  "kind": "avg", "qc": (0, 100)},
    "salinity":      {"label_en": "Salinity",           "label_sq": "Kripshmëria",          "unit": "SAL",    "cat": "hydro",  "kind": "avg", "qc": (0, 100)},
    "tds":           {"label_en": "TDS",                "label_sq": "TDS",                  "unit": "g/l",    "cat": "hydro",  "kind": "avg", "qc": (0, 100)},
    # Kosovo's record low is about -32.5 °C and its record high about 42 °C
    "air_temp":      {"label_en": "Air temperature",    "label_sq": "Temperatura e ajrit",  "unit": "°C",     "cat": "meteo",  "kind": "avg", "qc": (-35, 45)},
    "rainfall":      {"label_en": "Rainfall",           "label_sq": "Reshjet",              "unit": "mm",     "cat": "meteo",  "kind": "sum", "qc": (0, 500)},
    "rain_intensity":{"label_en": "Rainfall intensity", "label_sq": "Intensiteti i reshjeve","unit": "mm/h",  "cat": "meteo",  "kind": "avg", "qc": (0, 60)},
    "humidity":      {"label_en": "Humidity",           "label_sq": "Lagështia",            "unit": "%",      "cat": "meteo",  "kind": "avg", "qc": (0, 100)},
    "pressure":      {"label_en": "Air pressure",       "label_sq": "Shtypja e ajrit",      "unit": "hPa",    "cat": "meteo",  "kind": "avg", "qc": (800, 1100)},
    "solar":         {"label_en": "Solar radiation",    "label_sq": "Rrezatimi diellor",    "unit": "W/m²",   "cat": "meteo",  "kind": "avg", "qc": (-50, 1500), "clamp_lo": 0},
    "wind_speed":    {"label_en": "Wind speed",         "label_sq": "Shpejtësia e erës",    "unit": "m/s",    "cat": "meteo",  "kind": "avg", "qc": (0, 75)},
    "wind_dir":      {"label_en": "Wind direction",     "label_sq": "Drejtimi i erës",      "unit": "°",      "cat": "meteo",  "kind": "avg", "qc": (0, 360), "circular": True},
}

# ---------------------------------------------------------------------------
# Stations: id, names, and type. GIS fields are attached from STATION_GIS.
# GIS fields are attached from STATION_GIS below.
# ---------------------------------------------------------------------------
STATIONS = {
    "lluzhan":  {"name_en": "Lluzhan (Llapi river)",   "name_sq": "Lluzhan (Lumi Llap)",        "type": "hydro"},
    "turiqice": {"name_en": "Turiqicë / Orllan",       "name_sq": "Turiqicë / Orllan",          "type": "hydro"},
    "lupc":     {"name_en": "Lupç (Ep.)",              "name_sq": "Lupç (Ep.)",                 "type": "hydro"},
    "millosheve":{"name_en": "Milloshevë",             "name_sq": "Milloshevë",                 "type": "hydro"},
    "batllave": {"name_en": "Batllavë (reservoir)",    "name_sq": "Batllavë (liqeni)",          "type": "meteo"},
    "kerpimeh": {"name_en": "Kërpimeh",                "name_sq": "Kërpimeh",                   "type": "meteo"},
    "podujeve": {"name_en": "Podujevë (town)",         "name_sq": "Podujevë (qyteti)",          "type": "meteo"},
    "pollate":  {"name_en": "Pollatë",                 "name_sq": "Pollatë",                    "type": "meteo"},
    "shajkoc":  {"name_en": "Shajkoc (auto meteo)",    "name_sq": "Shajkoc (meteo automatike)", "type": "meteo"},
}

# ---------------------------------------------------------------------------
# GIS metadata: municipality + settlement drive settlement-boundary matching.
# Coordinates are explicit so the app does not geocode built-in stations at runtime.
# ---------------------------------------------------------------------------
STATION_GIS = {
    "lluzhan":    {"municipality": "Podujevë", "settlement": "Lluzhan",    "lat": 42.898, "lon": 21.145},
    "turiqice":   {"municipality": "Podujevë", "settlement": "Turiqicë",   "lat": 42.833, "lon": 21.318},
    "lupc":       {"municipality": "Podujevë", "settlement": "Lupç i Epërm", "lat": 42.934, "lon": 21.107},
    "millosheve": {"municipality": "Obiliq",   "settlement": "Milloshevë", "lat": 42.731, "lon": 21.080},
    "batllave":   {"municipality": "Podujevë", "settlement": "Batllavë",   "lat": 42.841, "lon": 21.269},
    "kerpimeh":   {"municipality": "Podujevë", "settlement": "Kërpimeh",   "lat": 42.970, "lon": 21.189},
    "podujeve":   {"municipality": "Podujevë", "settlement": "Podujevë",   "lat": 42.911, "lon": 21.193},
    "pollate":    {"municipality": "Podujevë", "settlement": "Pollatë",    "lat": 43.004, "lon": 21.142},
    "shajkoc":    {"municipality": "Podujevë", "settlement": "Shajkoc",    "lat": 42.979, "lon": 21.227},
}

# ---------------------------------------------------------------------------
# Helpers to read the two raw formats
# ---------------------------------------------------------------------------
def read_llap(path, sheet=0):
    """Llap/Lluzhan sensor format: header block then ts | value | unit rows."""
    raw = pd.read_excel(path, sheet_name=sheet, header=None)
    start = None
    for i, row in raw.iterrows():
        if re.match(r"\d{2}\.\d{2}\.\d{4}", str(row[0])):
            start = i
            break
    df = raw.iloc[start:, :2].copy()
    df.columns = ["ts", "val"]
    df["ts"] = pd.to_datetime(df["ts"], format="%d.%m.%Y %H:%M:%S", errors="coerce")
    df["val"] = pd.to_numeric(df["val"], errors="coerce")
    return df.dropna()


def read_txt(path):
    rows = []
    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
        for line in fh:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 2 and re.match(r"\d{2}\.\d{2}\.\d{4}", parts[0]):
                rows.append((parts[0], parts[1]))
    df = pd.DataFrame(rows, columns=["ts", "val"])
    df["ts"] = pd.to_datetime(df["ts"], format="%d.%m.%Y %H:%M:%S", errors="coerce")
    df["val"] = pd.to_numeric(df["val"], errors="coerce")
    return df.dropna()


def read_shajkoc(path, sheets):
    """Shajkoc .xls: Station | Datee | CorrValue | StationName. Concatenate sheets."""
    frames = []
    for sh in sheets:
        d = pd.read_excel(path, sheet_name=sh)
        d.columns = ["Station", "Datee", "CorrValue", "StationName"][: len(d.columns)]
        frames.append(d[["Datee", "CorrValue"]])
    df = pd.concat(frames, ignore_index=True)
    df.columns = ["ts", "val"]
    df["ts"] = pd.to_datetime(df["ts"], errors="coerce")
    df["val"] = pd.to_numeric(df["val"], errors="coerce")
    return df.dropna().sort_values("ts")


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------
def clean(v):
    return None if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))) else round(float(v), 3)


def circ_mean(vals):
    """Vector mean of directions in degrees: the mean of 350 and 10 is 0, not 180."""
    vals = [v for v in vals if v is not None and not math.isnan(v)]
    if not vals:
        return None
    s = sum(math.sin(math.radians(v)) for v in vals)
    c = sum(math.cos(math.radians(v)) for v in vals)
    if abs(s) < 1e-9 and abs(c) < 1e-9:
        return None  # opposing directions cancel: no mean bearing
    return math.degrees(math.atan2(s, c)) % 360


def aggregate(df, meas):
    kind = meas["kind"]
    circular = meas.get("circular", False)

    # QC: drop physically impossible samples (sensor dropouts such as the -55 °C
    # air temperature at Podujevë) before they can set the min/max or the band.
    lo, hi = meas.get("qc", (-math.inf, math.inf))
    n_raw = len(df)
    df = df[(df["val"] >= lo) & (df["val"] <= hi)]
    if df.empty:
        return None
    if meas.get("clamp_lo") is not None:  # sensor noise around zero (solar at night)
        df.loc[df["val"] < meas["clamp_lo"], "val"] = meas["clamp_lo"]
    dropped = n_raw - len(df)

    df = df.set_index("ts").sort_index()
    agg = circ_mean if circular else "mean"

    if kind == "sum":
        # min_count=1 so a gap in the record stays NaN instead of becoming 0.0:
        # resample().sum() fills empty bins with zero, which drew sensor outages
        # (Pollatë had no data at all for June and July 2025) as a summer drought.
        daily = df["val"].resample("D").sum(min_count=1)
        monthly = df["val"].resample("ME").sum(min_count=1)
        daily_out = [{"d": d.strftime("%Y-%m-%d"), "v": clean(v)} for d, v in daily.items() if pd.notna(v)]
        monthly_rows = [(d, v) for d, v in monthly.items() if pd.notna(v)]
    else:
        dr = df["val"].resample("D")
        daily = dr.apply(circ_mean) if circular else dr.mean()
        dmin, dmax = dr.min(), dr.max()
        daily_out = [
            # a min/max bearing is meaningless on a compass, so directions get no band
            {"d": d.strftime("%Y-%m-%d"), "v": clean(v)}
            if circular
            else {"d": d.strftime("%Y-%m-%d"), "v": clean(v), "lo": clean(dmin[d]), "hi": clean(dmax[d])}
            for d, v in daily.items()
            if pd.notna(v)
        ]
        monthly = df["val"].resample("ME").apply(agg) if circular else df["val"].resample("ME").mean()
        monthly_rows = [(d, v) for d, v in monthly.items() if pd.notna(v)]

    # The first and last month of a record are only partly observed, so their
    # TOTALS are not comparable with a whole month's. They stay in the charts as
    # real observations but are excluded from the climatology and annual totals.
    start, end = df.index.min(), df.index.max()
    partial = set()
    if kind == "sum":
        if start.day != 1:
            partial.add(start.strftime("%Y-%m"))
        if end.day != end.days_in_month:
            partial.add(end.strftime("%Y-%m"))

    monthly_out = []
    for d, v in monthly_rows:
        row = {"m": d.strftime("%Y-%m"), "v": clean(v)}
        if row["m"] in partial:
            row["partial"] = True
        monthly_out.append(row)

    # Climatology = the average January, the average February, ...
    if kind == "sum":
        # the mean of the monthly TOTALS for that calendar month. The old divisor
        # was the number of months in the whole record, so a 5-year January sum
        # was divided by ~60 instead of 5 -- rainfall came out ~12x too low
        # (47 mm/year for Podujevë, which actually gets ~600 mm).
        whole = [r for r in monthly_out if r["v"] is not None and not r.get("partial")]
        if not whole:  # record too short to hold a single whole month
            whole = [r for r in monthly_out if r["v"] is not None]
        buckets = {}
        for r in whole:
            buckets.setdefault(int(r["m"][5:7]), []).append(r["v"])
        clim = {m: sum(v) / len(v) for m, v in buckets.items()}
    else:
        g = df["val"].groupby(df.index.month)
        clim = (g.apply(lambda s: circ_mean(list(s))) if circular else g.mean()).to_dict()

    climatology = [{"month": int(m), "v": clean(v)} for m, v in sorted(clim.items())]

    if kind == "sum":
        overall = clean(df["val"].sum())
        mean_v = clean(df["val"].mean())
    else:
        mean_v = clean(circ_mean(list(df["val"])) if circular else df["val"].mean())
        overall = mean_v

    return {
        "daily": daily_out,
        "monthly": monthly_out,
        "climatology": climatology,
        "stats": {
            "count": int(len(df)),
            "dropped": int(dropped),
            "start": start.strftime("%Y-%m-%d"),
            "end": end.strftime("%Y-%m-%d"),
            "min": clean(df["val"].min()),
            "max": clean(df["val"].max()),
            "mean": mean_v,
            "overall": overall,
        },
    }


# ---------------------------------------------------------------------------
# Source map: (station_id, measurement_id) -> loader
# ---------------------------------------------------------------------------
def L(path, sheet=0):
    return lambda: read_llap(os.path.join(ROOT, path), sheet)

def T(path):
    return lambda: read_txt(os.path.join(ROOT, path))

def S(path, sheets):
    return lambda: read_shajkoc(os.path.join(ROOT, path), sheets)

SOURCES = [
    ("lluzhan",   "water_level",    T("Lluzhan/Hydro_Lluzhan_Water_Level_20260420092139.txt")),
    ("lluzhan",   "water_temp",     T("Lluzhan/Hydro_Lluzhan_Water_Temperature_20260420092221.txt")),
    ("turiqice",  "water_level",    L("Llap/L_Turiqices_Orllan_Niveli.xlsx")),
    ("turiqice",  "water_temp",     L("Llap/Temp_Ujit_2.xlsx")),
    ("turiqice",  "conductivity",   L("Llap/Conductivity.xlsx")),
    ("turiqice",  "salinity",       L("Llap/Salanity.xlsx")),
    ("turiqice",  "tds",            L("Llap/TDS.xlsx")),
    ("lupc",      "water_level",    L("Llap/Lupë_Ep_Niveli.xlsx")),
    ("millosheve","water_level",    L("Llap/Millosheve_Niveli.xlsx")),
    ("millosheve","water_temp",     L("Llap/Millosheve_temp_ujit.xlsx")),
    ("batllave",  "rainfall",       L("Llap/Batllave_Reshjet.xlsx")),
    ("batllave",  "rain_intensity", L("Llap/Batllave_Intensity.xlsx")),
    ("kerpimeh",  "rainfall",       L("Llap/Kerpimeh_Reshjet.xlsx")),
    ("kerpimeh",  "rain_intensity", L("Llap/Kerpimeh_Intensity.xlsx")),
    ("podujeve",  "air_temp",       L("Llap/Podujeve_Temp.xlsx")),
    ("podujeve",  "rainfall",       L("Llap/Podujeve_Reshjet.xlsx")),
    ("podujeve",  "rain_intensity", L("Llap/Podujeve_Intensity.xlsx")),
    ("pollate",   "air_temp",       L("Llap/Pollate_Tem.xlsx")),
    ("pollate",   "rainfall",       L("Llap/Pollate_reshjet.xlsx")),
    ("pollate",   "rain_intensity", L("Llap/Pollate_Intensity.xlsx")),
    ("shajkoc",   "air_temp",       S("Shajkoc/Te_dhenat_Shajkoc.xls", ["Temperatura_Ajrit"])),
    ("shajkoc",   "humidity",       S("Shajkoc/Te_dhenat_Shajkoc.xls", ["Lageshtija"])),
    ("shajkoc",   "pressure",       S("Shajkoc/Te_dhenat_Shajkoc.xls", ["Shtypja_Ajrit"])),
    ("shajkoc",   "rainfall",       S("Shajkoc/Te_dhenat_Shajkoc.xls", ["Reshjet"])),
    ("shajkoc",   "rain_intensity", S("Shajkoc/Te_dhenat_Shajkoc.xls", ["Intensiteti i reshejeve"])),
    ("shajkoc",   "solar",          S("Shajkoc/Te_dhenat_Shajkoc.xls", ["SolarRadiation"])),
    ("shajkoc",   "wind_speed",     S("Shajkoc/Te_dhenat_Shajkoc.xls", ["Shpejtesia eres1", "Shpejtesia eres2"])),
    ("shajkoc",   "wind_dir",       S("Shajkoc/Te_dhenat_Shajkoc.xls", ["Drejtimi i eres1", "Drejtimi eres2"])),
]


def main():
    station_data = {sid: {"series": {}} for sid in STATIONS}
    for sid, mid, loader in SOURCES:
        print(f"  {sid:>10} / {mid:<15} ...", end=" ", flush=True)
        try:
            df = loader()
            if df.empty:
                print("EMPTY, skipped")
                continue
            agg = aggregate(df, MEAS[mid])
            if agg is None:
                print("no plausible samples, skipped")
                continue
            station_data[sid]["series"][mid] = agg
            dropped = agg["stats"]["dropped"]
            flag = f"  (dropped {dropped} implausible)" if dropped else ""
            print(f"ok  n={agg['stats']['count']:>6}  {agg['stats']['start']}..{agg['stats']['end']}{flag}")
        except Exception as e:
            print(f"ERROR {e}")

    index = []
    for sid, st in STATIONS.items():
        gis = STATION_GIS.get(sid, {})
        series = station_data[sid]["series"]
        if not series:
            continue
        # write per-station file
        out = {
            "id": sid,
            **{k: st[k] for k in ("name_en", "name_sq", "type")},
            **gis,
            "measurements": {
                mid: {**{k: MEAS[mid][k] for k in ("label_en", "label_sq", "unit", "cat", "kind")},
                      **({"circular": True} if MEAS[mid].get("circular") else {}),
                      **series[mid]}
                for mid in series
            },
        }
        with open(os.path.join(OUT, f"{sid}.json"), "w", encoding="utf-8") as fh:
            json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        index.append({
            "id": sid,
            "name_en": st["name_en"], "name_sq": st["name_sq"],
            "type": st["type"],
            **gis,
            "measurements": [
                {"id": mid, "label_en": MEAS[mid]["label_en"], "label_sq": MEAS[mid]["label_sq"],
                 "unit": MEAS[mid]["unit"], "cat": MEAS[mid]["cat"], "kind": MEAS[mid]["kind"],
                 "stats": series[mid]["stats"]}
                for mid in series
            ],
        })

    with open(os.path.join(OUT, "stations.json"), "w", encoding="utf-8") as fh:
        json.dump({"stations": index}, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"\nWrote {len(index)} station files + stations.json to {OUT}")


if __name__ == "__main__":
    main()
