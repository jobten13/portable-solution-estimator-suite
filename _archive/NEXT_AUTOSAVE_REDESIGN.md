# First thing: Autosave redesign

**Priority:** Do this first when you pick up the project.

## Goal
Change autosave from "save on every change + auto-restore on load" to a **crash-recovery** model that’s clearer for field users in high-stress situations.

## Behavior (target)

1. **Time-based autosave**  
   Save current state to localStorage on a fixed interval (e.g. every 5 minutes). Single slot per calc; each save overwrites the previous. No save on every keystroke/recalc.

2. **No auto-restore on load**  
   When the user opens the app (or a calc in the Shell), always start **fresh**. Do not restore from autosave automatically.

3. **"Restore last autosave" button**  
   Replace the current "Clear autosaved state" button with **"Restore last autosave"**.  
   - On click: restore state from the autosave slot (same apply logic as current load).  
   - Show timestamp on or next to the button (e.g. "Last autosave: 2:34 PM" or "Restore from 2:34 PM").  
   - Disable or hide when there is no autosave data.

4. **Per calc, including in the Shell**  
   Each calc (Load Basic, Load Pro, Water, Consumables, Medicines) keeps its own autosave cache and its own Restore button. Already the case for storage keys; just preserve that.

## Implementation outline (per calc)

- **Remove** the init call that runs `loadWorksheetState()` / `loadSavedData()` (or equivalent) on page load so we never auto-restore.
- **Remove** the call to `saveWorksheetState()` / `saveData()` from the recalc/input path (no save on every change).
- **Add** a `setInterval` (e.g. 5 min) that calls the same save function so we still write one autosave slot per calc.
- **Change** the toolbar button: label to "Restore last autosave", click handler to restore from localStorage (reuse existing apply/load logic) instead of clearing. Keep or add timestamp display; disable button when no autosave.
- **HTML:** Update button label (and any tooltip/aria) in each calc’s standalone `index.html` and in `Calcs Shell/index.html` (all five calc sections).

Optional: keep a small "Clear autosave" control if you want users to wipe the recovery slot; otherwise they can use Reset/New.

## Scope
All five calcs (Load Calc Basic, Load Calc Pro, Water Calc, Consumables Calc, Medicines Calc) and the Calcs Shell. Same pattern in each; estimate ~30–50 lines script change per calc plus HTML label updates.

## Context
Discussed and agreed as better for field users: predictable "open = fresh", one obvious recovery action after a crash, timestamp for confidence. See conversation summary for full rationale.
