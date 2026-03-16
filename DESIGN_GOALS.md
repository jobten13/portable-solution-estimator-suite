# Design Goals – Calcs Suite

**All work on the five calculators should keep these goals in mind.**

---

## 1. One shell (combined app)

- **Goal:** All five calcs (Water, Medicines, Consumables, Load Calc Basic, Load Calc Pro) will eventually live inside **one shell** – a single app with shared navigation/container and one entry point.
- **Implications:**
  - **Storage:** Each calc must keep its own **namespaced** localStorage keys (e.g. `fieldHospitalPharma*`, `fieldHospitalWater*`) so there are no clashes when all five share one origin.
  - **No “only app on the page”:** Avoid code that assumes the calc is the only thing in the document (e.g. don’t rely on `document.title` being exclusive to one calc; use scoped selectors where it matters).
  - **Consistent behavior:** When fixing or adding behavior in one calc (e.g. scenario overwrite-by-name, export modal, validation), plan to apply the same pattern in the other four so the shell has a consistent UX.
  - **Shared shell later:** The shell will own the overall layout, navigation, and app title; each calc remains a self-contained module (HTML/JS/CSS) that the shell loads or embeds.

---

## 2. PWA version

- **Goal:** The combined app will have a **Progressive Web App (PWA)** version – installable, with one manifest and one service worker for the whole app.
- **Implications:**
  - **Single manifest:** One `manifest.json` (or equivalent) for the shell, not five separate manifests.
  - **Single service worker:** One worker for the entire app; it will handle caching and offline for all calcs. Don’t add calc-specific service workers now.
  - **Origin:** Service workers require a secure context (HTTPS or localhost). Local dev should use a local server (e.g. `npx serve` or `python -m http.server`) when testing PWA-related behavior.
  - **Offline strategy:** Caching and offline behavior will be designed at the shell/app level when we implement the PWA; individual calc code should not assume it’s the only thing that needs to work offline.

---

## 3. Reset Worksheet and row delete

- **Reset Worksheet (or similar):** When a calc has a “Reset Worksheet” (or “Clear sheet” / “Reset”) button, consider whether it should **restore the original list** as well as clear values. If the user can delete rows (e.g. equipment or items), “reset” should mean “back to the original worksheet” – i.e. restore the baseline list, then clear quantities/defaults. It may not apply in every calc (e.g. if there is no deletable list), but we should consider it each time.
- **Row delete (✕ / Delete):** Any button that deletes a single row/item should require **confirmation** (e.g. `confirm('Delete "[name]" from the list?')`) so users don’t remove items by mistake. Apply in all calcs that have per-row delete.

---

## 4. Checklist for changes

When editing any of the five calcs, ask:

- [ ] Does this rely on this calc being the only app on the page or origin?
- [ ] Are storage keys clearly namespaced for this calc?
- [ ] Would this same behavior make sense in the other four calcs (and in the shell)?
- [ ] Does this add a service worker or manifest that would conflict with a single future PWA?

If the answer to any of these is “yes” in a way that blocks the shell or PWA, adjust the approach.

When adding or reviewing a **Reset Worksheet** (or similar) button, also ask:

- [ ] Does this calc have a list the user can delete rows from? If yes, should Reset restore that list from the baseline?

When adding or reviewing **per-row delete** buttons:

- [ ] Is there a confirmation step before the row is removed?

---

## 5. Autosave and Clear Autosaved State

- **Load Calc Basic and Load Calc Pro** use the same pattern (Basic is the reference). Other calcs (Water, Medicines, Consumables) should align with this where they have worksheet autosave:
  - **Worksheet state** is saved to a dedicated localStorage key (separate from named scenarios).
  - **Timestamp** is stored in a second key and shown in the UI as “Last autosaved: &lt;date/time&gt;”.
  - **Toolbar:** “Clear Autosaved State” button (id: `btn-clear-autosave`) and a “Last autosaved” span (calc-specific id, e.g. `load-basic-last-saved` / `load-pro-last-saved`). Same button title and confirm text: *“Clear autosaved worksheet state from this browser? This will not delete named saved scenarios.”*
  - **After clear:** Success = toast "Autosaved worksheet state cleared"; failure = toast "Failed to clear autosaved worksheet state". Named saved scenarios are never removed by Clear Autosaved State.

---

*Last updated: Feb 2025. This file is the reference for all work toward the one-shell and PWA goals.*
