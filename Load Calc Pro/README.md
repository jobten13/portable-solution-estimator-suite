# Load Calculator Pro

Part of the **Field Hospital Calculator** suite. Estimates generator load (kW/kVA), peak starting kVA, and fuel runtime for field hospital and similar sites. Supports editable equipment lists, custom rows, and capacity checking against an actual generator size.

---

## How to run

Open `index.html` in a modern browser. No server required. Works offline.

**Dependencies:** `equipment-data.js` (category and item definitions), `script.js` (main logic), `styles.css`. Equipment data is loaded from `LOAD_CALC_PRO_EQUIPMENT` (in `equipment-data.js` or inline).

---

## Functionality

### Equipment categories and table
- **Categories:** Standard Medical, Emergency/Critical, Office & IT, HVAC/Hygiene/Work Lights (data-driven from equipment-data).
- **Per row:** Item name, **Qty**, **kW each**, **PF**, kW total, kVA Peak. Editable kW and PF; quantity drives totals.
- **Search** — Filter equipment by name (live filter). Sidebar shows all-items totals plus filtered-view subtotals (kW and kVA) when search is active.
- **Sort** — Name A–Z/Z–A, kW High/Low, kVA Peak High/Low (persisted in localStorage).
- **Custom rows** — Add items with name, kW, PF, qty via the form above each category. Delete via row icon.
- **Reset Qty** (per category) and **Reset all quantities** — Zero out quantities; Clear Sheet resets quantities, kW/PF to defaults, and generator/fuel inputs.

### Summary and capacity
- **Total running kW (all items)** — Sum of (qty × kW) across all rows (master planning total).
- **Total running kVA (all items)** — Sum of (qty × kW ÷ PF) across all rows.
- **Filtered view load (kW/kVA)** — Subtotals across visible rows only; shown when search is active for focused analysis.
- **Peak starting kVA** — Largest motor start (4× running kVA for inductive loads, PF &lt; 0.95) plus running kVA of the rest. Drives minimum generator rating.
- **Recommended generator size (kVA)** — max(Peak kVA, Total running kVA ÷ 0.8).
- **Generator capacity check** — Enter actual generator kVA; see **kVA margin** and status pill (Adequate margin / Tight / Insufficient / Peak start fail).

### Fuel and runtime
- **Fuel tank capacity** (Gallons) and **Consumption (Gal/hr per kW)** — Used to estimate **Approximate runtime** (hours).

### Scenarios
- **Save scenario** — Saves current equipment quantities, kW/PF, custom rows, and sidebar inputs (kVA, fuel, rate) to browser storage. Validation must pass for key inputs before saving.
- **Load / Delete / Clear all** — Restore or remove saved scenarios from dropdown.
- **Import from file / Export to file** — Export format: JSON (backup/re-import) or CSV (human-readable report). Import accepts JSON scenario files.
- **Worksheet autosave/restore** — In-progress worksheet state autosaves in this browser and restores on reopen.
- **Clear Autosaved State** (toolbar) — Removes worksheet autosave data only; named saved scenarios remain.
- **Last autosaved** (toolbar) — Shows the timestamp of the most recent worksheet autosave in this browser.

### Validation and UX
- **Input validation** — Sidebar (available kVA, fuel capacity, fuel rate) and table inputs (qty, kW, PF) validated on blur with red border and inline message. Save blocked when errors exist.
- **Placeholder behavior** — Number inputs use placeholders (e.g. 0); focus clears “0” for easier entry. Resets and load set empty where value is 0 so placeholders show.

### Other
- **Print** — Print Summary; toolbar, scenario panel, sort bar, search, and add-row forms are hidden in print.
- **Reset Worksheet** — Full reset: quantities, kW/PF to original defaults, remove custom rows, clear generator/fuel inputs and search.

---

## Calculation method and assumptions

*(For electrical engineer review: formulas and constants used for load and generator sizing.)*

### Running load
- **Per row:** Running kVA = qty × (kW ÷ PF). Running kW = qty × kW.
- **Totals:** Total running kW and total running kVA are the sum over all equipment rows. Rows with qty = 0 contribute nothing.

### Peak starting kVA
- **Inductive loads:** A row is treated as inductive (motor / non-linear) when **PF &lt; 0.95** and **kW &gt; 0.1**. For these, starting kVA per unit is taken as **running kVA per unit × 4** (motor start factor).
- **Largest motor for peak:** Only rows with **qty &gt; 0** are considered. Among those, the row with the largest *single-unit* starting kVA (inductive: 4× running kVA per unit; otherwise running kVA per unit) is the “largest motor.”
- **Peak kVA formula:**  
  Peak kVA = (running kVA of all other rows, with the largest-motor row contributing only (qty − 1) × running kVA per unit) + (starting kVA of one unit of the largest motor).  
  If total running kW = 0, peak kVA = 0. Peak kVA is never less than total running kVA.
- **Constants:** Motor start factor = **4.0** (conservative typical inrush assumption; not from a specific standard). No diversity factor is applied to the peak.

### Recommended generator size
- Recommended kVA = **max(Peak kVA, Total running kVA ÷ 0.8)**. The divisor **0.8** is a continuous-load safety factor (equivalent to 80% continuous loading).

### Fuel runtime
- **Runtime (hours)** = Fuel tank capacity (gallons) ÷ (Total running kW × Consumption in gal/h per kW).  
  If total kW, capacity, or consumption is 0 or missing, runtime is shown as 0.

### Summary for reviewer
- **kVA** = kW ÷ PF throughout; PF &lt; 0.95 and kW &gt; 0.1 used only to apply the 4× start factor.
- **Peak** uses only equipment with **qty &gt; 0**; 0-qty rows do not affect peak or recommended kVA.
- This tool is for **estimation and planning**. Final design and generator selection should be verified by a qualified electrical engineer.

---

## UX/UI design

- **Layout:** Banner → Toolbar (Clear Autosaved State, Last autosaved, Print, Reset Quantities, Reset Worksheet) → Scenarios → Sort bar → Search bar → Table note → Main grid (categories column + sidebar). Sidebar: load summary, generator capacity check, fuel & runtime.
- **Suite alignment:** Same banner, scenario block pattern, and button roles (Print blue, Save/Load green, Delete amber, Clear red, Secondary gray). Collapsible categories; status pills for capacity.
- **Files:** `index.html`, `styles.css`, `script.js`, `equipment-data.js`, `UNIFIED_UX_SPEC.md` (suite style guide).

---

## File structure

| File | Purpose |
|------|--------|
| `index.html` | Page structure, sidebar, scenario UI, sort/search. |
| `script.js` | Build tables from equipment data, recalc, validation, scenarios, search filter, sort. |
| `styles.css` | Layout, cards, table, validation and placeholder styles, print. |
| `equipment-data.js` | `LOAD_CALC_PRO_EQUIPMENT` — categories and items (name, kw, pf). |
| `UNIFIED_UX_SPEC.md` | Unified UX/UI spec for the calculator suite. |

---

## Technical notes

- **Sizing:** See **Calculation method and assumptions** above. In short: running kVA = qty × (kW ÷ PF); peak = running kVA excluding largest motor + (one unit of largest motor at 4×); only rows with qty &gt; 0 are considered for largest motor; recommended kVA = max(Peak, Total kVA ÷ 0.8).
- **Storage:** Worksheet autosave under `loadCalcProScenario`; autosave timestamp under `load-pro-lastSaved`; named scenarios under `loadCalcProScenarios`; sort preference under `loadCalcProSort`.
- **Search:** Rows without a name match get class `search-hidden`; recalc sums only visible rows.

---

## Tooltip/help notes

- **Scenarios help** explains save/load/delete/clear/import/export (including export format: JSON or CSV) and scenario naming guidance.
- **Equipment list help** (next to Sort) explains list focus tools and filtered-view subtotal behavior.
- **Summary/capacity/fuel helps** clarify all-items calculation basis and planning assumptions.
- **Toolbar buttons** (Print, User guide, Reset Quantities, Reset Worksheet, Clear Autosaved State) and **Import/Export** have tooltips describing what each does.

---

*Use for estimation only. Verify with a qualified electrical engineer for final design.*
