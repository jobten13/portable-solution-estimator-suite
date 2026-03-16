# Version Control — Calcs Shell

Update the shell version **on phase completion** or **whenever a new version is warranted** (meaningful milestone, significant change, or release point).

## When to update

- **Phase completion (2–9):** Bump **minor** and add a changelog entry for that phase (e.g. Phase 2 → 1.1.0, Phase 3 → 1.2.0).
- **When a new version is warranted:** Any time the work justifies a release point—e.g. a substantial feature set, a verified milestone, or a batch of fixes. Use **minor** for new capability, **patch** for fixes/small improvements.
- **Bug fixes or small improvements:** Bump **patch** (e.g. 1.1.0 → 1.1.1).
- **Breaking or major redesign:** Bump **major** (e.g. 1.x.x → 2.0.0).

## How to update

### Option A: PowerShell script (recommended)

From the **Calcs Shell** directory:

```powershell
# After completing a phase (e.g. Phase 2 — Integrate Load Calc Basic)
.\create-version.ps1 -VersionType "minor" -Changes "Phase 2: Load Calc Basic integrated", "ROOT scoping", "Basic CSS scoped under .load-basic-calc"

# Small fix
.\create-version.ps1 -VersionType "patch" -Changes "Fix toast focus"
```

### Option B: Manual

1. Open `version.json`.
2. Bump `version` (e.g. `1.0.0` → `1.1.0` for next phase).
3. Set `lastUpdated` to current UTC ISO time (e.g. `2025-02-11T12:00:00.000Z`).
4. **Prepend** a new changelog entry:
   - `version`: same as top-level `version`
   - `date`: same as `lastUpdated`
   - `changes`: array of short descriptions for that phase/release

## Version numbering

| Type   | When to use | Example      |
|--------|----------------|--------------|
| **Major** (X.0.0) | Breaking changes, major redesign | 2.0.0 |
| **Minor** (1.X.0) | New phase complete (new calc integrated, new feature) | 1.1.0, 1.2.0 … |
| **Patch** (1.0.X) | Bug fixes, small improvements | 1.1.1 |

## Changelog format

New entries go **at the top** of the `changelog` array (newest first). Each entry:

- `version` — release version
- `date` — ISO 8601 UTC
- `changes` — array of strings (bullet points for that release)

## Display

`version-control.js` loads `version.json` and sets the footer `#version-info` to `"Version " + version`. No extra step needed for the UI.
