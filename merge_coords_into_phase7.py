import csv
from pathlib import Path

DATA_DIR = Path(r"C:\Users\chuck_6\OneDrive\Phase7Data")

RESIDENTS_CSV = DATA_DIR / "Phase7Residents.csv"
COORDS_CSV    = DATA_DIR / "coords.csv"
OUTPUT_CSV    = DATA_DIR / "Phase7Residents_with_coords.csv"


def load_coords():
    coords = {}
    with COORDS_CSV.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            lot_str = row.get("lotNumber")
            if not lot_str:
                continue
            try:
                lot_num = int(lot_str)
            except ValueError:
                continue
            x = row.get("x", "").strip()
            y = row.get("y", "").strip()
            coords[lot_num] = (x, y)
    return coords


def main():
    if not RESIDENTS_CSV.exists():
        raise SystemExit(f"Residents CSV not found: {RESIDENTS_CSV}")
    if not COORDS_CSV.exists():
        raise SystemExit(f"Coords CSV not found: {COORDS_CSV}")

    coords = load_coords()
    print(f"Loaded {len(coords)} coordinate rows from {COORDS_CSV.name}")

    with RESIDENTS_CSV.open(newline="", encoding="utf-8-sig") as f_in, \
         OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as f_out:

        reader = csv.DictReader(f_in)
        fieldnames = reader.fieldnames or []

        # Make sure x/y columns exist
        if "x" not in fieldnames:
            fieldnames.append("x")
        if "y" not in fieldnames:
            fieldnames.append("y")

        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()

        updated = 0
        missing = 0
        rows = 0

        for row in reader:
            rows += 1
            lot_val = row.get("Lot Number")  # matches your header exactly
            if not lot_val:
                writer.writerow(row)
                continue

            try:
                lot_num = int(str(lot_val).strip())
            except ValueError:
                writer.writerow(row)
                continue

            if lot_num in coords:
                x, y = coords[lot_num]
                row["x"] = x
                row["y"] = y
                updated += 1
            else:
                # No coords found for this lot
                missing += 1

            writer.writerow(row)

    print(f"Total rows processed: {rows}")
    print(f"Updated coords for lots: {updated}")
    print(f"Lots with no coords found: {missing}")
    print(f"Wrote merged file: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
