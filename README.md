# Field Hospital Calculator Suite

This folder (**Calcs Final**) is the **suite root**: five calculators in a single **FieldCalcs** shell with tab navigation.

## Start here (handoff)

| What | Where |
|------|--------|
| **Run the full suite (recommended)** | At the **suite root**, double-click **`0_START_HERE_Click_to_Open_Calculator.html`** — it opens **`FieldCalcs/index.html`**. If that file is missing or blocked, open **`FieldCalcs/index.html`** directly. See [FieldCalcs README](FieldCalcs/README.md) for hash navigation. One-pager: **[Quickstart Guides/01-quickstart-full-calculator-suite.html](Quickstart%20Guides/01-quickstart-full-calculator-suite.html)**. |
| **Deep links / bookmarks** | Open **`FieldCalcs/index.html#water`**, **`#consumables`**, **`#medicines`**, **`#load-basic`**, or **`#load-pro`**. Each calculator folder’s **`index.html`** redirects to the matching hash in the shell. |
| **Suite version (build ID)** | **`FieldCalcs/version.json`** — single source of truth. **Do not** copy the version string into every README; it will drift. |
| **How to bump a release & what testers report** | **[VERSIONING.md](VERSIONING.md)** |
| **Historical project tracker** | **`_archive/PROJECT_TRACKER.md`** (archived; not maintained in the active tree) |
| **Shell integration & panel IDs** | **[FieldCalcs/README.md](FieldCalcs/README.md)** |

Each calculator folder has its own **README.md** (behavior, tooltips / user-guide source). Those describe **that app**, not the suite build number.

### How work is preserved (operators)

In the **FieldCalcs** shell, treat these as **three different paths**:

1. **Worksheet autosave** (toolbar **Autosaved:** timestamp + **Restore Autosave**, grey secondary button) — One **recovery** slot in this browser for the **current sheet** while you work. It is **not** a named row in the scenario dropdown. Timestamp format is **Autosaved: M/D h:mm AM/PM** (no year, no seconds).
2. **Save / Load Scenario** — **Named** snapshots stored in this browser and listed in the scenario dropdown for planning inside the app.
3. **Export / Import** — A **file** on disk (JSON for backup/re-import; CSV where offered as a human-readable report). Export does **not** by itself add a scenario to the browser list until you **Import** JSON or **Save Scenario**.

Full handoff wording lives in **`_archive/PROJECT_TRACKER.md`** under **Suite concepts**.

### Suite vs app version

- **Suite version** — Shown in the UI as **Suite v…** (loaded from **`FieldCalcs/version.json`** via **`FieldCalcs/version-control.js`**). Use this in test reports.
- **Per-calculator version** — Some footers also show an app-specific label (e.g. “Version 1.0.0”). That is separate from the suite version.

### Local server note

If **Suite v…** does not appear in the footer, try serving the folder over **http://** (some browsers block loading `version.json` from **`file://`**). Details in **VERSIONING.md**.
