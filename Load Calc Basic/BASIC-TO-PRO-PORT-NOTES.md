# Load Calc Basic -> Pro Port Notes

Purpose: record completed `Load Calc Basic` updates that may be reused in `Load Calc Pro` where appropriate.

## 1) Scenario panel behavior when empty
- Change in Basic:
  - Scenario dropdown shows a clear placeholder (`No saved scenarios`).
  - Scenario controls are disabled when no scenarios exist (`Load`, `Delete`, `Clear all`, select).
- Why:
  - Prevents confusing click behavior and avoids no-op actions.
- Pro port status:
  - **Candidate for Pro** (if Pro currently allows interactions with empty scenario state).

## 2) Scenario section compact styling alignment
- Change in Basic:
  - Scenario action controls resized/compacted to match the Consumables/Medicines design pattern.
  - Compact layout and button sizing refinements applied in CSS.
- Why:
  - Visual consistency across the calculator suite.
- Pro port status:
  - **Already applied** (Pro was updated to same compact scenario style in this workstream).

## 3) Dual totals in summary (search-aware)
- Change in Basic:
  - Added two totals in sidebar summary:
    - `Total connected load (all items)` (authoritative planning total).
    - `Filtered view load` (shown only when search filter is active).
  - Calculation logic now separately sums visible filtered rows vs all rows.
- Why:
  - Removes ambiguity between view-only filtering and full-scope planning totals.
- Pro port status:
  - **Already applied** (Pro now includes filtered + all-items totals in summary).

## 4) Tooltips/help-popovers coverage
- Change in Basic:
  - Added/standardized help-popover behavior and content for:
    - Scenarios
    - Equipment List
    - Summary
    - Capacity Check
    - Fuel/Runtime
- Why:
  - Better user guidance and consistency with newer suite UX patterns.
- Pro port status:
  - **Candidate for Pro review** (verify wording and completeness parity section-by-section).

## 5) Equipment List heading parity
- Change in Basic:
  - Added explicit `Equipment List` section title above the table.
  - Styled to mirror Scenario title typography (font/weight/size consistency).
- Why:
  - Improves visual hierarchy and section clarity.
- Pro port status:
  - **Candidate for Pro** (if Pro heading structure differs).

## 6) Import sanitization + downloadable issue report
- Change in Basic:
  - Import path sanitizes scenario JSON values (generator/fuel/equipment rows).
  - Invalid/coerced values are logged to user-facing warning text.
  - Downloadable printable import issue report added for troubleshooting.
- Why:
  - Prevents runtime failures from malformed imports and gives transparent feedback.
- Pro port status:
  - **Candidate for Pro** (if Pro import path does not already implement same sanitization/report pattern).

## 7) Fuel unit safety hardening (gallons-only standard in Basic)
- Change in Basic:
  - Removed L/G behavioral ambiguity from import/save/display flow.
  - Standardized Basic to gallons-based handling:
    - Export/save writes `fuelUnit: "G"`.
    - Import normalizes incoming unit to gallons for Basic.
    - Legacy liter values are converted for gallons UI consistency.
    - Sanitization warnings explain unit normalization/conversion.
- Why:
  - Eliminates risk of unit mismatch in a gallons-labeled UI.
- Pro port status:
  - **Pro-specific decision required**.
  - Apply only if Pro should also become gallons-only. If Pro intentionally remains multi-unit, port only the sanitization/reporting robustness, not the gallons-only restriction.

## 8) Version label placement and alignment
- Change in Basic:
  - Removed top-banner version display.
  - Uses footer `version-label` pattern and centered text.
- Why:
  - Common suite-wide version display standard.
- Pro port status:
  - **Already applied**.

---

## Suggested port order for Pro (if needed later)
1. Empty-state scenario control hardening.
2. Import sanitization/report parity audit.
3. Help-popover text parity pass.
4. Equipment heading parity pass.
5. Fuel-unit model decision (keep multi-unit vs gallons-only).
