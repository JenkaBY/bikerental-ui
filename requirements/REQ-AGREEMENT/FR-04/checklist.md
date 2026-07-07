# Implementation Checklist: FR-04 - Signed Agreement Display & PDF Download

- [x] `task-001-rental-signature-summary-model.md`
- [x] `task-002-rental-signature-summary-mapper.md`
- [x] `task-003-rental-signature-store.md`
- [x] `task-004-public-api-export.md`
- [x] `task-005-labels.md`
- [x] `task-006-rental-agreement-section-component.md`
- [x] `task-007-rental-detail-signature-wiring.md`

**Status:** All tasks applied via dev subagents (parallel waves). Shared + operator lint pass;
admin/operator/gateway dev builds pass.

## Ad-hoc fixes discovered during the test stage

- `rental-signature.store.ts`: the generated `AgreementsService.download` typing requires
  `options.headers` to be an `HttpHeaders` instance, not a plain object literal. The task snippet
  passed `{ Accept: 'application/json' }` / `{ Accept: 'application/pdf' }` which failed
  `TS2769: No overload matches this call`. Wrapped both in `new HttpHeaders({ ... })` and added the
  `@angular/common/http` import.
- `rental-agreement-section.component.ts`: one prettier line-wrap auto-fixed by `ng lint --fix`.

## Backend contract validation (main session, live API on :8080)

- `GET /api/rentals/{id}/signatures` with `Accept: application/json` on an unsigned rental → `200 []`
  (empty array → block hidden). With `Accept: application/pdf` → `404 application/problem+json`
  (`shared.resource.not_found`) → resolved toast on download. Matches the store's parse/hide/404
  handling exactly.
