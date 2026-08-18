# Pharmaceuticals Supply List Calculator (Ward-ICU-Pharma)

Part of the **Portable Solution Estimator Suite**. Manages pharmaceuticals requirements for field hospital deployments: load the pre-built **Ward Meds** or **ICU Meds** list, set deployment parameters (days, beds, buffer), add custom items, and save/load scenarios. Sort and search filter the list.

## Suite versioning

**Suite** version is defined in **`../version.json`** — see **[`../../VERSIONING.md`](../../VERSIONING.md)** for how to bump releases and what testers report. **Do not** duplicate the suite version number in this README; the page footer shows **Suite v…** at runtime. This README describes **Pharmaceuticals** only (including in-app user guide / tooltips).

---

## How to run

Open this folder’s **`index.html`** — it redirects to **`../index.html#medicines`** in the Portable-Solution-Estimator-Suite shell. No server required. Works offline.

**Dependencies:** `script.js` (main logic), `medications-data.js` (Ward/ICU pharmaceuticals list data), `styles.css`.

---

## Functionality

### Data sources
- **Ward Meds** — Load the built-in Ward pharmaceuticals list from `medications-data.js` (`PHARMA_ITEMS`).
- **ICU Meds** — Load the built-in ICU pharmaceuticals list from `medications-data.js` (`PHARMA_ITEMS_SECONDARY`).
- **Add Item** — Add a custom pharmaceuticals item with a per-day/per-bed rate directly in the calculator.
- **Reset Worksheet** — Remove all items and reset to empty state (toolbar; clears deployment inputs and scenario name/notes per app behavior).

### Toolbar: autosave and list-loading tooltips
- **Restore Autosave** — Grey (**secondary**) button. Restores the last autosaved worksheet state in this browser (recovery slot); named scenarios in the dropdown are unchanged.
- **Autosaved:** — Text next to Restore Autosave when a timestamp exists. Format: **Autosaved: M/D h:mm AM/PM** (no year, no seconds). Empty when there is no autosave to show.
- **Ward Meds** / **ICU Meds** — Blue/gold (**`.btn-ucd`**) buttons. Hover tooltips (browser `title` attribute):
  - **Ward Meds:** *Load the built-in Ward pharmaceuticals list from medications-data.js; replaces the current worksheet list.*
  - **ICU Meds:** *Load the built-in ICU pharmaceuticals list from medications-data.js; replaces the current worksheet list.*

### Deployment parameters
- **Expected Length of Deployment (Days)** — Number of days (used for scaling or notes).
- **Expected Number of Beds** — Bed count (context for quantities).
- **Buffer Percentage (%)** — Optional buffer (e.g. 10 for 10%) applied to quantities. Range 0–100.

### Pharmaceuticals requirements table
- **Per row:** Item name and calculated quantity. Totals/summary reflect visible rows after search.
- **Row deletion:** Any row can be deleted using the row-level **Delete** action for scenario-specific tailoring. Loading Ward or ICU meds restores the original baseline list.
- **Items count line** — Below the search box: when the worksheet has items, shows counts such as **`N Ward Meds items loaded`** or **`N ICU Meds items loaded`**, **`N of M Ward Meds items shown`** when search/filters hide rows, or **`Custom List`** / other **`currentFileName`** labels as appropriate. With no list label, shows **`N items loaded`** or **`N of M items shown`**. The toolbar no longer shows a separate “file status” label; the active list name is included in this line.
- **Sort** — Name A–Z/Z–A, Total quantity High to Low / Low to High, plus **Source list order** when a built-in list is active (persisted in localStorage).
- **Search** — Filter items by name (live); row count and totals use visible rows only.

### Scenarios
- **Save scenario** — Uses the Scenario name field; if blank, prompts for a name. Saved scenario names automatically append date/time for traceability. Saves current items, deployment parameters (days, beds, buffer), and notes to browser storage. Validation must pass before saving.
- **Load / Delete / Clear all** — Restore or remove saved scenarios from dropdown.
- **Import from file / Export to file** — JSON scenario files. If imported data contains invalid values, the app sanitizes what it can, warns the user, and downloads a printable `.txt` sanitization report with fix guidance.

### Validation and UX
- **Input validation** — Deployment parameters and quantities validated on blur with red border and inline message where applicable. Save blocked when errors exist.
- **Placeholder behavior** — Numeric inputs use placeholders (e.g. 0); focus clears “0” for easier entry. Loaded scenarios restore empty string for 0 so placeholders show.

### Other
- **Print** — Print-friendly view; toolbar and scenario controls hidden in print.
- **Robust stress test** — Open `stress-test-robust.html` to run standalone robustness checks for quantity logic, invariants, and real-data validation against `PHARMA_ITEMS`.

---

## UX/UI design

- **Layout:** Banner → Toolbar (**Restore Autosave**, **Autosaved:** timestamp, Print, **Ward Meds** / **ICU Meds**, **Reset Worksheet**) → Scenarios → Deployment Parameters (highlight) → Pharmaceuticals Requirements (sort, search, items count line, table).
- **Suite alignment:** Same banner, scenario block, and button roles (Print blue, Ward/ICU list buttons in UC Davis blue/gold, Save/Load green, Delete amber, Clear red, **Restore Autosave** and Import/Export as grey secondary). Structure mirrors the Consumables calculator; IDs use the `meds-` prefix.

---

## File structure

| File | Purpose |
|------|--------|
| `index.html` | Structure, toolbar, scenario UI, deployment params, sort/search, table container. |
| `script.js` | Table build, recalc, validation, scenarios, search filter, sort, placeholder/focus behavior. |
| `medications-data.js` | Ward and ICU pharmaceuticals list data (`PHARMA_ITEMS`, `PHARMA_ITEMS_SECONDARY`). |
| `styles.css` | Layout, cards, table, validation and placeholder styles, print. |
| `stress-test-robust.html` | Standalone robustness test harness for pharmaceuticals quantity calculations and data invariants. |

---

## Technical notes

- **Storage:** Scenarios and sort preference use localStorage keys specific to the Pharmaceuticals calculator (pharma/medications), separate from the Consumables calculator.
- **Search:** Rows without a name match get a hidden class; totals and item count reflect visible rows only.

---

*This tool is a simplified estimator. Verify requirements with qualified personnel before deployment.*
