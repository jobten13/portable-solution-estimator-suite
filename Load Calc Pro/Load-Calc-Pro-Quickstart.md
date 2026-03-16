# Load Calculator Pro - Quickstart

This is a field-first, one-page quick guide for first-time users.

## What this tool does

`Load Calculator Pro` estimates:

- running load (kW and kVA)
- peak starting kVA (largest motor start logic)
- recommended generator size (kVA)
- fuel runtime estimate (gallons-based)

Use it for planning and rapid field checks. It is not a final engineering design tool.

## Open and run

1. Open `index.html` in a modern browser.
2. No internet or server is required.
3. All save/autosave data stays in the current browser on the current device.

## Fast workflow (recommended)

1. Enter quantities and review row kW/PF values.
2. Use `Sort` and `Search` to focus the list.
3. Review side cards:
   - total running kW and kVA
   - peak starting kVA
   - recommended generator size (kVA)
   - capacity status and runtime
4. Enter:
   - `Actual generator size` (kVA)
   - `Fuel tank capacity` (Gallons)
   - `Consumption (per kW)` (Gal/hr per kW)
5. Print or save/export as needed.

## Scenarios and files

- `Save Scenario`: save current worksheet as a named scenario.
- `Load/Delete/Clear all`: manage saved scenarios in this browser.
- `Export to file`: choose JSON (backup/re-import) or CSV (human-readable report).
- `Import from file`: load a JSON scenario file.

If imported data has issues, the tool sanitizes values and reports import issues.

## Autosave (toolbar)

- `Clear Autosaved State`: removes worksheet recovery state only.
- `Last autosaved`: shows latest autosave timestamp.
- Named saved scenarios are **not** deleted by clearing autosave state.

## Reset buttons

- `Reset Quantities`: clears quantities and removes custom rows.
- `Reset Worksheet`: full reset to defaults for quantities, kW/PF, custom rows, and side inputs.

Both actions ask for confirmation before applying.

## Important usage notes

- Main totals are all-items values.
- Filtered subtotals appear when search is active.
- Final generator selection must satisfy both running and peak-start requirements.

## Safety/disclaimer

This calculator is a simplified estimator for planning support. Final electrical sizing must be validated by qualified engineering personnel.
