# Task 001: RentalSignatureSummary model

> **Applied Skill:** `angular-data-flow-orchestrator` (extend the existing FR-03 domain model file
> with the new read-only summary shape rather than creating a parallel model file) — implements
> FR-04 design section 3, bullet 1.

## 1. Objective

Add the `RentalSignatureSummary` domain interface to the existing agreement-signature model file,
representing the 0..1 signature summary returned by `GET /api/rentals/{rentalId}/signatures` under
`Accept: application/json`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/agreement-signature.model.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

None — this file has no imports today and none are needed for the new interface.

**Code to Add/Replace:**

* **Location:** Append at the end of the file, after the existing `SignatureCreated` interface.
* **Snippet:**

```typescript
export interface RentalSignatureSummary {
  readonly signatureId: number;
  readonly templateId: number;
  readonly templateVersionNumber: number;
  readonly signedAt: Date;
}
```

**Full resulting file for reference (do not diverge):**

```typescript
export interface SignatureCreated {
  readonly signatureId: number;
  readonly signedAt: Date;
}

export interface RentalSignatureSummary {
  readonly signatureId: number;
  readonly templateId: number;
  readonly templateVersionNumber: number;
  readonly signedAt: Date;
}
```

**Note on barrels:** `projects/shared/src/core/models/index.ts` already has
`export * from './agreement-signature.model';` (added in FR-03 task-006) — `RentalSignatureSummary`
is re-exported automatically. Do NOT add a new barrel line.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
