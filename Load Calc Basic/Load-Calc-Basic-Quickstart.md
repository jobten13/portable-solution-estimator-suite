# Load Calculator Basic - Quickstart

This is a field-first, one-page quick guide for first-time users.

## What this tool does

`Load Calculator Basic` estimates:

- total connected load (kW)
- recommended generator size (kW) using the 80% loading rule
- fuel runtime estimate (gallons-based)

Use it for planning and rapid field checks. It is not a final engineering design tool.

## Open and run

1. Open `index.html` in a modern browser.
2. No internet or server is required.
3. All save/autosave data stays in the current browser on the current device.

## Fast workflow (recommended)

1. Enter quantities for equipment rows.
2. Use `Sort` and `Search` to focus the list.
3. Review side cards:
   - `Total connected load (all items)`
   - `Recommended generator`
   - `Check Against Available Generator`
   - `Fuel & Runtime Estimate`
4. Enter:
   - `Available generator capacity` (kW)
   - `Fuel Tank Capacity` (Gallons)
5. Print or save/export as needed.

## Scenarios and files

- `Save Scenario`: save current worksheet as a named scenario.
- `Load/Delete/Clear all`: manage saved scenarios in this browser.
- `Export to file`: choose JSON (backup/re-import) or CSV (human-readable report).
- `Import from file`: load a JSON scenario file.

If imported data has issues, the tool sanitizes values and can download a text report describing what was corrected.

## Autosave (toolbar)

- `Clear Autosaved State`: removes worksheet recovery state only.
- `Last autosaved`: shows latest autosave timestamp.
- Named saved scenarios are **not** deleted by clearing autosave state.

## Reset buttons

- `Reset Quantities`: clears quantities only.
- `Reset Worksheet`: clears worksheet fields and custom rows.

Both actions ask for confirmation before applying.

## Important usage notes

- Search filters the view, but all-items totals remain authoritative.
- `Filtered view load` appears only when search is active.
- Confirm critical equipment nameplate ratings and starting behavior before final decisions.

## Safety/disclaimer

This calculator is a simplified estimator for planning support. Final electrical sizing must be validated by qualified engineering personnel.
