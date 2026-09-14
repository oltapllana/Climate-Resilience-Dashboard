# Podujeva Climate Resilience Dashboard

An interactive dashboard for the hydro-meteorological monitoring network of the
**Llap basin (Podujevë, Kosovo)**, inspired by
[rezilientaclimatica.adrvest.ro](https://rezilientaclimatica.adrvest.ro/en/dashboard/).

On startup it shows the Podujeva-area map and loads saved stations when Supabase
is configured. Otherwise the station list starts empty; import observations to
populate it. Selecting a station opens its available charts. The UI is available
in **English** and **Albanian (Shqip)**.

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
These are optional ETL outputs; the current App does not load them at startup.

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

> Station coordinates in `etl/build_data.py` (`STATION_GIS`) are **approximate** —
> adjust the `lat`/`lon` values to the exact sensor locations if you have them.
> Exact GPS coordinates are not available in the raw sensor files. When a
> station matches a real settlement polygon, the map keeps the original
> `lat`/`lon` as approximate metadata but renders the station marker at a
> computed point inside the matched settlement boundary. If no settlement
> polygon matches, the marker falls back to the approximate `lat`/`lon` and the
> app logs a GIS warning.

## Settlement boundary GeoJSON

The map is prepared for a Kosovo-wide settlement boundary file named
`settlements-kosovo.geojson`. This should be a real GIS boundary layer containing
village, town, or settlement polygons across Kosovo. Place it here:

```text
app/public/settlements-kosovo.geojson
```

Expected GeoJSON shape:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "municipality": "Podujevë",
        "settlement": "Lluzhan"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": []
      }
    }
  ]
}
```

The matcher accepts common property names, including `municipality`, `komuna`,
`mun_name`, `admin2` for municipalities and `settlement`, `village`, `name`,
`vendbanimi`, `place` for settlements.

Stations match polygons by normalized `municipality + settlement`. Example:
a station with `"municipality": "Podujevë"` and `"settlement": "Lluzhan"` will
match a GeoJSON feature with the same municipality and settlement, ignoring
case, punctuation, and common Kosovo diacritics such as `ë/e` and `ç/c`.

If `settlements-kosovo.geojson` is missing, the app keeps all station markers
visible, shows fallback settlement labels from station metadata, logs a clear
`[GIS warning]`, and does not create fake polygons.

## Import your own Excel (e.g. Prishtina)

Click **⬆ Import Excel** in the station panel and choose an `.xlsx` / `.xls` / `.txt`
file in either of the dataset's raw formats (the `Llap` header-block format or
the `Shajkoc` `Station | Datee | CorrValue` format). It is parsed **entirely in
the browser** ([app/src/lib/importExcel.js](app/src/lib/importExcel.js)),
aggregated and added as a selectable station. Known stations use catalogue
coordinates; unknown station names may be sent to Nominatim for geocoding, with
the Podujeva centre as fallback.

Without Supabase configuration, imported observations remain in browser memory
for the current session. With `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
configured, imports require sign-in and the parsed station data, including
measurements, is saved to Supabase. The original workbook file is not uploaded.
Saved stations are loaded on startup; removal also requests deletion from
Supabase. Access is subject to the database policies. Map tiles and geocoding
use external services independently of observation persistence.

## Notes for the course project

This covers the **dashboard route** (map + all graphs). The nature-inspired
algorithm component (e.g. optimising/prioritising protective measures across the
risk map) can be layered on top later using these same per-station JSON series.
