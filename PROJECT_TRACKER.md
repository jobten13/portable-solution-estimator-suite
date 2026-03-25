# Suite project tracker — **single pickup / handoff file**

**Use this file to start and end each working session.** Update the session line when you sit down and when you wrap up. Other markdown trackers in the repo are **reference or history** until their items are copied here or explicitly retired.

| Field | Value |
|--------|--------|
| **Last session** | _(date — what you did)_ |
| **Next pickup** | _(first thing to do)_ |

---

## Completed (latest 10 — newest first)

Keep **at most 10** bullets here. When you record an 11th completion, move the **bottom** item to **Completed archive** (still **newest first** there). Not time-of-year based — purely “last 10” + archive.

- [x] **Pre-deploy: export radio `name=` isolation** — Prevent cross-calc radio interference on export dialogs. (`Calcs Shell/index.html`.)
- [x] **Pre-deploy: Shell print targets active panel** — `@media print` hides shell chrome and hidden panels so only current calc prints. (`Calcs Shell/shell.css`.)
- [x] **Pre-deploy: destructive action confirmations** — `confirm(...)` before clear-all scenarios and reset-worksheet actions across calcs. (e.g. `Load Calc Basic/script.js`, `Load Calc Pro/script.js`, `Water Calc/script.js`, `Consumables Calc/consumables.js`, `Medicines Calc/script.js`.)
- [x] **Autosave parity (Consumables + Medicines)** — Dirty-gated saves, 3s debounce, 60s backup tick, blur flush for scenario text + filters. (`consumables.js`, `Medicines Calc/script.js` — e.g. commit `16ed255`.)
- [x] **Shell pilot accents** — Consumables / Pharmaceuticals active-tab rails + left stripe (violet + cyan); print hides stripe. (`Calcs Shell/shell.css` — checkpoint `f8406c5` area.)
- [x] **Crash-recovery autosave model (suite direction)** — Open fresh, **Restore last autosave**, timestamp line. *(Differs from older “5 min only” write-up in `NEXT_AUTOSAVE_REDESIGN.md`; implementation uses debounce + dirty + interval.)*

## Completed archive (older than the live 10 — newest first)

_(Nothing here yet; when the live list exceeds 10, move the oldest bullet from the bottom of **Completed (latest 10)** to the top of this section.)_

---

## Now — do next (ordered)

1. **Tracker hygiene (recommended first)** — Audit `Calcs Shell/PROGRESS.md` and `PRE_DEPLOY_SPRINT.md` checkboxes against the actual repo; mark phases obsolete or done; **move any still-valid tasks into the sections below** so this file stays authoritative.
2. _(add your next concrete task here)_

---

## Soon — should happen, not optional forever

- [ ] **Multi-tab same calc safety (Warn + detect first)** — Add cross-tab detection (per-calc instance marker + `storage` event) to show a strong warning/toast/banner that “autosave uses shared storage; last saved tab wins; do not edit in two tabs.” Start with warn-only (no enforcement) so we can validate during field testing.
- [ ] **PRE_DEPLOY sprint (remaining ops-safety)** — Confirm remaining items: unsaved-change warning on scenario load, print identification (if still anonymous), and script load error handling. (`Calcs Shell/PRE_DEPLOY_SPRINT.md`)
- [ ] **Consumables restore polish** — After restore, resync UCD Ward/ICU button `.active` with loaded list (label vs toolbar highlight).

---

## Maybe — good ideas, no deadline

- [ ] Load Basic / Pro: **non-zero (or filtered) equipment view** — `BACKLOG_LOAD_CAL_FILTERS.md`.
- [ ] Print: Consumables & Medicines game plan — `PRINT_CONSUMABLES_MEDICINES_GAMEPLAN.md`.
- [ ] Tablet / touch — `TABLET-STRATEGY-OPTIONS.md`.
- [ ] **Standalone recovery** (when Shell is “done enough”) — ID parity (esp. Medicines), smoke per calc, tab titles — `STANDALONE_PARITY.md`.
- [ ] Phase 7–9 items in `Calcs Shell/PROGRESS.md` — **many may be fixed or obsolete**; do not implement from that file without verifying; merge survivors here.

---

## Reference-only docs (do not duplicate maintenance)

| Document | Role |
|----------|------|
| `Calcs Shell/PROGRESS.md` | Original **integration phase** checklist — often **stale** vs current tree; use for archaeology, then migrate open work here. |
| `Calcs Shell/PRE_DEPLOY_SPRINT.md` | **Time-boxed sprint** + fixes + *Potential future steps*; verify done items before re-scheduling. |
| `NEXT_AUTOSAVE_REDESIGN.md` | **Historical** target behavior; current code follows the same *ideas* with a different timer shape. |
| `STANDALONE_PARITY.md` | **Standalone vs Shell** gaps and recovery checklist. |
| `Calcs Shell/FIELD_ASSESSMENT.md` | Narrative field assessment. |
| `VERSIONING.md` | Release process — not a feature backlog. |
| Per-calc `README.md` | Calculator-specific docs. |

---

## How to use this file tomorrow

1. Read **Next pickup** and **Now**.
2. When you finish something, add a short bullet to the **top** of **Completed (latest 10)** (optional commit). If that pushes past 10 items, move the bottom item to **Completed archive**.
3. Pull new work from **Soon** / **Maybe** or from an audit of `PROGRESS.md` / `PRE_DEPLOY_SPRINT.md`.
4. Update **Last session** so the next person (or future you) knows where things stopped.
