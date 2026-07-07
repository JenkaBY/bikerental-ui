# System Design: FR-04 - Signed Agreement Display & PDF Download

## 1. Architectural Overview

Read-only slice: on the rental detail page, for rentals that are ACTIVE or later, show
"Agreement signed {date}, version {templateVersionNumber}" with a PDF download button. Data and
document come from ONE endpoint via content negotiation — no signature id in the URL, no
separate download path.

## 2. API contract

`GET /api/rentals/{rentalId}/signatures` (generated as `AgreementsService.download(rentalId)`,
hardcoded `responseType: 'blob'`):

* `Accept: application/json` → JSON array of 0..1 `SignatureSummaryResponse
  { signatureId, templateId, templateVersionNumber, signedAt }`.
* `Accept: application/pdf` → the signed document as attachment; **404 when not signed**
  (`shared.resource.not_found`).

The generated method returns `Blob` for both representations. Constraint: do NOT hand-write
`HttpClient` calls for spec-covered endpoints — pass the `Accept` header through the generated
method's `options.headers` and, for the JSON case, parse the returned `Blob`
(`blob.text()` → `JSON.parse`) inside the shared store. Empty array ⇒ the rental has no
signature (legacy direct-activated rentals) ⇒ hide the block entirely.

## 3. Impacted Components

* **`core/models/agreement-signature.model.ts` (extend FR-03 file):** add
  `RentalSignatureSummary { signatureId: number; templateId: number;
  templateVersionNumber: number; signedAt: Date }`.
* **`core/mappers/agreement-signature.mapper.ts` (extend):** `fromSummaryResponse(raw)` — plain
  object (parsed JSON, typed as the generated `SignatureSummaryResponse`) → domain, ISO →
  `Date`.
* **`core/state/rental-signature.store.ts` (new, feature store, provided in
  `RentalDetailComponent`):** state `{ summary: RentalSignatureSummary | null; isLoading:
  boolean; isDownloading: boolean }`. Methods:
  - `load(rentalId)` — `download(rentalId, 'body', { headers: { Accept: 'application/json' },
    context: suppressErrorNotification() })` → `from(blob.text())` → `JSON.parse` → first
    element mapped or `null`; errors resolve to `null` (block hidden, no toast noise on detail
    load).
  - `downloadPdf(rentalId)` — same endpoint with `Accept: application/pdf`; on success trigger a
    browser download via object URL + `<a download="rental-{rentalId}-agreement.pdf">` and
    revoke the URL; on 404 toast the resolved `shared.resource.not_found` message via
    `NotificationService`.
* **`projects/operator/src/app/rental-detail/rental-agreement-section.component.ts` (new,
  dumb):** inputs `summary: RentalSignatureSummary`, `isDownloading: boolean`; output
  `downloadRequested`. Renders a bordered section: check icon, text
  "{Labels.AgreementSigned} {signedAt | date:'short'}", secondary line
  "{Labels.AgreementVersion} {templateVersionNumber}", and a stroked download button
  (spinner while downloading).
* **`projects/operator/src/app/rental-detail/rental-detail.component.ts`:** provide
  `RentalSignatureStore`; in the existing `loadDetail` effect chain (or a separate effect on
  `store.status()`), call `signatureStore.load(rentalId)` when the status is one of
  `ACTIVE | COMPLETED | DEBT`; render `<app-rental-agreement-section>` between the cost and
  equipment sections only when `signatureStore.summary()` is non-null; wire
  `(downloadRequested)="signatureStore.downloadPdf(rentalId())"`.
* **Labels:** `AgreementSigned` ("Agreement signed"), `AgreementVersion` ("version"),
  `DownloadAgreementPdf` ("Download PDF"). `$localize`, no extraction.
* **Barrels:** models/mappers barrels + `public-api.ts` export for the store.

## 4. Interaction Sequence

Detail load → status ∈ {ACTIVE, COMPLETED, DEBT} → `load(rentalId)` (JSON accept) → summary or
null → section shown/hidden. Download click → PDF accept → Blob → anchor download. No polling;
after FR-03 signing completes and `loadDetail` re-runs, the same effect re-fires `load` and the
block appears without a page reload.

## 5. Non-Functional Decisions

* Blob-parse for JSON lives ONLY in the store — components never see transport shapes.
* 0..1 cardinality is trusted from the contract; the store takes `array[0]` and ignores extras.
* Standalone/OnPush/signals; no tests; lint clean.
