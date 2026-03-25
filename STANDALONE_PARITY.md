# Standalone parity tracker (Shell-first delivery)

**Suite handoff / prioritized todos:** **`PROJECT_TRACKER.md`** (same folder as this file).

**Strategy:** Ship and harden **Calcs Shell** first. This file records where **standalone** (`<Calc Folder>/index.html`) may diverge or break so we can restore **fully functional standalones** after Shell delivery.

**How to use**
- When a change is **Shell-only** (embedded markup in `Calcs Shell/index.html` only), note it here if standalone should eventually match behavior or layout.
- When a change **assumes** `meds-` / `load-` / `cons-` prefixed IDs or panel roots, note whether standalone HTML was updated in parallel.
- Before closing “standalone recovery” work, run a **quick smoke** per calc: open standalone `index.html`, confirm CSS + JS, one core workflow, print preview.

---

## Known gaps (seeded from prior review)

| Calc | Area | Shell | Standalone gap | Notes |
|------|------|-------|----------------|--------|
| **Medicines / Pharmaceuticals** | DOM IDs vs `script.js` | Wired with `meds-*` IDs | **Broken / partial** | Standalone `index.html` uses unprefixed IDs (`days`, `save-btn`, …) while `script.js` targets `meds-*` for listeners and `loadSavedData`. Events and restore may not attach. **Fix:** align standalone HTML to Shell IDs or add a resolver in `g()` / setup. |
| **General** | Verification | Primary test target | **Not systematically tested** | “No formatting” reports may be path/context or failed CSS load; verify each calc from its folder over `http://localhost` or correct `file://` base. |
| **Suite version** | Footer | `../version-control.js` | Same if paths correct | Standalone must load `../version-control.js` from calc folder; `file://` may block `fetch` of `version.json` (see `VERSIONING.md`). |
| **Browser tab title** | `<title>` | Shell page = suite name is fine | **Per-calc clarity** | On standalone, the tab must name the **calculator in use** (e.g. “Consumables Supply List”, “Pharmaceuticals Supply List”, “Load Calculator Pro”), not a generic **“Field Hospital Calculator”** only. A short suffix like “Field Hospital Calculator” is OK if the **specific calc name leads** (e.g. `Pharmaceuticals Supply List · Field Hospital`). |

---

## Standalone UX requirements (non-functional but important)

- **Document title / browser tab:** Must identify **which tool** is open so users (and multiple tabs) aren’t confused. Avoid sole-use generic branding in `<title>`; lead with the calc name.

---

## Change log (append as you go)

_Add a row when you intentionally defer standalone._

| Date | Change / feature | Standalone impact | Follow-up |
|------|------------------|-------------------|-----------|
| _(example)_ | _…_ | _Shell HTML only; standalone not updated_ | _Sync markup or IDs_ |

---

## Recovery checklist (when Shell is done)

- [ ] Medicines/Pharma: standalone HTML ↔ `script.js` ID parity (or shared resolver).
- [ ] Each calc: open standalone, confirm `styles.css` + scripts load (network/console clean).
- [ ] Each calc: one save/load or core workflow + print preview.
- [ ] Each standalone `<title>`: **calc-specific name first** for browser tab clarity (not generic “Field Hospital Calculator” alone).
- [ ] Optional: export radio `name=` uniqueness per page (standalone single-doc is usually OK; document if changed in Shell only).
