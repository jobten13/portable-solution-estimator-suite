# Field Hospital Calculator Suite — Playwright Test Harness

This harness runs **Chrome-first** browser tests against the real suite UI:
- **FieldCalcs** shell (panel switching/state bleed)
- All five calculators via **hash entry** URLs (`FieldCalcs/index.html#water`, etc.)

It writes human-readable reports to:
- `tests/reports/<run-id>/test-matrix-report.html`

## Run (single command)

From the repo root, run:

```bash
cd tests
npm run test-suite
```

## Reports

After the run finishes, open:
- `tests/reports/<run-id>/test-matrix-report.html`

## Notes

- Tests use a tiny local server (HTTP) so the app behaves like a hosted deployment.
- Production files are not modified by the tests; only the report folder is written.

