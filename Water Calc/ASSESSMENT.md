# Water Calculator – Assessment & Improvement Ideas

## Overall verdict

The calculator is **in good shape**: clear structure, aligned with the unified UX spec, sensible defaults, and validation-backed assumptions. The suggestions below are optional refinements, not must-fix issues.

---

## What’s working well

- **Structure**: Deployment params → Water use (with unit toggle) → Bladder config → Toolbar → Scenarios → Results. Easy to follow.
- **Unified UX**: Same banner, button roles (Print, Reset, Save/Load/Delete/Clear/Import), scenario block, and hover on input areas as other Field Hospital tools.
- **Single wastewater field**: Matches real practice; breakdown toggle gives an estimate without changing the model.
- **Unit handling**: L/G toggle with liter values preserved when switching back; gallons rounded up.
- **Print**: Deployment alignment fixed; Estimated Totals & Schedule kept on one page; toolbar/scenarios hidden.
- **Scenarios**: Save/Load/Delete/Clear/Import; backward compatibility for old gray/black scenario data.
- **Validation**: Defaults (80 L potable, 65 L wastewater) align with MSF-style guidance; validation report on file.

---

## Optional improvements

### 1. **Export scenario to file**

- **Now**: Import from JSON only.
- **Idea**: Add “Export to file” (or “Download scenario”) so users can save the current scenario as a JSON file. Matches other calculators and supports backup/sharing.

### 2. **Zero deployment days**

- **Now**: With “Days = 0”, totals are 0 and delivery/pickup text can read “~0 over deployment (every ~X days)”.
- **Idea**: If `days === 0`, show “—” or “Enter deployment length” for delivery/pickup instead of “~0 over deployment”.

### 3. **Breakdown in gallons**

- **Now**: Breakdown always shows “X L” and “Y L” (converted from current wastewater).
- **Idea**: Optional: when unit is Gallons, show breakdown in gallons as well, e.g. “~17 Gal gray (~77%), ~5 Gal black (~23%)”. Low priority since L is the common planning unit.

### 4. **Print: hide breakdown toggle**

- **Now**: “Show breakdown” (or “Hide breakdown”) can appear on the printed page.
- **Idea**: In `@media print`, hide `.breakdown-toggle` and, if you want the breakdown on print, show `.breakdown-display` only when it’s open (or always hide it for a cleaner print). Easiest is: hide the toggle and the breakdown panel when printing.

### 5. **Validation report wording**

- **Now**: `VALIDATION_REPORT.md` still says “Gray water output” and “Black water output” in the “Current Default Values” section.
- **Idea**: Update to “Wastewater output: 65 L/bed/day” and add a short note that the calculator uses a single wastewater field with an optional gray/black breakdown estimate.

### 6. **Bladder capacity unit**

- **Now**: Capacity is L only.
- **Idea**: Leave as-is unless users ask for gallons; adding a second unit would complicate the UI and most planning is in liters.

### 7. **WATER_DEFAULTS and bladders**

- **Now**: `water-data.js` has no bladder defaults (count/capacity); defaults are 0 and 5000 in code.
- **Idea**: Either add `potableBladderCount`, `potableBladderCapacity`, etc. to `WATER_DEFAULTS` for consistency, or add a short comment in `water-data.js` that bladder defaults are in script.js. Optional consistency tweak.

### 8. **Short disclaimer in UI**

- **Now**: Schedule note explains that delivery/pickup are estimates.
- **Idea**: One line near results or in the schedule note: “Defaults based on MSF-style guidance (e.g. 60–80 L/bed/day). Adjust for context.” Keeps validation visible without clutter.

---

## Not recommended (or later)

- **Splitting gray/black again**: You chose a single wastewater field to match practice; no need to revert.
- **Decimal gallons**: Keeping gallons as whole numbers and liters as stored source is the right trade-off.
- **Heavy accessibility overhaul**: Labels and structure are fine; full ARIA/keyboard audit can wait unless required.

---

## Summary

| Area           | Status   | Suggestion                          |
|----------------|----------|-------------------------------------|
| UX / flow      | Good     | Optional: Export scenario to file   |
| Logic / units  | Good     | Optional: clearer message when days=0|
| Print          | Good     | Optional: hide breakdown toggle/panel|
| Validation     | Good     | Update VALIDATION_REPORT wording    |
| Docs / defaults| Good     | Optional: disclaimer line, WATER_DEFAULTS note |

No blocking issues; the calculator is ready for use. The items above are small, incremental improvements you can do when convenient.
