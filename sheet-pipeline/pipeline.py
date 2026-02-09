import os
import csv
import json
import requests
from openpyxl import load_workbook

SHEET_ID = os.environ.get("SHEET_ID", "")
OUT_DIR = os.environ.get("OUT_DIR", "/out")
START_ROW = int(os.environ.get("START_ROW", "5"))
SHEET_NAME = os.environ.get("SHEET_NAME")  # optional; default = active sheet

if not SHEET_ID:
    raise SystemExit("Missing SHEET_ID env var")

os.makedirs(OUT_DIR, exist_ok=True)

xlsx_path = os.path.join(OUT_DIR, "sheet.xlsx")
csv_path = os.path.join(OUT_DIR, "out.csv")
json_path = os.path.join(OUT_DIR, "out.json")

export_url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"

print("Downloading:", export_url)
r = requests.get(export_url, timeout=60)
r.raise_for_status()

# If not public, you may get HTML back.
ct = (r.headers.get("content-type") or "").lower()
if "text/html" in ct and r.content.lstrip().startswith(b"<!"):
    raise SystemExit("Got HTML (likely not public / needs auth).")

with open(xlsx_path, "wb") as f:
    f.write(r.content)

wb = load_workbook(xlsx_path, data_only=True)
ws = wb[SHEET_NAME] if SHEET_NAME else wb.active

def cell_link(cell) -> str:
    if cell.hyperlink and cell.hyperlink.target:
        return str(cell.hyperlink.target)
    return ""

rows = []
for r_idx in range(START_ROW, ws.max_row + 1):
    fcell = ws[f"F{r_idx}"]
    gcell = ws[f"G{r_idx}"]

    f_text = fcell.value or ""
    g_text = gcell.value or ""
    f_url = cell_link(fcell)  # required per your rule
    g_url = cell_link(gcell)  # optional

    if not (f_text or g_text or f_url or g_url):
        continue

    rows.append({
        "row": r_idx,
        "F_text": f_text,
        "F_url": f_url,
        "G_text": g_text,
        "G_url": g_url,
    })

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["row", "F_text", "F_url", "G_text", "G_url"])
    w.writeheader()
    w.writerows(rows)

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

print("Wrote:", csv_path)
print("Wrote:", json_path)
