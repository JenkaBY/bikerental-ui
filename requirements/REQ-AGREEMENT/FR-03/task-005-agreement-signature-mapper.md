# Task 005: AgreementSignatureMapper

> **Applied Skill:** `angular-data-flow-orchestrator` — pure mapper converting the generated
> `SignatureCreatedResponse` (optional fields, ISO date string) into the clean `SignatureCreated`
> domain model, per FR-03 design section 3, bullet 5.

## 1. Objective

Create `AgreementSignatureMapper.fromCreatedResponse` converting `SignatureCreatedResponse` →
`SignatureCreated`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/agreement-signature.mapper.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import type { SignatureCreatedResponse } from '@api-models';
import type { SignatureCreated } from '../models/agreement-signature.model';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import type { SignatureCreatedResponse } from '@api-models';
import type { SignatureCreated } from '../models/agreement-signature.model';

export class AgreementSignatureMapper {
  static fromCreatedResponse(r: SignatureCreatedResponse): SignatureCreated {
    return {
      signatureId: r.signatureId ?? 0,
      signedAt: r.signedAt ? new Date(r.signedAt) : new Date(0),
    };
  }
}
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
