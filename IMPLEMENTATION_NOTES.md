# Calcs Final — Implementation Notes

**Source:** `Fixes Files/master-implementation-brief.md`  
**Primary use case:** Five standalone calculators. All changes must preserve standalone operation.

---

## Tier 1 (Bugs) — Completed

- **T1.1** Water: Rate inputs already use `placeholder="0"` (no hardcoded values).
- **T1.2** Water: Zero beds/days messaging already correct (`Enter deployment length and number of beds`).
- **T1.3** Water: Scenario sort now normalises timestamp (number or ISO string) so imported scenarios sort correctly.
- **T1.4 / T1.5** Load Pro: No `alert()` calls present; already using inline validation and `acknowledge()`.
- **T1.6** Medicines: Replaced three `alert()` calls with `showFeedback(..., 'info')` and clear file input on error.
- **T1.7** Load Basic: Scenario dropdown uses `s.id` for option value; load and delete look up by id (stable after delete).
- **T1.8** Water: Print CSS already hides `.breakdown-toggle` and `#breakdown-display`.
- **T1.9** Water: `mains-flow-rate` already in `VALIDATION_RULES` with blur validation.
- **T1.10** Load Basic + Load Pro: Sort preference is restored from `localStorage` in `init()`.

---

## T4.1 Deferred (Standalone Rule)

**Do not implement** extraction to `suite-helpers.js` or any shared external script. Calcs must remain fully standalone (e.g. single folder copy, thumb drive).

When implementing T2/T3 changes that touch **initHelpPopovers** or **setupPlaceholderBehavior**, apply the updated logic **in each calculator’s own script file** — do not introduce a shared module or reference an external script.

---

## Tier 2 (Cross-Suite Consistency) — Completed

- **T2.1** Scenario name/notes: Already present in Water, Consumables, Medicines.
- **T2.2** Autosave: Medicines init now restores from AUTOSAVE_KEY and shows last-saved; Load Basic and Water already had autosave.
- **T2.3** Feedback standardisation (showFeedback for Load Basic/Pro): Deferred for later.
- **T2.4** Filter notice: Warning prefix added to message in Load Basic and Load Pro.
- **T2.5** Scenario-storage note: Added to Water, Consumables, Medicines.
- **T2.6** Water footer: Already present.
- **T2.7** Footer/disclaimer: Standardised copy and .disclaimer / .last-saved CSS; Load Basic and Consumables styles updated.
- **T2.8** SheetJS: Startup check added in Consumables and Medicines when XLSX is undefined.
- **T2.9** kW alignment: Load Pro already matched audit.
- **T2.10–T2.11** .calc-app and version: Already present in all five.
- **T2.12** Emoji removed from Consumables and Medicines buttons.
- **T2.13** Responsive @media (max-width: 700px) added to Medicines and Water.
- **T2.14** migrateScenario() added to all five; used in getSavedScenarios and import handlers for backward compatibility.

---

*Last updated: Tier 2 completed. Next: Tier 3. T2.3 (feedback standardisation) left for later.*
