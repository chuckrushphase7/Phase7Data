#!/usr/bin/env python3
"""
build_phase7_js.py

Reads Phase7Residents_with_coords.csv (with new clean field names)
and generates phase7_merged_lots.js for the web/Android app.

Expected CSV columns (header row):

    phaseNumber
    lotNumber
    homeTypeStyle
    contractStatus
    primaryName
    secondaryName
    originCityState
    address
    x
    y
    phone
    notes
    isChristmasStation
    isSensitive
    christmasStationDetails
"""

import argparse
import csv
import json
import sys
from pathlib import Path


# ----------------------------
# Helpers
# ----------------------------

def parse_int(value, field_name):
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        print(f"[WARN] Could not parse integer for {field_name!r}: {value!r}", file=sys.stderr)
        return None


def parse_bool(value, field_name):
    """
    Accepts: 1, 0, true, false, yes, no, y, n (any case)
    Empty / missing -> False
    """
    if value is None:
        return False
    value = value.strip().lower()
    if value in ("1", "true", "yes", "y"):
        return True
    if value in ("0", "false", "no", "n"):
        return False
    if value == "":
        return False

    print(f"[WARN] Could not parse boolean for {field_name!r}: {value!r} -> treating as False", file=sys.stderr)
    return False


def normalize_text(value):
    """
    Convert empty/NaN-like strings to None so they become `null` in JSON.
    """
    if value is None:
        return None
    value = str(value).strip()
    if value == "" or value.lower() == "nan":
        return None
    return value


# ----------------------------
# Core build function
# ----------------------------

def build_js(input_csv: Path, output_js: Path):
    if not input_csv.exists():
        print(f"[ERROR] Input CSV not found: {input_csv}", file=sys.stderr)
        sys.exit(1)

    lots = []

    with input_csv.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        # Validate expected columns
        expected_columns = {
            "phaseNumber",
            "lotNumber",
            "homeTypeStyle",
            "contractStatus",
            "primaryName",
            "secondaryName",
            "originCityState",
            "address",
            "x",
            "y",
            "phone",
            "notes",
            "isChristmasStation",
            "isSensitive",
            "christmasStationDetails",
        }

        missing = expected_columns - set(reader.fieldnames or [])
        if missing:
            print("[ERROR] CSV is missing expected columns:", file=sys.stderr)
            for col in sorted(missing):
                print(f"   - {col}", file=sys.stderr)
            sys.exit(1)

        for row in reader:
            phase_number = parse_int(row.get("phaseNumber"), "phaseNumber")
            lot_number = parse_int(row.get("lotNumber"), "lotNumber")
            x = parse_int(row.get("x"), "x")
            y = parse_int(row.get("y"), "y")

            lot = {
                "phaseNumber": phase_number,
                "lotNumber": lot_number,
                "homeTypeStyle": normalize_text(row.get("homeTypeStyle")),
                "contractStatus": normalize_text(row.get("contractStatus")),
                "primaryName": normalize_text(row.get("primaryName")),
                "secondaryName": normalize_text(row.get("secondaryName")),
                "originCityState": normalize_text(row.get("originCityState")),
                "address": normalize_text(row.get("address")),
                "x": x,
                "y": y,
                "phone": normalize_text(row.get("phone")),
                "notes": normalize_text(row.get("notes")),
                "isChristmasStation": parse_bool(row.get("isChristmasStation"), "isChristmasStation"),
                "isSensitive": parse_bool(row.get("isSensitive"), "isSensitive"),
                "christmasStationDetails": normalize_text(row.get("christmasStationDetails")),
            }

            lots.append(lot)

    # Sort by phaseNumber then lotNumber for consistency
    lots.sort(key=lambda r: (
        r["phaseNumber"] if r["phaseNumber"] is not None else 0,
        r["lotNumber"] if r["lotNumber"] is not None else 0,
    ))

    # Build JS file content
    js_obj_name = "phaseResidentsData"  # This is what your index.html JS will use

    json_text = json.dumps(lots, indent=2, ensure_ascii=False)

    js_content = (
        "// AUTO-GENERATED FILE — DO NOT EDIT BY HAND\n"
        f"// Source: {input_csv.name}\n\n"
        f"const {js_obj_name} = {json_text};\n\n"
        "// Expose for browser usage\n"
        "if (typeof window !== 'undefined') {\n"
        f"  window.{js_obj_name} = {js_obj_name};\n"
        "}\n\n"
        "// Export for Node/testing (optional)\n"
        "if (typeof module !== 'undefined' && module.exports) {\n"
        f"  module.exports = {js_obj_name};\n"
        "}\n"
    )

    output_js.parent.mkdir(parents=True, exist_ok=True)
    with output_js.open("w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"[OK] Read {len(lots)} rows from {input_csv}")
    print(f"[OK] Wrote JS data to {output_js}")


# ----------------------------
# CLI
# ----------------------------

def main():
    parser = argparse.ArgumentParser(description="Build Phase 7 JS data file from CSV")
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=Path("Phase7Residents_with_coords.csv"),
        help="Input CSV file (default: Phase7Residents_with_coords.csv)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("phase7_merged_lots.js"),
        help="Output JS file (default: phase7_merged_lots.js)",
    )

    args = parser.parse_args()

    build_js(args.input, args.output)


if __name__ == "__main__":
    main()
