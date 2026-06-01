"""
ETL: convert the raw hydro-meteo sensor files (Llap/*.xlsx, Lluzhan/*.txt,
Shajkoc/*.xls) into compact aggregated JSON for the dashboard frontend.

Output (written to ../app/public/data/):
  stations.json          -> index of stations (id, name, coords, measurements)
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
# ---------------------------------------------------------------------------
MEAS = {
    "water_level":   {"label_en": "Water level",        "label_sq": "Niveli i ujit",        "unit": "m",      "cat": "hydro",  "kind": "avg"},
    "water_temp":    {"label_en": "Water temperature",  "label_sq": "Temperatura e ujit",   "unit": "°C",     "cat": "hydro",  "kind": "avg"},
    "conductivity":  {"label_en": "Conductivity",       "label_sq": "Përçueshmëria",        "unit": "mS",     "cat": "hydro",  "kind": "avg"},
    "salinity":      {"label_en": "Salinity",           "label_sq": "Kripshmëria",          "unit": "SAL",    "cat": "hydro",  "kind": "avg"},
    "tds":           {"label_en": "TDS",                "label_sq": "TDS",                  "unit": "g/l",    "cat": "hydro",  "kind": "avg"},
    "air_temp":      {"label_en": "Air temperature",    "label_sq": "Temperatura e ajrit",  "unit": "°C",     "cat": "meteo",  "kind": "avg"},
    "rainfall":      {"label_en": "Rainfall",           "label_sq": "Reshjet",              "unit": "mm",     "cat": "meteo",  "kind": "sum"},
    "rain_intensity":{"label_en": "Rainfall intensity", "label_sq": "Intensiteti i reshjeve","unit": "mm/min","cat": "meteo",  "kind": "avg"},
    "humidity":      {"label_en": "Humidity",           "label_sq": "Lagështia",            "unit": "%",      "cat": "meteo",  "kind": "avg"},
    "pressure":      {"label_en": "Air pressure",       "label_sq": "Shtypja e ajrit",      "unit": "hPa",    "cat": "meteo",  "kind": "avg"},
    "solar":         {"label_en": "Solar radiation",    "label_sq": "Rrezatimi diellor",    "unit": "W/m²",   "cat": "meteo",  "kind": "avg"},
    "wind_speed":    {"label_en": "Wind speed",         "label_sq": "Shpejtësia e erës",    "unit": "m/s",    "cat": "meteo",  "kind": "avg"},
    "wind_dir":      {"label_en": "Wind direction",     "label_sq": "Drejtimi i erës",      "unit": "°",      "cat": "meteo",  "kind": "avg"},
}

# ---------------------------------------------------------------------------
# Stations: id, names, approximate coordinates (Podujevë municipality, Kosovo).
# NOTE: coordinates are approximate village/river locations -- adjust if needed.
# ---------------------------------------------------------------------------
STATIONS = {
    "lluzhan":  {"name_en": "Lluzhan (Llapi river)",   "name_sq": "Lluzhan (Lumi Llap)",        "lat": 42.8650, "lon": 21.1300, "type": "hydro"},
    "turiqice": {"name_en": "Turiqicë / Orllan",       "name_sq": "Turiqicë / Orllan",          "lat": 42.8620, "lon": 21.3000, "type": "hydro"},
    "lupc":     {"name_en": "Lupç (Ep.)",              "name_sq": "Lupç (Ep.)",                 "lat": 42.9450, "lon": 21.1050, "type": "hydro"},
    "millosheve":{"name_en": "Milloshevë",             "name_sq": "Milloshevë",                 "lat": 42.7850, "lon": 21.1250, "type": "hydro"},
    "batllave": {"name_en": "Batllavë (reservoir)",    "name_sq": "Batllavë (liqeni)",          "lat": 42.8380, "lon": 21.3100, "type": "meteo"},
    "kerpimeh": {"name_en": "Kërpimeh",                "name_sq": "Kërpimeh",                   "lat": 42.8300, "lon": 21.1750, "type": "meteo"},
    "podujeve": {"name_en": "Podujevë (town)",         "name_sq": "Podujevë (qyteti)",          "lat": 42.9110, "lon": 21.1930, "type": "meteo"},
    "pollate":  {"name_en": "Pollatë",                 "name_sq": "Pollatë",                    "lat": 42.9500, "lon": 21.2200, "type": "meteo"},
    "shajkoc":  {"name_en": "Shajkoc (auto meteo)",    "name_sq": "Shajkoc (meteo automatike)", "lat": 42.8800, "lon": 21.2500, "type": "meteo"},
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


def aggregate(df, kind):
    df = df.set_index("ts").sort_index()
    if kind == "sum":
        daily = df["val"].resample("D").sum()
        monthly = df["val"].resample("ME").sum()
        daily_out = [{"d": d.strftime("%Y-%m-%d"), "v": clean(v)} for d, v in daily.items() if v is not None]
        monthly_out = [{"m": d.strftime("%Y-%m"), "v": clean(v)} for d, v in monthly.items()]
        clim = df["val"].groupby(df.index.month).sum() / df.index.to_series().dt.to_period("M").nunique()
    else:
        dr = df["val"].resample("D")
        daily = dr.mean()
        dmin, dmax = dr.min(), dr.max()
        daily_out = [
            {"d": d.strftime("%Y-%m-%d"), "v": clean(v), "lo": clean(dmin[d]), "hi": clean(dmax[d])}
            for d, v in daily.items() if not (isinstance(v, float) and math.isnan(v))
        ]
        monthly = df["val"].resample("ME").mean()
        monthly_out = [{"m": d.strftime("%Y-%m"), "v": clean(v)} for d, v in monthly.items() if not (isinstance(v, float) and math.isnan(v))]
        clim = df["val"].groupby(df.index.month).mean()

    climatology = [{"month": int(m), "v": clean(v)} for m, v in clim.items()]
    overall = clean(df["val"].sum() if kind == "sum" else df["val"].mean())
    return {
        "daily": daily_out,
        "monthly": monthly_out,
        "climatology": climatology,
        "stats": {
            "count": int(len(df)),
            "start": df.index.min().strftime("%Y-%m-%d"),
            "end": df.index.max().strftime("%Y-%m-%d"),
            "min": clean(df["val"].min()),
            "max": clean(df["val"].max()),
            "mean": clean(df["val"].mean()),
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
            agg = aggregate(df, MEAS[mid]["kind"])
            station_data[sid]["series"][mid] = agg
            print(f"ok  n={agg['stats']['count']:>6}  {agg['stats']['start']}..{agg['stats']['end']}")
        except Exception as e:
            print(f"ERROR {e}")

    index = []
    for sid, st in STATIONS.items():
        series = station_data[sid]["series"]
        if not series:
            continue
        # write per-station file
        out = {
            "id": sid,
            **{k: st[k] for k in ("name_en", "name_sq", "lat", "lon", "type")},
            "measurements": {
                mid: {**{k: MEAS[mid][k] for k in ("label_en", "label_sq", "unit", "cat", "kind")},
                      **series[mid]}
                for mid in series
            },
        }
        with open(os.path.join(OUT, f"{sid}.json"), "w", encoding="utf-8") as fh:
            json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        index.append({
            "id": sid,
            "name_en": st["name_en"], "name_sq": st["name_sq"],
            "lat": st["lat"], "lon": st["lon"], "type": st["type"],
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
