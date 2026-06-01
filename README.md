# Podujevë Climate Resilience Dashboard

An interactive dashboard for the hydro-meteorological monitoring network of the
**Llap basin (Podujevë, Kosovo)**, inspired by
[rezilientaclimatica.adrvest.ro](https://rezilientaclimatica.adrvest.ro/en/dashboard/).

On landing it shows a map of Kosovo focused on **Podujevë** with every monitoring
station; selecting a station opens its charts (monthly climatology, historical
evolution, monthly anomalies, daily detail). UI available in **English** and
**Albanian (Shqip)**.

## Project layout

```
Dashboard/
├── Llap/  Lluzhan/  Shajkoc/    raw sensor files (xlsx / txt / xls)
├── etl/build_data.py           ETL: raw files -> aggregated JSON
└── app/                        Vite + React frontend
    ├── public/data/*.json      generated data (stations + per-station)
    └── src/                    App, MapView, Dashboard, Charts, i18n
```

## 1. Regenerate the data (only if raw files change)

```powershell
python -m pip install pandas openpyxl xlrd
python etl/build_data.py
```

This writes `app/public/data/stations.json` and one `<station>.json` per station
(daily + monthly + monthly-climatology aggregates, plus summary stats).

## 2. Run the dashboard

```powershell
cd app
npm install
npm run dev        # opens http://localhost:5173
```

Build for deployment: `npm run build` (output in `app/dist/`).

## Stations & measurements

9 stations across the Llap basin:

- **Hydrological** (water): Lluzhan, Turiqicë/Orllan, Lupç, Milloshevë — water
  level, water temperature, and at Turiqicë also conductivity, salinity, TDS.
- **Meteorological**: Batllavë, Kërpimeh, Podujevë, Pollatë, Shajkoc — air
  temperature, rainfall, rainfall intensity; Shajkoc adds humidity, pressure,
  solar radiation, wind speed & direction.

> Station coordinates in `etl/build_data.py` (`STATIONS`) are **approximate** —
> adjust the `lat`/`lon` values to the exact sensor locations if you have them.

## Climate scenarios & forecast (RCP4.5 / RCP8.5)

Each measurement panel includes a **scenario projection** chart (monthly profile
with historic line + 2011–2040 / 2041–2070 / 2071–2100 projected bands, with an
`All / RCP4.5 / RCP8.5` toggle) and a **next-5-months forecast**.

> These scenarios are **not** IPCC climate-model output — we only have a few
> years of local sensor data. They are a *simplified statistical projection*:
> the seasonal cycle is removed, a trend (units/year) is fitted to the observed
> anomalies, and that trend is extended forward (RCP8.5 = a stronger multiplier
> than RCP4.5). The 2100 change is capped to ~⅓ of the seasonal amplitude so the
> lines stay physically believable. Stations with a longer record (Shajkoc,
> Turiqicë, Lupç ≈ 5 years) give the most meaningful trends; very short records
> (e.g. Podujevë town ≈ 1.5 years) project weakly — adjust the multipliers in
> [app/src/lib/projection.js](app/src/lib/projection.js) (`SCENARIOS`, `PERIODS`).

## Import your own Excel (e.g. Prishtina)

Click **⬆ Import Excel** in the header and choose an `.xlsx` / `.xls` / `.txt`
file in either of the dataset's raw formats (the `Llap` header-block format or
the `Shajkoc` `Station | Datee | CorrValue` format). It is parsed **entirely in
the browser** ([app/src/lib/importExcel.js](app/src/lib/importExcel.js)),
aggregated the same way as the built-in data, and added as a selectable station
(placed at Prishtina by default — edit the coords in the import call if needed).
Nothing is uploaded anywhere.

## Notes for the course project

This covers the **dashboard route** (map + all graphs). The nature-inspired
algorithm component (e.g. optimising/prioritising protective measures across the
risk map) can be layered on top later using these same per-station JSON series.
