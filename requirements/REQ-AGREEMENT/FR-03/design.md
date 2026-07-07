# System Design: FR-03 - Agreement Signing Flow in Rental Processing

## 1. Architectural Overview

The core slice: an operator takes a DRAFT rental, sends it to signing (`AWAITING_SIGNATURE`),
the customer reads the active agreement template and signs on the tablet (FR-02 pad), the
frontend posts the signature with the `version` fencing token and the `templateId` of the text
actually shown, and on success re-fetches the rental (now `ACTIVE`). Direct activation
("Start rental") REMAINS available in this slice — it is removed only in FR-05.

Backend responsibilities NOT duplicated client-side: costs are already computed on the rental
object (display only); rental start time = signing moment (server-side); IP/User-Agent captured
server-side; hold management invisible to the frontend. Success response of the sign call
carries NO rental object — a 201 means the rental is ACTIVE; the client must re-GET the rental.

State machine and UI rules:

- `DRAFT`: composition/customer editable; "Send to signing" enabled when equipment is non-empty
  and a customer is selected (same preconditions as today's activate button).
- `AWAITING_SIGNATURE`: composition editing must be unreachable. Available actions: Continue
  signing, Cancel signing (→ `DRAFT`), Cancel rental (→ terminal `CANCELLED`). Existing routing
  already isolates editing: `/rentals/:id/edit` redirects non-DRAFT to detail
  (`rental-create.component.ts` effect), and the detail page shows add/return equipment actions
  only for `isActive()`/`isDebt()` — verify, do not add new lock code.
- Any 409 during signing = stale data: close dialog, toast the code-specific message, re-fetch
  rental and active template.

## 2. API contract (generated client, source of truth)

* `RentalsService.updateLifecycle(rentalId, { status, operatorId })` — PATCH
  `/api/rentals/{rentalId}/lifecycles`, returns `RentalResponse` whose **required `version:
  number`** is the signing fencing token. Targets used here: `AWAITING_SIGNATURE` (send to
  signing), `DRAFT` (cancel signing), `CANCELLED` (customer refused).
* `AgreementsService.getActive()` — GET `/api/agreements/active` → `AgreementTemplateResponse`
  (`id`, `title`, `content`, `versionNumber`, …); 404 with `errorCode
  agreement.template.no_active` when none.
* `AgreementsService.sign(rentalId, SignAgreementRequest)` — POST
  `/api/rentals/{rentalId}/signatures`; body `{ signaturePng, rentalVersion, templateId,
  operatorId }`; `signaturePng` is the pad's data-URL as-is (prefix allowed). Response 201
  `SignatureCreatedResponse { signatureId, signedAt }`.
* `operatorId` comes from `RentalStore.operatorId()` (existing `UserStore`-backed computed).

Error codes to register (all `DOMAIN_CODES`; messages `$localize`d, params-aware where noted):

| Code | HTTP | Params | UI reaction |
|---|---|---|---|
| `agreement.template.no_active` | 404 | — | Do not open dialog; toast "no active agreement version" |
| `agreement.signing.already_signed` | 409 | `{rentalId}` | Toast + re-fetch rental (it is ACTIVE) |
| `agreement.template.not_active` | 409 | `{requestedTemplateId, activeTemplateId}` | Toast "agreement text changed" + re-fetch template & rental |
| `agreement.signing.rental_version_mismatch` | 409 | `{rentalId, expectedVersion, actualVersion}` | Toast "rental data changed" + re-fetch |
| `agreement.signing.rental_not_awaiting_signature` | 409 | `{rentalId, currentStatus}` | Toast + re-fetch (covers the cancel-vs-sign race) |
| `agreement.signing.invalid_signature_image` | 400 | — | Toast "signature image invalid, try again"; keep dialog open, clear pad |

## 3. Impacted Components

* **`core/state/rental.state.ts`:** add `version: number | null` to `RentalDetailState`
  (initialized `null` in `RentalStore._state`).
* **`core/mappers/rental-dashboard.mapper.ts`:** `toDetailState` maps `r.version` into the state.
* **`core/state/rental.store.ts` (`RentalStore`):**
  - `readonly version = computed(() => this._state().version)`;
  - `readonly isAwaitingSignature = computed(() => this._state().status === 'AWAITING_SIGNATURE')`;
  - `sendToSigning(): Observable<number>` — `updateLifecycle(id, {status: 'AWAITING_SIGNATURE',
    operatorId})` with `suppressErrorNotification()`; on success patch `{status, version}` from
    the response and emit the fresh `version`; busy flag `isSendingToSigning`.
  - `cancelSigning(): Observable<void>` — target `DRAFT`; on success patch `{status, version}`.
  - existing `cancelRental()` reused for `CANCELLED` (also patch nothing — caller navigates away).
* **`core/state/agreement-signing.store.ts` (new, feature store):** provided by the components
  that open the dialog. State: `template: AgreementTemplate | null`, `isLoadingTemplate`,
  `isSigning`. Methods:
  - `loadActiveTemplate(): Observable<AgreementTemplate>` — `getActive()` with
    `suppressErrorNotification()`, mapped via `AgreementTemplateMapper.fromResponse` (FR-01),
    stored in state;
  - `sign(rentalId, signaturePng, rentalVersion): Observable<SignatureCreated>` — uses the
    stored template's `id` as `templateId`, `RentalStore.operatorId()` for `operatorId`,
    `suppressErrorNotification()`; maps `signedAt` → `Date`. Domain result type
    `SignatureCreated { signatureId: number; signedAt: Date }` in
    `core/models/agreement-signature.model.ts` + mapper `AgreementSignatureMapper.fromCreatedResponse`
    in `core/mappers/agreement-signature.mapper.ts` (extended by FR-04 with the summary shape).
* **`shared/rental-status.meta.ts`:** add `AWAITING_SIGNATURE` entry (color `accent`, badge
  `bg-purple-100 text-purple-700`, label `Labels.RentalStatusAwaitingSignature`).
* **`projects/operator/src/app/rental-signing/signing-dialog.component.ts` (new):** opened with
  `viewContainerRef` (inherits `RentalStore` + `AgreementSigningStore`), `disableClose: true`,
  `MAT_DIALOG_DATA: { rentalId: number; version: number }`. Layout (mobile-first, full-height
  dialog): scrollable template text (`whitespace-pre-wrap`) with the template title; summary
  block — customer full name + phone (`RentalStore.customer()`), equipment list with per-item
  estimated costs (`rentalEquipmentItems()` / `equipmentItems()`), planned duration
  (`durationMinutes()` via existing `DurationPipe`), total (`estimatedCost()` or the validation
  store estimate — display only, no client math), and a note that the rental starts at the
  moment of signing; `<app-signature-pad>` (viewChild); actions: Cancel + Sign. Sign button
  disabled while pad empty or `isSigning()`, shows spinner while in flight (double-click guard).
  Sign → `signingStore.sign(rentalId, pad.toDataUrl()!, data.version)` → close(`'signed'`).
  Cancel → close(`'cancelled'`). Error handling inside the dialog: 400
  `invalid_signature_image` → toast + `pad.clear()`, dialog stays open; any 409/404 → close
  (`{ error: apiError }`) and let the opener run the recovery sequence.
* **`projects/operator/src/app/rental-signing/signing-flow.service.ts` (new, provided in
  component):** small orchestrator shared by step3 and rental-detail to avoid duplicating the
  open-dialog/recovery logic. API: `openDialog(rentalId, version): Observable<SigningOutcome>`
  (`'signed' | 'cancelled' | 'failed'`). Internally: ensures template is loaded
  (`loadActiveTemplate`; on `agreement.template.no_active` → toast, emit `'failed'` WITHOUT
  opening the dialog), opens `SigningDialogComponent`, translates close results; on dialog error
  results toasts by `errorCode` (via `resolveErrorMessage`) and emits `'failed'`. The CALLER
  re-fetches (`loadDetail`) after `'signed'` and after `'failed'`.
* **`projects/operator/src/app/rental-create/step3/rental-step3.component.ts`:** new primary
  button "Send to signing" (`Labels.SendToSigning`) next to the existing activate button
  (activate stays until FR-05); disabled when `!validationStore.isBalanceSufficient()` or
  `store.isSendingToSigning()`. Click → check template availability
  (`signingStore.loadActiveTemplate()`; on `no_active` → toast, abort — the rental stays DRAFT)
  → `store.save()` → `store.sendToSigning()` → `signingFlow.openDialog(id, version)`:
  - `'signed'` → `store.loadDetail(id)` → success toast → navigate to `/rentals/{id}`;
  - `'cancelled'` → `store.cancelSigning()` → stay on step 3 (still DRAFT);
  - `'failed'` → `store.loadDetail(id)`; if the rental is stuck in `AWAITING_SIGNATURE` the
    detail-page redirect flow takes over (navigate to `/rentals/{id}`).
* **`projects/operator/src/app/rental-detail/rental-detail.component.ts` +
  `rental-action-buttons.component.ts`:** for `store.isAwaitingSignature()` show an info banner
  ("Awaiting signature") and three actions: Continue signing → `signingFlow.openDialog(id,
  store.version()!)` (version comes from the fresh `loadDetail` GET; on `'signed'` →
  `loadDetail` + toast); Cancel signing → `store.cancelSigning()` → the existing
  DRAFT-redirect effect sends the operator to `/rentals/:id/edit`; Cancel rental → existing
  `CancelRentalDialogComponent` confirm → `store.cancelRental()` → navigate to `/rentals`.
  Provide `AgreementSigningStore` in `RentalDetailComponent` providers.
* **Labels:** `SendToSigning`, `ContinueSigning`, `CancelSigning`, `AwaitingSignatureBanner`,
  `AgreementSignedSuccess`, `NoActiveAgreementTemplate`, `RentalStatusAwaitingSignature`,
  `SignatureStartNote` ("The rental starts at the moment of signing"), `SignButton`, dialog
  title etc. All `$localize`; no extraction run.
* **Barrels:** models/mappers barrels + `public-api.ts` export for `AgreementSigningStore` and
  new model file.

## 4. Interaction Sequences

Happy path (step 3): Send to signing → `getActive` (template cached in signing store) →
`save()` → `sendToSigning()` (→ fresh `version`) → dialog (text + summary + pad) → Sign →
`sign(rentalId, png, version, templateId)` → 201 → close → `loadDetail(id)` (status ACTIVE,
new version) → toast → navigate to detail. No polling.

Resume after reload (detail page, AWAITING_SIGNATURE): `loadDetail` already ran → Continue
signing uses `store.version()` from that GET → same dialog flow.

409 recovery (any lifecycle/sign call): parse `ApiError` → toast code message → close dialog →
`loadDetail(rentalId)` + template re-fetch on next open. UI is consistent again purely from
re-fetched server state.

## 5. Non-Functional Decisions

* Dialog data is display-only; nothing from the summary is sent to the backend (server reads
  its own DB by rental id).
* `version` is never persisted client-side beyond the store; reopening flows always source it
  from the latest GET/lifecycle response.
* Standalone + OnPush + signals everywhere; components ≤200 lines (the dialog splits the
  summary into a dumb `signing-summary.component.ts` if it grows past the limit).
* No tests (MVP rule); no i18n extraction; lint must pass.
