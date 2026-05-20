# Suite versioning

**Canonical suite build ID:** **`FieldCalcs/version.json`**.  
**Loader:** **`FieldCalcs/version-control.js`** (same folder). The shell loads it as **`version-control.js`** and resolves **`version.json`** next to that script.

Handoff overview: **[README.md](README.md)**.

---

## Bump for a release

1. Edit **`FieldCalcs/version.json`** — update **`version`**, **`lastUpdated`**, and **prepend** a **`changelog`** entry (newest first).
2. **`FieldCalcs/index.html` `file://` fallback:** Update the **same** suite version wherever marked *“Fallback must match version.json”* — `meta name="suite-version"` and each panel footer **`[data-suite-version]`** (e.g. `Suite v1.1.1`). There is **no** separate shell bottom bar. When the page is served over **http**, **`version-control.js`** overwrites those spans and **`meta`** from **`version.json`**.
3. Reload the app over **http**; shell panel footers update from **`version.json`** automatically.
4. **Do not** paste the new suite number into multiple **README** files — **`version.json`** remains the canonical **http** source; shell HTML fallbacks are the exception above.

### Optional: PowerShell helper

From **`FieldCalcs`**, run **`create-version.ps1`** — it updates **`version.json`** in the same directory. Example:

```powershell
cd FieldCalcs
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

Ask testers to copy the **suite** line from any calculator panel footer in the shell (**`Suite vX.Y.Z`**).

---

## `file://` / offline

Opening HTML via **`file://`** may block **`fetch`** of **`version.json`** in some browsers. If the suite version line is missing, use a **local static server** or open via **http://localhost**.

---

## Display (implementation)

**`version-control.js`** loads **`version.json`** and sets:

- **`meta[name="suite-version"]`**
- Elements with **`[data-suite-version]`** (FieldCalcs shell: each panel footer)
