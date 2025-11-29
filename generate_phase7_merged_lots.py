import csv
import json
from pathlib import Path

# Paths are relative to the Phase7Data folder
CSV_PATH = Path("Phase7Residents_with_coords.csv")
OUT_PATH = Path("phase7_merged_lots.js")

def to_int(value):
    v = (value or "").strip()
    if v == "":
        return None
    return int(v)

def to_str_or_null(value):
    v = (value or "").strip()
    return v if v != "" else None

def to_bool_flag(value):
    v = (value or "").strip().upper()
    return v.startswith("Y")

def main():
    # Handle UTF-8 with BOM from Excel exports
    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = []

        for row in reader:
            obj = {
                "phaseNumber": to_int(row.get("phaseNumber")),
                "lotNumber": to_int(row.get("lotNumber")),
                "homeTypeStyle": to_str_or_null(row.get("homeTypeStyle")),
                "contractStatus": to_str_or_null(row.get("contractStatus")),
                "primaryName": to_str_or_null(row.get("primaryName")),
                "secondaryName": to_str_or_null(row.get("secondaryName")),
                "originCityState": to_str_or_null(row.get("originCityState")),
                "address": to_str_or_null(row.get("address")),
                "x": to_int(row.get("x")),
                "y": to_int(row.get("y")),
                "phone": to_str_or_null(row.get("phone")),
                "notes": to_str_or_null(row.get("notes")),
                "isChristmasStation": to_bool_flag(row.get("isChristmasStation")),
                "isSensitive": to_bool_flag(row.get("isSensitive")),
                "christmasStationDetails": to_str_or_null(row.get("christmasStationDetails")),
            }
            rows.append(obj)

    with OUT_PATH.open("w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED FILE — DO NOT EDIT BY HAND\n")
        f.write("// Source: Phase7Residents_with_coords.csv\n\n")
        f.write("const phaseResidentsData = ")
        json.dump(rows, f, indent=2)
        f.write(";\n")

    print(f"Wrote {OUT_PATH} from {CSV_PATH} ({len(rows)} rows)")

if __name__ == "__main__":
    main()
