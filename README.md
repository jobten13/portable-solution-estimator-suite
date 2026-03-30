# Field Hospital Calculator Suite

This folder (**Calcs Final**) is the **suite root**: five calculators plus an optional **shell** that tabs between them.

## Start here (handoff)

| What | Where |
|------|--------|
| **Run the full suite (recommended)** | Open **`Calcs Shell/index.html`** in a browser (see [Calcs Shell README](Calcs%20Shell/README.md) for paths and hash navigation). |
| **Run a calculator alone** | Open that subfolder’s **`index.html`** (e.g. `Load Calc Pro/index.html`). |
| **Suite version (build ID)** | **`version.json`** — single source of truth. **Do not** copy the version string into every README; it will drift. |
| **How to bump a release & what testers report** | **[VERSIONING.md](VERSIONING.md)** |
| **Daily pickup: todos, next steps, what’s done** | **[PROJECT_TRACKER.md](PROJECT_TRACKER.md)** |
| **Shell integration & panel IDs** | **[Calcs Shell/README.md](Calcs%20Shell/README.md)** |

Each calculator folder has its own **README.md** (behavior, tooltips / user-guide source). Those describe **that app**, not the suite build number.

### How work is preserved (operators)

In every calculator (and in **Calcs Shell**), treat these as **three different paths**:

1. **Worksheet autosave** (toolbar **Autosaved:** timestamp + **Restore Autosave**, grey secondary button) — One **recovery** slot in this browser for the **current sheet** while you work. It is **not** a named row in the scenario dropdown. Timestamp format is **Autosaved: M/D h:mm AM/PM** (no year, no seconds).
2. **Save / Load Scenario** — **Named** snapshots stored in this browser and listed in the scenario dropdown for planning inside the app.
3. **Export / Import** — A **file** on disk (JSON for backup/re-import; CSV where offered as a human-readable report). Export does **not** by itself add a scenario to the browser list until you **Import** JSON or **Save Scenario**.

Full handoff wording lives in **[PROJECT_TRACKER.md](PROJECT_TRACKER.md)** under **Suite concepts**.

### Suite vs app version

- **Suite version** — Shown in the UI as **Suite v…** (loaded from **`version.json`** via **`version-control.js`**). Use this in test reports.
- **Per-calculator version** — Some footers also show an app-specific label (e.g. “Version 1.0.0”). That is separate from the suite version.

### Local server note

If **Suite v…** does not appear in the footer, try serving the folder over **http://** (some browsers block loading `version.json` from **`file://`**). Details in **VERSIONING.md**.
