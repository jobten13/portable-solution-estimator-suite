# Suite versioning

- **Source of truth:** `version.json` in this folder (`Calcs Final`).
- **Loader:** `version-control.js` (same folder). Every entry page (`Calcs Shell/index.html`, each calculator’s `index.html`) loads it via `../version-control.js` and resolves `version.json` next to the script.
- **Bump for a release:** Edit `version.json` — update `version`, `lastUpdated`, and prepend a `changelog` entry. Reload the app; the shell footer and `Suite v…` labels update automatically.
- **Testing reports:** Ask testers to copy the **suite** line from the shell footer or any calc footer (`Suite vX.Y.Z`).

Opening HTML via `file://` may block `fetch` in some browsers; use a local static server if the version does not appear.
