# Suite project tracker — **single pickup / handoff file**

**Cursor / AI:** Persistent project rule — **`.cursor/rules/suite-backlog-and-docs.mdc`** (always apply). Do not resurrect backlog from legacy checklists.

**Use this file to start and end each working session.** Update the session line when you sit down and when you wrap up.

**Backlog rule:** **Do not** maintain the live queue by re‑auditing `PROGRESS.md` or `PRE_DEPLOY_SPRINT.md` against checkboxes — that is **slow and often stale**. Those files are **history / archaeology**. **Now / Soon** here come from **code review + field‑risk judgment** (the agreed **Shell + all five calcs** deep dive). Reopen an old doc only if you need a quote or a dated decision.

| Field | Value |
|--------|--------|
| **Last session** | **2026-03-27** — Playwright suite harness: stable `preflight-handoff.json` handoff (cross-worker / RUN_ID), Load Pro guard coverage moved to **Calcs Shell (Load Pro panel)** so export/import selectors match wired `load-pro-*` IDs; full `suite.spec.js` run green (14/14). |
| **Next pickup** | **Soon** queue: **Consumables restore polish** (UCD Ward/ICU `.active` after restore), or **Standalone parity** when ready. *(**Now** backlog: only multi-tab warning, **on hold**.)* |

---

## Suite concepts — how work is preserved

Operators (and builders) should not conflate these three paths:

1. **Worksheet autosave** — A **recovery** slot in this browser (`localStorage`): the **current sheet** is written on a debounce/interval while you edit. **Restore last autosave** reloads that slot after refresh/crash. It is **not** a named entry in the scenario list; one slot per calc, overwritten as you work.
2. **Save scenario** — **Named** snapshots stored in this browser (`localStorage`), listed in the scenario dropdown for load/compare planning inside the app.
3. **Export** — **File** output (JSON for backup/re-import, CSV where offered). It is **not** stored in the browser as another scenario row; it is backup/share/offline handoff. Restore via **Import** (JSON).

Wrong assumptions here (e.g. treating export like an automatic browser save) drive field mistakes — so reflecting this clearly in **tooltips / scenario help / README** is **operator clarity**, not mere visual polish.

---

## Completed (latest 10 — newest first)

Keep **at most 10** bullets here. When you record an 11th completion, move the **bottom** item to **Completed archive** (still **newest first** there). Not time-of-year based — purely “last 10” + archive.

- [x] **Suite harness: localStorage quota (Water / Consumables / Pharmaceuticals)** — Missing toast after quota simulation is recorded as **inconclusive — environment dependent** (not silent failure); HTML report **Test notes** explains browser quota limits for automation. Production autosave/toast treated as verified; issue closed.
- [x] **Playwright suite harness (preflight + Load Pro target)** — `tests/reports/preflight-handoff.json` mirrors preflight results so guard tests don’t lose validation after worker reload; **Load Calc Pro (standalone)** replaced in `suite.spec.js` with **Calcs Shell (Load Pro panel)** for export/import guard (script expects `load-pro-*` IDs in Shell).
- [x] **Reality-check pass (smoke)** — Print exercised for all five calcs in Shell; output acceptable. Load Basic **listener stacking** not reproduced (panel switching / refresh; no double handlers or duplicate effects).
- [x] **Autosave failure visible (Load Basic / Pro / Consumables / Medicines)** — same toast copy as Water: `Could not autosave (storage may be full or blocked).` on `localStorage` errors in worksheet `saveWorksheetState` / `saveData`; `console.warn` for support. *(Water already had equivalent.)*
- [x] **Shell: failed script load visible** — `onerror` on suite script tags + inline `reportShellScriptLoadError`; red `#shell-toast` with filename, 12s, first failure only. (`Calcs Shell/index.html`.)
- [x] **Unsaved worksheet guard (Load scenario / Import JSON)** — `scenarioLoadGuardDirty` stays true through successful autosave so confirm still fires; cleared on load, import, named save, restore, reset; scenario name/notes wired where needed. (`Load Calc Basic/script.js`, `Load Calc Pro/script.js`, `Water Calc/script.js`, `Consumables Calc/consumables.js`, `Medicines Calc/script.js`.)
- [x] **Pre-deploy: export radio `name=` isolation** — Prevent cross-calc radio interference on export dialogs. (`Calcs Shell/index.html`.)
- [x] **Pre-deploy: Shell print targets active panel** — `@media print` hides shell chrome and hidden panels so only current calc prints. (`Calcs Shell/shell.css`.)
- [x] **Pre-deploy: destructive action confirmations** — `confirm(...)` before clear-all scenarios and reset-worksheet actions across calcs. (e.g. `Load Calc Basic/script.js`, `Load Calc Pro/script.js`, `Water Calc/script.js`, `Consumables Calc/consumables.js`, `Medicines Calc/script.js`.)
- [x] **Autosave parity (Consumables + Medicines)** — Dirty-gated saves, 3s debounce, 60s backup tick, blur flush for scenario text + filters. (`consumables.js`, `Medicines Calc/script.js` — e.g. commit `16ed255`.)
- [x] **Shell pilot accents** — Consumables / Pharmaceuticals active-tab rails + left stripe (violet + cyan); print hides stripe. (`Calcs Shell/shell.css` — checkpoint `f8406c5` area.)
- [x] **Crash-recovery autosave model (suite direction)** — Open fresh, **Restore last autosave**, timestamp line. *(Differs from older “5 min only” write-up in `NEXT_AUTOSAVE_REDESIGN.md`; implementation uses debounce + dirty + interval.)*

## Completed archive (older than the live 10 — newest first)

- [x] **Operator copy: autosave vs scenario vs export** — Shell scenario notes, scenario help popovers (all five panels), **Restore last autosave** tooltips, and suite **README** aligned with **Suite concepts** (three preservation paths).

---

## Now — do next (ordered)

**Suite ops-safety deep dive — Shell + all five calcs** (implement from the **codebase**; order by field data‑loss risk):

1. [ ] **Multi-tab same calc (warn + detect)** — *On hold:* defer until it shows up as a real-world issue. When picked up: in **Calcs Shell**, per-calc instance marker + `storage` listener; strong toast/banner — shared `localStorage`, **last writer wins**, avoid two active edit tabs.

*(**Reality-check pass** — print + Load Basic listener check — **done**; see **Completed**.)*

---

## Soon — should happen, not optional forever

- [ ] **Consumables restore polish** — After restore, resync UCD Ward/ICU button `.active` with loaded list (label vs toolbar highlight).
- [ ] **Standalone parity / copy** — When Shell is stable: see `STANDALONE_PARITY.md` (deferred until Shell pass is far enough along).

---

## Maybe — good ideas, no deadline

- [ ] Load Basic / Pro: **non-zero (or filtered) equipment view** — `BACKLOG_LOAD_CAL_FILTERS.md`.
- [ ] Print: Consumables & Medicines game plan — `PRINT_CONSUMABLES_MEDICINES_GAMEPLAN.md`.
- [ ] Tablet / touch — `TABLET-STRATEGY-OPTIONS.md`.
- [ ] **Standalone recovery** (when Shell is “done enough”) — ID parity (esp. Medicines), smoke per calc, tab titles — `STANDALONE_PARITY.md`.
- [ ] Phase 7–9 items in `Calcs Shell/PROGRESS.md` — treat as **historical**; do **not** mine it for backlog — if something is still broken, it should surface during the deep dive or testing and get a bullet **here**.

---

## Reference-only docs (do not duplicate maintenance)

| Document | Role |
|----------|------|
| `Calcs Shell/PROGRESS.md` | Original **integration phase** checklist — **stale** vs current tree; **archaeology only** — not a source for “what’s next.” |
| `Calcs Shell/PRE_DEPLOY_SPRINT.md` | **Historical** March 2026 sprint — fixed items may already be in the repo; **do not** use as live checklist. |
| `NEXT_AUTOSAVE_REDESIGN.md` | **Historical** target behavior; current code follows the same *ideas* with a different timer shape. |
| `STANDALONE_PARITY.md` | **Standalone vs Shell** gaps and recovery checklist. |
| `Calcs Shell/FIELD_ASSESSMENT.md` | Narrative field assessment. |
| `VERSIONING.md` | Release process — not a feature backlog. |
| Per-calc `README.md` | Calculator-specific docs. |

---

## How to use this file tomorrow

1. Read **Next pickup** and **Now**.
2. When you finish something, add a short bullet to the **top** of **Completed (latest 10)** (optional commit). If that pushes past 10 items, move the bottom item to **Completed archive**.
3. Pull new work from **Soon** / **Maybe**, or from **testing / code review** — not by reconciling old markdown lists.
4. Update **Last session** so the next person (or future you) knows where things stopped.
