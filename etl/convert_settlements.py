"""
Inspect and convert the Kosovo settlements shapefile to web GeoJSON.

Input:
  app/public/gis/2019_kosovo_settlements/2019_kosovo_settlements.{shp,dbf}

Output:
  app/public/settlements-kosovo.geojson

This intentionally has no third-party dependency so it can run in the project
environment even when GDAL/geopandas/pyshp are unavailable.
"""
from __future__ import annotations

import argparse
import json
import os
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE = ROOT / "app" / "public" / "gis" / "2019_kosovo_settlements" / "2019_kosovo_settlements"
DEFAULT_OUT = ROOT / "app" / "public" / "settlements-kosovo.geojson"

FIELD_ALIASES = {
    "municipality": [
        "municipality",
        "municipali",
        "opstina",
        "komuna",
        "mun_name",
        "munname",
        "admin2",
        "adm2_name",
    ],
    "settlement": [
        "settlement",
        "settlemen",
        "naselje",
        "village",
        "vill_name",
        "name",
        "name_sq",
        "vendbanimi",
        "place",
    ],
}

TARGET_SETTLEMENTS = ["Pollatë", "Kërpimeh", "Lluzhan", "Lupç", "Batllavë", "Milloshevë", "Shajkoc", "Turiqicë"]
NORMALIZED_NAME_ALIASES = {
    "obilic": "obiliq",
    "podujevo": "podujeve",
    "milosheve": "millosheve",
    "turucice": "turiqice",
}


def normalize(value: object) -> str:
    text = str(value or "").strip()
    text = (
        text.replace("ë", "e")
        .replace("Ë", "e")
        .replace("ç", "c")
        .replace("Ç", "c")
        .lower()
    )
    normalized = " ".join("".join(ch if ch.isalnum() else " " for ch in text).split())
    normalized = " ".join("lupc" if part == "lupq" else part for part in normalized.split())
    return NORMALIZED_NAME_ALIASES.get(normalized, normalized)


def read_cpg(base: Path) -> str:
    cpg = base.with_suffix(".cpg")
    if cpg.exists():
        return cpg.read_text(encoding="ascii", errors="ignore").strip() or "utf-8"
    return "utf-8"


def read_dbf(base: Path):
    path = base.with_suffix(".dbf")
    encoding = read_cpg(base)
    data = path.read_bytes()
    record_count = struct.unpack_from("<I", data, 4)[0]
    header_length = struct.unpack_from("<H", data, 8)[0]
    record_length = struct.unpack_from("<H", data, 10)[0]

    fields = []
    offset = 32
    while data[offset] != 0x0D:
        descriptor = data[offset : offset + 32]
        name = descriptor[:11].split(b"\x00", 1)[0].decode("ascii", errors="ignore").strip()
        field_type = chr(descriptor[11])
        length = descriptor[16]
        decimals = descriptor[17]
        fields.append({"name": name, "type": field_type, "length": length, "decimals": decimals})
        offset += 32

    records = []
    pos = header_length
    for _ in range(record_count):
        raw = data[pos : pos + record_length]
        pos += record_length
        if not raw or raw[0:1] == b"*":
            continue

        record = {}
        col = 1
        for field in fields:
            chunk = raw[col : col + field["length"]]
            col += field["length"]
            value = chunk.decode(encoding, errors="replace").strip()
            if field["type"] in ("N", "F"):
                if value:
                    try:
                        value = float(value) if "." in value else int(value)
                    except ValueError:
                        pass
                else:
                    value = None
            record[field["name"]] = value
        records.append(record)

    return fields, records


def pick_field(fields, candidates):
    names = [field["name"] for field in fields]
    normalized_to_name = {normalize(name): name for name in names}
    for candidate in candidates:
        found = normalized_to_name.get(normalize(candidate))
        if found:
            return found
    return None


def signed_area(ring):
    total = 0.0
    for i, (x1, y1) in enumerate(ring):
        x2, y2 = ring[(i + 1) % len(ring)]
        total += x1 * y2 - x2 * y1
    return total / 2


def point_in_ring(point, ring):
    x, y = point
    inside = False
    j = len(ring) - 1
    for i, (xi, yi) in enumerate(ring):
        xj, yj = ring[j]
        intersects = ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-20) + xi)
        if intersects:
            inside = not inside
        j = i
    return inside


def close_ring(ring):
    if ring and ring[0] != ring[-1]:
        return ring + [ring[0]]
    return ring


def rings_to_geometry(rings):
    outers = []
    holes = []
    for ring in rings:
        if len(ring) < 4:
            continue
        # ESRI polygons usually store outer rings clockwise and holes counter-clockwise.
        if signed_area(ring) < 0:
            outers.append({"ring": ring, "holes": []})
        else:
            holes.append(ring)

    if not outers and rings:
        outers = [{"ring": ring, "holes": []} for ring in rings if len(ring) >= 4]

    for hole in holes:
        test_point = hole[0]
        owner = next((outer for outer in outers if point_in_ring(test_point, outer["ring"])), None)
        if owner:
            owner["holes"].append(hole)
        else:
            outers.append({"ring": hole, "holes": []})

    polygons = [[close_ring(outer["ring"])] + [close_ring(hole) for hole in outer["holes"]] for outer in outers]
    if len(polygons) == 1:
        return {"type": "Polygon", "coordinates": polygons[0]}
    return {"type": "MultiPolygon", "coordinates": polygons}


def read_shp_geometries(base: Path):
    path = base.with_suffix(".shp")
    data = path.read_bytes()
    file_shape_type = struct.unpack_from("<i", data, 32)[0]
    geometries = []
    geometry_types = {}
    pos = 100

    while pos < len(data):
        if pos + 8 > len(data):
            break
        _, content_words = struct.unpack_from(">2i", data, pos)
        pos += 8
        content_bytes = content_words * 2
        content = data[pos : pos + content_bytes]
        pos += content_bytes
        if len(content) < 4:
            continue

        shape_type = struct.unpack_from("<i", content, 0)[0]
        geometry_types[shape_type] = geometry_types.get(shape_type, 0) + 1
        if shape_type == 0:
            geometries.append(None)
            continue
        if shape_type not in (5, 15):
            raise ValueError(f"Unsupported shapefile geometry type {shape_type}")

        num_parts, num_points = struct.unpack_from("<2i", content, 36)
        parts = list(struct.unpack_from(f"<{num_parts}i", content, 44))
        points_offset = 44 + num_parts * 4
        points = [
            struct.unpack_from("<2d", content, points_offset + i * 16)
            for i in range(num_points)
        ]
        rings = []
        for i, start in enumerate(parts):
            end = parts[i + 1] if i + 1 < len(parts) else num_points
            rings.append(points[start:end])
        geometries.append(rings_to_geometry(rings))

    return file_shape_type, geometry_types, geometries


def convert(base: Path, out: Path):
    fields, records = read_dbf(base)
    file_shape_type, geometry_types, geometries = read_shp_geometries(base)
    municipality_field = pick_field(fields, FIELD_ALIASES["municipality"])
    settlement_field = pick_field(fields, FIELD_ALIASES["settlement"])

    if not municipality_field or not settlement_field:
        raise ValueError(
            f"Could not identify municipality/settlement fields. Fields: {[field['name'] for field in fields]}"
        )
    if len(records) != len(geometries):
        raise ValueError(f"DBF/SHP record mismatch: {len(records)} records vs {len(geometries)} geometries")

    features = []
    for record, geometry in zip(records, geometries):
        if not geometry:
            continue
        properties = dict(record)
        properties["municipality"] = record.get(municipality_field)
        properties["settlement"] = record.get(settlement_field)
        features.append({"type": "Feature", "properties": properties, "geometry": geometry})

    geojson = {"type": "FeatureCollection", "features": features}
    out.write_text(json.dumps(geojson, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return fields, records, file_shape_type, geometry_types, municipality_field, settlement_field, features


def print_report(fields, records, file_shape_type, geometry_types, municipality_field, settlement_field, features):
    print("Fields:")
    for field in fields:
        print(f"  {field['name']} ({field['type']}, len={field['length']}, dec={field['decimals']})")
    print()
    print(f"Municipality field: {municipality_field}")
    print(f"Settlement field: {settlement_field}")
    print(f"File shape type: {file_shape_type}")
    print(f"Record geometry types: {geometry_types}")
    print(f"Feature count: {len(features)}")
    print()

    by_name = {}
    for feature in features:
        key = normalize(feature["properties"].get("settlement"))
        by_name.setdefault(key, []).append(feature["properties"])

    print("Requested settlement checks:")
    for name in TARGET_SETTLEMENTS:
        target = normalize(name)
        matches = by_name.get(target, [])
        if not matches:
            matches = [item for key, values in by_name.items() if key.startswith(target + " ") for item in values]
        if matches:
            places = sorted({f"{item.get('settlement')} / {item.get('municipality')}" for item in matches})
            print(f"  {name}: yes -> {', '.join(places)}")
        else:
            print(f"  {name}: no")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, default=DEFAULT_BASE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--inspect-only", action="store_true")
    args = parser.parse_args()

    fields, records = read_dbf(args.base)
    file_shape_type, geometry_types, geometries = read_shp_geometries(args.base)
    municipality_field = pick_field(fields, FIELD_ALIASES["municipality"])
    settlement_field = pick_field(fields, FIELD_ALIASES["settlement"])

    if args.inspect_only:
        features = []
        if municipality_field and settlement_field:
            features = [
                {
                    "type": "Feature",
                    "properties": {
                        **record,
                        "municipality": record.get(municipality_field),
                        "settlement": record.get(settlement_field),
                    },
                    "geometry": geometry,
                }
                for record, geometry in zip(records, geometries)
                if geometry
            ]
        print_report(fields, records, file_shape_type, geometry_types, municipality_field, settlement_field, features)
        return

    fields, records, file_shape_type, geometry_types, municipality_field, settlement_field, features = convert(
        args.base, args.out
    )
    print_report(fields, records, file_shape_type, geometry_types, municipality_field, settlement_field, features)
    print()
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
