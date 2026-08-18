# AGENTS.md — working contract for the Field Hospital Calculator Suite

This file encodes the discipline this repo already practices. Every coder /
auditor / overseer session inherits it. Read it before starting work.

---

## Repo facts (ground truth)

- **Canonical version:** `Portable-Solution-Estimator-Suite/version.json` (`version` + `changelog[]`).
  Loader is `Portable-Solution-Estimator-Suite/version-control.js`. Bump rules: `VERSIONING.md`.
- **Entry page (front door):** `0_START_HERE_Click_to_Open_Calculator.html` at
  the repo root — a standalone launcher that meta-refresh redirects to
  `Portable-Solution-Estimator-Suite/index.html` (with a manual fallback link). It is separate from the
  shell and holds no calculator content.
- **Shell:** `Portable-Solution-Estimator-Suite/index.html` holds exactly five `calc-panel`s, all in
  this one file (not in the per-calc folders): `panel-consumables` (`cons-calc`),
  `panel-medications` (`meds-calc`), `panel-water` (`water-calc`),
  `panel-load-calc` (`load-basic-calc`, Load Basic), `panel-load-pro`
  (`load-pro-calc`, Load Pro). Per-calc folders (`Consumables Calc`,
  `Load Calc Basic`, `Load Calc Pro`, `Medicines Calc`, `Water Calc`) each hold
  that panel's `styles.css` and scripts.
- **User docs:** `Quickstart Guides/*.html` (static; carry hardcoded version
  strings — `version-control.js` does NOT update these).
- **Tests:** live in `tests/`. Run from there: `cd tests && npm test`
  (= `playwright test`; config `tests/playwright.config.js`).
  - First-time setup: `cd tests && npx playwright install chromium`.
  - Do NOT run `npx playwright test` at repo root — it pulls a stray Playwright
    and collides with `tests/node_modules`.
  - Full suite is `functional.spec.js` + `suite.spec.js` (~67 tests, ~10 min).

---

## Roles (enforced as discipline, not necessarily three live agents)

### Overseer — the human (+ Claude-on-web as outside check)
- Designs specs, reasons about trade-offs, holds intent.
- **Cannot** see the filesystem, run git, or run tests. Its "state" is a mental
  model that **drifts** from the repo over time.
- **Decision authority stays with the human.** Claude-on-web advises only.

### Coder — a fresh, tightly-scoped Cursor session per task
- One written instruction → one defined exit condition → **exactly one commit's
  worth of change** (developer commits; see Git).
- Self-contained: Cursor sessions do NOT share the overseer's chat. Anything
  assumed must be written into the instruction.
- Does **not** grade its own subjective work.

### Auditor / gatekeeper — read-only, independent
- Verifies against ground truth; produces facts, never edits.
- **Today this role is shared** (the coder runs its own mechanical gates). This
  is tolerable **only while gates stay objective.**
- **Trigger:** the moment a check cannot be made objective, a separate
  read-only auditor session is required.

---

## Gates are objective only

Pass/fail criteria MUST be mechanical:
- exact counts ("20 matches, 1 remaining"), `file:line` read-backs,
  test-pass lines ("67 passed"), valid-JSON / parse assertions.

Subjective gates ("looks consistent", "feels aligned") are **prohibited** as
pass/fail criteria. An open-ended subjective check caused a prior styling
rework loop — don't repeat it.

---

## Per-task contract

1. State the **exit condition** up front, in writing.
2. **One commit per task** — no scope creep mid-task.
3. Instruction is **self-contained** (assume the coder knows nothing the
   overseer didn't write down).
4. Read-only audits change nothing; they only report.

---

## Handoff contract (both directions)

**Cursor → overseer:** hand back **verbatim ground truth**, not prose summaries:
- `git log --oneline origin/master..master`
- exact grep / match counts
- the test result line
- `file:line` read-back of every change

**Overseer → Cursor:** every carry-forward number is a **hypothesis, not a
fact**. First move on any "expected N" is to **verify N against the live repo
and report the delta** before acting.

---

## Git

- The developer decides every commit, tag, and push — these are never
  automatic.
- Cursor executes Git commands ONLY on the developer's explicit instruction,
  AND only after a read-only verification has been reported and reviewed clean
  (e.g. `git status`, `git log --oneline origin/master..master`, branch
  ahead/behind).
- Cursor proposes the commit message and the exact command sequence for the
  developer to approve before running.
- Untracked artifacts (`tests/functional-fixtures/`, `test-results/`) stay out
  of version control.
