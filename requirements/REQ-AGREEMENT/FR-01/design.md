# System Design: FR-01 - Admin Agreement Template Version Management

## 1. Architectural Overview

This story delivers the admin-facing UI for managing versions of the rental agreement template,
plus the shared-library foundation (domain model, mapper, signal store) for the agreement domain.
It rides on the freshly regenerated OpenAPI client (`projects/shared/src/core/api/generated/`),
which now contains `AgreementsService` — that regeneration is part of this FR's branch and is
already applied to the working tree (do not re-run generation; never edit generated files).

The feature follows the established three-layer pipeline: generated `AgreementsService` →
`AgreementTemplateMapper` → domain types in `core/models/` → admin components. Admin UI follows
the existing Admin CRUD pattern: a smart list component (`MatTable`) plus dialogs. A dedicated
PDF-preview dialog renders a backend-produced `Blob` — the frontend never composes PDFs.

Backend invariants NOT to re-implement client-side: version numbers are assigned on activation;
exactly one template may be ACTIVE (enforced by a partial unique index; the concurrent-activation
loser receives 409 `agreement.template.concurrent_activation`); ACTIVE/DEACTIVATED templates are
immutable and non-deletable; DEACTIVATED templates can never be re-activated.

## 2. Generated API contract (source of truth, already in `core/api/generated/`)

`AgreementsService` methods (all return typed Observables):

| Method | HTTP | Path | Request | Response |
|---|---|---|---|---|
| `findAll()` | GET | `/api/agreements` | — | `AgreementTemplateSummaryResponse[]` |
| `create(req)` | POST | `/api/agreements` | `AgreementTemplateRequest {title, content}` | `AgreementTemplateResponse` |
| `getById(id)` | GET | `/api/agreements/{id}` | — | `AgreementTemplateResponse` (includes `content`) |
| `update(id, req)` | PATCH | `/api/agreements/{id}` | `AgreementTemplateRequest` | `AgreementTemplateResponse` |
| `delete(id)` | DELETE | `/api/agreements/{id}` | — | void |
| `activate(id)` | PATCH | `/api/agreements/{id}/activate` | — | `AgreementTemplateResponse` |
| `getActive()` | GET | `/api/agreements/active` | — | `AgreementTemplateResponse` |
| `previewPdf(req)` | POST | `/api/agreements/preview` | `AgreementPdfPreviewRequest {title, content}` | `Blob` (application/pdf) |

`AgreementTemplateResponse`: `id: number`, `versionNumber?: number`, `title: string`,
`content: string`, `status: 'DRAFT' | 'ACTIVE' | 'DEACTIVATED'`, `createdAt: string(date-time)`,
`activatedAt?: string`, `deactivatedAt?: string`. `AgreementTemplateSummaryResponse` is the same
minus `content`.

Error codes for this FR (register in `error-code.ts` + `error-messages.ts`):
`agreement.template.not_editable` (409, params `{currentStatus}`),
`agreement.template.not_activatable` (409, params `{currentStatus}`),
`agreement.template.not_deletable` (409, params `{currentStatus}`),
`agreement.template.concurrent_activation` (409, no params — "activated concurrently, retry"),
`agreement.pdf.rendering_failed` (500). All are domain codes (add to `DOMAIN_CODES`).

## 3. Impacted Components

* **`core/models/agreement-template.model.ts` (Shared Library — new):**
  `AgreementTemplateStatus = 'DRAFT' | 'ACTIVE' | 'DEACTIVATED'`;
  `AgreementTemplateSummary { id: number; versionNumber?: number; title: string; status: AgreementTemplateStatus; createdAt: Date; activatedAt?: Date; deactivatedAt?: Date }`;
  `AgreementTemplate extends AgreementTemplateSummary { content: string }`;
  `AgreementTemplateWrite { title: string; content: string }`.
* **`core/mappers/agreement-template.mapper.ts` (Shared Library — new):** pure static
  `AgreementTemplateMapper` with `fromSummaryResponse`, `fromResponse` (ISO strings → `Date`,
  absent → `undefined`) and `toRequest(w: AgreementTemplateWrite): AgreementTemplateRequest`.
* **`core/state/agreement-template.store.ts` (Shared Library — new):** `AgreementTemplateStore`,
  `@Injectable()` **feature store** (provided in the list component, NOT root). Signal-store
  pattern: private `_state = signal<{templates: AgreementTemplateSummary[]; isLoading: boolean}>`,
  public computeds `templates`, `isLoading`. Methods:
  - `load(): void` — `findAll()` → map → set list (full replace), `finalize` clears loading;
    on error clear loading (global interceptor toasts).
  - `getById(id): Observable<AgreementTemplate>` — pass-through with mapping (dialog needs
    `content` lazily).
  - `create(w)/update(id, w): Observable<AgreementTemplate>` — mapped pass-through; callers use
    `suppressErrorNotification()` context is NOT needed here because the store passes
    `{ context: suppressErrorNotification() }` for create/update (dialog handles errors locally
    via `applyServerErrors`); list refresh happens via the dialog-close → `load()` pattern.
  - `activate(id)/delete(id): Observable<void>` — with `suppressErrorNotification()`; the list
    component resolves the `errorCode` itself (needs custom 409 handling + reload).
  - `previewPdf(w): Observable<Blob>` — pass-through to the generated method.
* **Barrels:** `core/models/index.ts`, `core/mappers/index.ts` re-export the new files;
  `projects/shared/src/public-api.ts` exports the store
  (`export * from './core/state/agreement-template.store';`) after the other stores.
* **`core/errors/error-code.ts` / `error-messages.ts`:** new codes above + `$localize` messages;
  `not_editable`/`not_activatable`/`not_deletable` messages use `params['currentStatus']` when
  present.
* **`projects/admin/src/app/agreements/agreement-list.component.ts` (new, smart):** route page.
  Provides `[AgreementTemplateStore]`. `MatTable` + `MatSort` over `templates()`; columns:
  `versionNumber` (em-dash when undefined), `title`, `status` (chip: DRAFT=slate, ACTIVE=green,
  DEACTIVATED=amber — Tailwind badge classes like the rental status badges), `createdAt`,
  `activatedAt`, `deactivatedAt` (via `DatePipe`, `'short'`), `actions`. Sorting enabled on
  `versionNumber` and `createdAt` (client-side `MatTableDataSource` or manual computed sort —
  prefer manual sort on signals to stay in the signal idiom). Header button "New template" opens
  the editor dialog in create mode. Row actions by status: DRAFT → edit / activate / delete;
  ACTIVE, DEACTIVATED → view (read-only dialog). Activate → `ConfirmDialogComponent` (existing,
  from `@bikerental/shared`) with warning that the currently active version is deactivated
  irreversibly and deactivated versions can never be edited or re-activated; on confirm →
  `store.activate(id)`; success → success toast + `load()`; error → parse
  (`ApiErrorParser.parse`), toast resolved message (`ErrorMessageResolver` /
  `resolveErrorMessage`), and ALWAYS `load()` on 409 so the stale row disappears. Delete →
  confirm dialog (danger), same error pattern.
* **`projects/admin/src/app/agreements/agreement-dialog.component.ts` (new):** create / edit /
  view via `MAT_DIALOG_DATA: { templateId?: number; readonly?: boolean }`. On open with
  `templateId`, fetches full template via `store.getById` (dialog receives the store instance
  through the dialog's `viewContainerRef` — open the dialog with
  `{ viewContainerRef: this.viewContainerRef }` from the list so the feature store is visible).
  Reactive form: `title` (required, `matInput`) + `content` (required, `<textarea matInput>`,
  ~20 rows, monospace, no markdown toolbar). No autosave — explicit buttons: Save (create/update
  → close(`true`)), Cancel (close(`undefined`)), Preview PDF. Read-only mode disables the form
  and hides Save. Server errors: request with `suppressErrorNotification()` (store does this),
  `applyServerErrors(form, apiError)` binds field errors; unmatched messages shown via
  `NotificationService.error`. Dialog size ~`width: '80vw', maxWidth: '1000px', height: '85vh'`.
* **`projects/admin/src/app/agreements/agreement-pdf-preview-dialog.component.ts` (new):**
  `MAT_DIALOG_DATA: { blob: Blob; fileName: string }`. Creates object URL once
  (`URL.createObjectURL`), sanitizes via `DomSanitizer.bypassSecurityTrustResourceUrl`, renders
  `<iframe>` filling the dialog; "Download" fallback button creates an `<a download>` click;
  revokes the URL in `DestroyRef.onDestroy`. "Preview PDF" in the editor dialog calls
  `store.previewPdf({title, content})` with the CURRENT (possibly unsaved) form value, shows a
  spinner on the button while in flight, opens this dialog on success.
* **`projects/admin/src/app/app.routes.ts`:** add lazy route `agreements` →
  `AgreementListComponent` (after `tariffs`).
* **`projects/admin/src/app/layout/admin-layout.component.ts`:** add `NAV_ITEMS` entry
  (icon `history_edu`, label from `Labels`).
* **`shared/constant/labels.ts`:** new labels (Agreements nav/title, New template, Version,
  Activated, Deactivated, Activate, ActivateAgreementConfirm title/message, Preview PDF,
  Download, statuses Draft/Active/Deactivated, success toasts, NoActiveAgreement not needed
  here). All `$localize`. Do NOT run i18n extraction.

## 4. Interaction Sequences

Create/edit: list → open editor dialog (`viewContainerRef`) → Save → `store.create/update` →
close(`true`) → list `load()`. Preview: editor dialog → `store.previewPdf(currentFormValue)` →
Blob → open preview dialog (iframe + download fallback). Activate: list → confirm dialog →
`store.activate(id)` → success toast + `load()`; on 409 (`concurrent_activation`, `not_activatable`)
→ code-resolved toast + `load()`. Delete: confirm (danger) → `store.delete(id)` → toast + `load()`.

## 5. Non-Functional Decisions

* Components: standalone, `OnPush`, `inject()`, `input()`/`output()`, signals; ≤200 lines TS.
* No code comments; all user-visible strings through `Labels`/`$localize`.
* No tests (MVP rule). Lint must pass (`npm run lint`); shared imports only via
  `@bikerental/shared` from admin, relative paths inside shared.
* PDF preview URL lifecycle: exactly one object URL per dialog instance, revoked on destroy.
* The store never caches `content` in the list signal (summaries only) — the editor fetches the
  full template on demand, keeping the list payload light.
