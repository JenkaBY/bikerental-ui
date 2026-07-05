# Task 004: AgreementSignature domain model

> **Applied Skill:** `angular-data-flow-orchestrator` — new UI domain model for the `sign()` API
> result, kept separate from the generated `SignatureCreatedResponse`, per FR-03 design section 3,
> bullet 5 (extended later by FR-04 with the summary shape — this task adds only the FR-03 shape).

## 1. Objective

Create the `SignatureCreated` domain model representing the result of a successful agreement
signing call.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/agreement-signature.model.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** None.

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
export interface SignatureCreated {
  readonly signatureId: number;
  readonly signedAt: Date;
}
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
