# CURSOR FIX 02 — Water Calc: Prefix all HTML IDs to match script.js

## Problem
`Water Calc/script.js` uses `water-` prefixed element IDs throughout (e.g. `g('water-days')`,
`g('water-beds')`). But `Water Calc/index.html` still has the old unprefixed IDs (e.g. `id="days"`,
`id="beds"`). This means every `getElementById` call in the script returns `null`, so the
Estimated Totals section is completely non-functional — inputs have no effect on outputs.

## Fix
Run the Python script below from the repo root. It rewrites `Water Calc/index.html` in place,
adding `water-` prefix to every affected `id="..."`, `for="..."`, and `name="..."` attribute.

Do NOT touch `script.js`. Do NOT touch any file in `Backup and Restore points\`.
Do NOT edit data files (water-data.js).

---

## Python script — run this exactly

```python
import re

filepath = "Water Calc/index.html"

with open(filepath, "r", encoding="utf-8") as f:
    html = f.read()

# All IDs that need water- prefix added
# Format: old value -> new value
id_replacements = {
    'id="btn-clear-autosave"':      'id="water-btn-clear-autosave"',
    'id="print-btn"':               'id="water-print-btn"',
    'id="reset-btn"':               'id="water-reset-btn"',
    'id="save-btn"':                'id="water-save-btn"',
    'id="scenario-select"':         'id="water-scenario-select"',
    'id="load-btn"':                'id="water-load-btn"',
    'id="delete-btn"':              'id="water-delete-btn"',
    'id="clear-btn"':               'id="water-clear-btn"',
    'id="import-btn"':              'id="water-import-btn"',
    'id="export-btn"':              'id="water-export-btn"',
    'id="export-format-dialog"':    'id="water-export-format-dialog"',
    'id="export-format-cancel"':    'id="water-export-format-cancel"',
    'id="export-format-confirm"':   'id="water-export-format-confirm"',
    'id="scenario-name"':           'id="water-scenario-name"',
    'id="scenario-notes"':          'id="water-scenario-notes"',
    'id="file-input"':              'id="water-file-input"',
    'id="button-feedback"':         'id="water-button-feedback"',
    'id="days"':                    'id="water-days"',
    'id="beds"':                    'id="water-beds"',
    'id="buffer"':                  'id="water-buffer"',
    'id="potable-rate"':            'id="water-potable-rate"',
    'id="wastewater-rate"':         'id="water-wastewater-rate"',
    'id="breakdown-toggle"':        'id="water-breakdown-toggle"',
    'id="breakdown-display"':       'id="water-breakdown-display"',
    'id="breakdown-gray"':          'id="water-breakdown-gray"',
    'id="breakdown-black"':         'id="water-breakdown-black"',
    'id="potable-count"':           'id="water-potable-count"',
    'id="potable-capacity"':        'id="water-potable-capacity"',
    'id="wastewater-count"':        'id="water-wastewater-count"',
    'id="wastewater-capacity"':     'id="water-wastewater-capacity"',
    'id="potable-supply-mode"':     'id="water-potable-supply-mode"',
    'id="wastewater-disposal-mode"':'id="water-wastewater-disposal-mode"',
    'id="mains-flow-section"':      'id="water-mains-flow-section"',
    'id="mains-flow-rate"':         'id="water-mains-flow-rate"',
    'id="out-potable-total"':       'id="water-out-potable-total"',
    'id="out-potable-per-day"':     'id="water-out-potable-per-day"',
    'id="potable-delivery-row"':    'id="water-potable-delivery-row"',
    'id="out-potable-deliveries"':  'id="water-out-potable-deliveries"',
    'id="potable-mains-row"':       'id="water-potable-mains-row"',
    'id="out-mains-status"':        'id="water-out-mains-status"',
    'id="potable-buffer-row"':      'id="water-potable-buffer-row"',
    'id="out-potable-buffer"':      'id="water-out-potable-buffer"',
    'id="out-wastewater-total"':    'id="water-out-wastewater-total"',
    'id="out-wastewater-per-day"':  'id="water-out-wastewater-per-day"',
    'id="wastewater-pickup-row"':   'id="water-wastewater-pickup-row"',
    'id="out-wastewater-pickups"':  'id="water-out-wastewater-pickups"',
    'id="wastewater-mains-row"':    'id="water-wastewater-mains-row"',
    'id="schedule-note"':           'id="water-schedule-note"',
    'id="version-info"':            'id="water-version-info"',
}

# for= label attributes that need water- prefix
for_replacements = {
    'for="days"':                   'for="water-days"',
    'for="beds"':                   'for="water-beds"',
    'for="buffer"':                 'for="water-buffer"',
    'for="potable-rate"':           'for="water-potable-rate"',
    'for="wastewater-rate"':        'for="water-wastewater-rate"',
    'for="potable-count"':          'for="water-potable-count"',
    'for="potable-capacity"':       'for="water-potable-capacity"',
    'for="wastewater-count"':       'for="water-wastewater-count"',
    'for="wastewater-capacity"':    'for="water-wastewater-capacity"',
    'for="mains-flow-rate"':        'for="water-mains-flow-rate"',
    'for="scenario-name"':          'for="water-scenario-name"',
    'for="scenario-notes"':         'for="water-scenario-notes"',
}

# radio name attributes
name_replacements = {
    'name="export-format" value="JSON"': 'name="water-export-format" value="JSON"',
    'name="export-format" value="CSV"':  'name="water-export-format" value="CSV"',
}

all_replacements = {**id_replacements, **for_replacements, **name_replacements}

for old, new in all_replacements.items():
    if old in html:
        html = html.replace(old, new)
        print(f"  REPLACED: {old}")
    else:
        print(f"  NOT FOUND (check manually): {old}")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(html)

print("\nDone. Water Calc/index.html updated.")
```

---

## After running

1. Check the output — every line should say REPLACED, not NOT FOUND.
2. Restart server: `python -m http.server 8080`
3. Hard refresh: Ctrl+Shift+R
4. Test: open Water Calc standalone (`http://localhost:8080/Water Calc/index.html`)
5. Enter values in Deployment Parameters — Estimated Totals should now update live.
6. If working: `git add "Water Calc/index.html"` → `git commit -m "fix: prefix Water Calc HTML IDs to match script.js"`

## What this does NOT fix
- Item 5 (Storage Configuration placeholder zeros) — separate fix
- This fix is for the standalone Water Calc page only
- The Shell (Calcs Shell/index.html) already has correct water- prefixed IDs and is unaffected
