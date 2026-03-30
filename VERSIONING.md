# Suite versioning

**Canonical suite build ID:** **`version.json`** in this folder (**Calcs Final**).  
**Loader:** **`version-control.js`** (same folder). Entry pages load it as **`../version-control.js`** and resolve **`version.json`** next to that script.

Handoff overview: **[README.md](README.md)**.

---

## Bump for a release

1. Edit **`version.json`** — update **`version`**, **`lastUpdated`**, and **prepend** a **`changelog`** entry (newest first).
2. **Calcs Shell `file://` fallback:** Update the **same** suite version in **`Calcs Shell/index.html`** wherever marked *“Fallback must match version.json”* — `meta name="suite-version"` and each panel footer **`[data-suite-version]`** (e.g. `Suite v1.1.1`). There is **no** separate shell bottom bar. When the page is served over **http**, **`version-control.js`** overwrites those spans and **`meta`** from **`version.json`**. Standalone calc pages use **`[data-suite-version]`** in their own **`index.html`** as well.
3. Reload the app over **http**; shell panel footers and standalone **`Suite v…`** labels update from **`version.json`** automatically.
4. **Do not** paste the new suite number into multiple **README** files — **`version.json`** remains the canonical **http** source; Shell HTML fallbacks are the exception above.

### Optional: PowerShell helper

From **`Calcs Shell`**, run **`create-version.ps1`** — it updates **`..\version.json`** (suite root). Example:

```powershell
cd "Calcs Shell"
.\create-version.ps1 -VersionType "minor" -Changes "Phase note", "Another change"
```

---

## When to bump which part (semver)

| Bump | When |
|------|------|
| **Major** (X.0.0) | Breaking changes, major redesign |
| **Minor** (1.X.0) | New capability, milestone (e.g. new calc integrated), phase complete |
| **Patch** (1.0.X) | Bug fixes, small improvements |

Examples: Phase-style milestones often use **minor**; hotfixes use **patch**.

### Changelog format

New entries go **at the top** of the **`changelog`** array. Each entry:

- **`version`** — release version (match top-level **`version`** when you release)
- **`date`** — ISO 8601 UTC
- **`changes`** — array of short strings

---

## Testing reports

Ask testers to copy the **suite** line from the shell footer or any calculator footer (**`Suite vX.Y.Z`**).

---

## `file://` / offline

Opening HTML via **`file://`** may block **`fetch`** of **`version.json`** in some browsers. If the suite version line is missing, use a **local static server** or open via **http://localhost**.

---

## Display (implementation)

**`version-control.js`** loads **`version.json`** and sets:

- **`meta[name="suite-version"]`**
- Elements with **`[data-suite-version]`** (Calcs Shell: each panel footer; standalone: calc footer)

Standalone calculator pages may show **`Suite v…`** together with a **per-app** version label in the footer; the suite number still comes from **`version.json`**.
