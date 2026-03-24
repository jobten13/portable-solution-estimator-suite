# Suite versioning

**Canonical suite build ID:** **`version.json`** in this folder (**Calcs Final**).  
**Loader:** **`version-control.js`** (same folder). Entry pages load it as **`../version-control.js`** and resolve **`version.json`** next to that script.

Handoff overview: **[README.md](README.md)**.

---

## Bump for a release

1. Edit **`version.json`** — update **`version`**, **`lastUpdated`**, and **prepend** a **`changelog`** entry (newest first).
2. Reload the app; the shell footer and **`Suite v…`** labels update automatically.
3. **Do not** paste the new version number into multiple README files — keep **`version.json`** as the only written source for the suite number.

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
- **`#shell-version`** (shell footer)
- Elements with **`[data-suite-version]`**

Standalone calculator pages may show **`Suite v…`** together with a **per-app** version label in the footer; the suite number still comes from **`version.json`**.
