# Water Requirements Calculator

Part of the **Field Hospital Calculator** suite. Estimates potable water demand, wastewater output, and delivery/pickup schedules for a field hospital based on deployment length, bed count, and storage configuration. All volumes are in **US gallons (Gal)**.

## Suite versioning

**Suite** version is defined in **`../version.json`** — see **[`../VERSIONING.md`](../VERSIONING.md)** for how to bump releases and what testers report. **Do not** duplicate the suite version number in this README; the page footer shows **Suite v…** at runtime. This README describes **Water Requirements** only (including in-app user guide / tooltips).

---

## How to run

Open `index.html` in a modern browser. No server required. Works offline.

**Dependencies:** `water-data.js` (defaults), `script.js` (main logic), `styles.css`.

---

## Functionality

### Deployment parameters
- **Expected length of deployment (days)** — Number of days the facility will operate (0–3650).
- **Expected number of beds** — Bed count driving demand (0–10,000).
- **Buffer percentage** — Optional percentage added to all water quantities (e.g. 10 for 10%). Range 0–100%.

### Water use (per bed per day)
- **Potable water** — Demand per bed per day in gallons (default 22 Gal). Used for total potable demand and delivery schedule.
- **Wastewater output** — Output per bed per day in gallons (default 18 Gal). Used for total wastewater and pickup schedule.
- **Breakdown toggle** — “Show breakdown” displays an estimated split of wastewater into gray (~77%) and black (~23%). Informational only.

### Storage configuration
- **Potable:** number of containers and capacity per container (Gal). Supports bladder tanks, IBC totes, pillow tanks, or fixed cisterns.
- **Wastewater:** number of containers and capacity per container (Gal).  
Capacity drives how often deliveries (potable) and pickups (wastewater) are needed.

### Results
- **Potable:** total demand over deployment, per-day demand, and estimated **water deliveries** (frequency and count) when container count/capacity are set; or **mains supply status** when connected to mains/hybrid.
- **Wastewater:** total output over deployment, per-day output, and estimated **pickups needed** when container count/capacity are set; or **discharged to mains** when sewer is connected.
- **Schedule note** — Short note explaining that delivery/pickup intervals are estimates and that safety margin and logistics should be considered.

### Scenarios
- **Save scenario** — Saves current inputs to browser storage with a timestamped name. Validation must pass before saving.
- **Load scenario** — Restores a saved scenario from the dropdown.
- **Delete scenario** — Removes the selected saved scenario.
- **Clear all scenarios** — Removes all saved scenarios.
- **Import from file / Export to file** — Import or export scenarios as JSON.

### Other actions
- **Print** — Opens print dialog; toolbar and scenario controls are hidden in print view.
- **Restore Autosave** (toolbar) — Grey (**secondary**) button. Restores the last autosaved worksheet state from this browser’s recovery slot; named scenarios in the dropdown are unchanged.
- **Autosaved:** (toolbar) — Text next to Restore Autosave when a timestamp exists. Format: **Autosaved: M/D h:mm AM/PM** (no year, no seconds). Empty when there is no autosave to show.
- **Reset to defaults** — Resets all inputs to defaults (e.g. 0 days/beds/buffer, 22/18 Gal rates, 0 containers).

### Validation and UX
- **Input validation** — Real-time checks on blur for all numeric fields (range and type). Invalid values show a red border and inline error message. Save is blocked until errors are fixed.
- **Placeholder behavior** — Number fields use placeholders (e.g. “0”) instead of pre-filled values; focusing clears “0” for easier entry. Totals treat empty as 0.

---

## UX/UI design

- **Layout:** Banner → Toolbar (**Restore Autosave**, **Autosaved:** timestamp, Print, **Reset to defaults**) → Scenarios panel → Deployment parameters (highlight section) → Water use → Storage configuration (two cards: potable / wastewater) → Supply & disposal mode → Results (two cards + schedule note).
- **Suite alignment:** Same banner style (blue gradient), button colors (e.g. Print blue, Save/Load green, Delete amber, Clear red, Secondary gray), section headings, and param-group layout as other calculators. Disabled scenario buttons use opacity 0.85.
- **Responsive:** Grids and cards wrap on smaller screens. Print styles hide controls and simplify the view.

---

## File structure

| File            | Purpose |
|-----------------|---------|
| `index.html`    | Structure, sections, form controls, result placeholders. |
| `script.js`     | State (getState/applyState), validation, recalc, scenarios, print, placeholder/focus behavior. |
| `styles.css`    | Layout, colors, cards, validation and placeholder styles, print rules. |
| `water-data.js` | Default values (potable/wastewater per bed per day in gallons). |
| `ASSESSMENT.md` / `VALIDATION_REPORT.md` | Optional project/validation notes. |

---

## Technical notes

- **State:** All inputs (storage config and supply/disposal mode) are captured in `getState()` and restored in `applyState()` for scenarios and reset. Values are stored and calculated in US gallons; there is no unit conversion.
- **Storage:** Scenarios are stored in `localStorage` under `fieldHospitalWaterScenarios`. Export/import use JSON files.

---

*This calculator is a simplified estimator. Verify requirements with qualified personnel before deployment.*
