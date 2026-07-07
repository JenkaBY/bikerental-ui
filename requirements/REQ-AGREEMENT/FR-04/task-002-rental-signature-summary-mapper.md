# Task 002: AgreementSignatureMapper.fromSummaryResponse

> **Applied Skill:** `angular-data-flow-orchestrator` (mapper stays a pure static method, defensive
> `?? 0` numeric defaults matching `fromCreatedResponse`'s existing style, ISO string → `Date`) —
> implements FR-04 design section 3, bullet 2.

## 1. Objective

Add `fromSummaryResponse` to the existing `AgreementSignatureMapper`, converting a parsed
`SignatureSummaryResponse` (the JSON element parsed out of the `Blob` by the store — see Task 003)
into a `RentalSignatureSummary` domain object.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/agreement-signature.mapper.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import type { SignatureCreatedResponse, SignatureSummaryResponse } from '@api-models';
import type { RentalSignatureSummary, SignatureCreated } from '../models/agreement-signature.model';
```

**Code to Add/Replace:**

* **Location:** Replace the entire file content — the import lines gain `SignatureSummaryResponse`
  and `RentalSignatureSummary`, and a new static method is added to the class body after
  `fromCreatedResponse`.
* **Full resulting file:**

```typescript
import type { SignatureCreatedResponse, SignatureSummaryResponse } from '@api-models';
import type { RentalSignatureSummary, SignatureCreated } from '../models/agreement-signature.model';

export class AgreementSignatureMapper {
  static fromCreatedResponse(r: SignatureCreatedResponse): SignatureCreated {
    return {
      signatureId: r.signatureId ?? 0,
      signedAt: r.signedAt ? new Date(r.signedAt) : new Date(0),
    };
  }

  static fromSummaryResponse(r: SignatureSummaryResponse): RentalSignatureSummary {
    return {
      signatureId: r.signatureId ?? 0,
      templateId: r.templateId ?? 0,
      templateVersionNumber: r.templateVersionNumber ?? 0,
      signedAt: r.signedAt ? new Date(r.signedAt) : new Date(0),
    };
  }
}
```

**Note on barrels:** `projects/shared/src/core/mappers/index.ts` already has
`export * from './agreement-signature.mapper';` (added in FR-03 task-007) — no barrel change
needed.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
