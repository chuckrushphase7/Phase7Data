import csv
from pathlib import Path

# ============================================================
# CONFIG: FILE LOCATIONS
# ============================================================

# Folder that contains Phase7Residents.csv
DATA_DIR = Path(r"C:\Users\chuck_6\OneDrive\Phase7Data")

# Android assets folder for the Phase7Residents app
ASSETS_DIR = Path(
    r"C:\AndroidStudioProjects\Phase7Residents\app\src\main\assets"
)

# Input CSV
CSV_FILE = DATA_DIR / "Phase7Residents.csv"

# JS outputs
JS_OUT_FILE = DATA_DIR / "phase7_merged_lots.js"          # backup / working copy
ASSETS_JS_FILE = ASSETS_DIR / "phase7_merged_lots.js"     # file used by the app


# ============================================================
# COLUMN NAME MAPPING (MUST MATCH YOUR SHEET HEADERS)
# ============================================================

# Your actual headers (from the screenshot) are:
# Lot Number, Home Type, Style, Contract Status, Resident 1, Resident 2,
# Origin City, State, LMHH Address, x, y, phone, notes,
# isChristmasStation, isSensitive, ChristmasStationDetails

FIELD_MAP = {
    "lotNumber": "Lot Number",
    "x": "x",
    "y": "y",

    "primaryName": "Resident 1",
    "secondaryName": "Resident 2",

    "phone": "phone",
    "notes": "notes",

    "isChristmasStation": "isChristmasStation",
    "christmasStationDetails": "ChristmasStationDetails",
    "isSensitive": "isSensitive",
}


# ============================================================
# HELPERS
# ============================================================

def parse_bool(val):
    """
    Convert common truthy values into JS true/false (as strings).
    Anything not clearly true becomes false.
    """
    if val is None:
        return "false"
    v = str(val).strip().lower()
    if v in ("1", "true", "yes", "y", "t"):
        return "true"
    return "false"


def js_escape_string(value: str) -> str:
    """
    Return a JS-safe quoted string.
    For our app we ALWAYS want a string ("" when blank),
    so front-end code can safely do string operations.
    """
    if value is None:
        value = ""

    value = str(value)

    # For blank / whitespace-only, just emit empty string
    if value.strip() == "":
        return '""'

    # basic escaping: backslashes, double-quotes, newlines
    value = (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "")      # strip CR if present
    )
    return f'"{value}"'



def to_int(value, default=0):
    """
    Safely convert to int, using default on failure.
    """
    try:
        if value is None:
            return default
        text = str(value).strip()
        if text == "":
            return default
        return int(float(text))   # handles "123.0" if it appears
    except (ValueError, TypeError):
        return default


def row_to_js_object(row):
    """
    Convert one CSV row (dict) into a JS object string.
    """
    # Required numeric fields
    lot_num = to_int(row.get(FIELD_MAP["lotNumber"]), 0)
    x = to_int(row.get(FIELD_MAP["x"]), 0)
    y = to_int(row.get(FIELD_MAP["y"]), 0)

    lines = []
    lines.append(f'  {{"lotNumber": {lot_num},')
    lines.append(f'   "x": {x},')
    lines.append(f'   "y": {y},')

    # String-like fields
    for key in ("primaryName", "secondaryName", "phone", "notes"):
        col_name = FIELD_MAP.get(key)
        lines.append(f'   "{key}": {js_escape_string(row.get(col_name))},')

    # Boolean flags
    for key in ("isChristmasStation", "isSensitive"):
        col_name = FIELD_MAP.get(key)
        lines.append(f'   "{key}": {parse_bool(row.get(col_name))},')

    # Christmas details: NaN when blank, otherwise a JS string
    details_val = row.get(FIELD_MAP["christmasStationDetails"])
    if details_val is None or str(details_val).strip() == "":
        # IMPORTANT: bare NaN (unquoted) for blank
        lines.append('   "christmasStationDetails": NaN')
    else:
        lines.append(
            f'   "christmasStationDetails": {js_escape_string(details_val)}'
        )

    lines.append("  }")
    return "\n".join(lines)


# ============================================================
# MAIN
# ============================================================

def main():
    rows = []

    # Read the CSV
    if not CSV_FILE.exists():
        raise SystemExit(f"ERROR: CSV file not found: {CSV_FILE}")

    with CSV_FILE.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        missing_columns = [
            header for header in FIELD_MAP.values() if header not in reader.fieldnames
        ]
        if missing_columns:
            print("ERROR: These required columns are missing from the CSV:")
            for col in missing_columns:
                print(f"  - {col}")
            raise SystemExit("Fix the CSV headers and run again.")

        for row in reader:
            # skip empty lot rows
            if not row.get(FIELD_MAP["lotNumber"]):
                continue
            rows.append(row)

    if not rows:
        raise SystemExit(
            "ERROR: No valid rows found in CSV. "
            "Aborting so you don't ship an empty window.PHASE7_LOTS."
        )

    # Build JS object strings
    js_objects = [row_to_js_object(r) for r in rows]

    # Compose final JS content (no trailing comma, exact wrapper)
    content = "window.PHASE7_LOTS = [\n"
    content += ",\n".join(js_objects)
    content += "\n];\n"

    # Write to working copy in data folder
    JS_OUT_FILE.write_text(content, encoding="utf-8")
    print(f"Wrote {JS_OUT_FILE} with {len(rows)} lots.")

    # Ensure assets dir exists and copy there
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_JS_FILE.write_text(content, encoding="utf-8")
    print(f"Copied to assets: {ASSETS_JS_FILE}")

    print("\nAll done. You can now build the APK.")


if __name__ == "__main__":
    main()
