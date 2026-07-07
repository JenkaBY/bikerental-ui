# Task 001: Agreement Template Domain Model

> **Applied Skill:** `typescript-es2022` (interfaces, readonly-free write DTOs, strict optional
> typing) — establishes the read model (`AgreementTemplateSummary`/`AgreementTemplate`) and the
> write model (`AgreementTemplateWrite`) that mirror the backend contract, per FR-01's design
> section 3. These are the only agreement-template types components/dialogs may import — never
> `core/api/generated/` directly.

## 1. Objective

Create `agreement-template.model.ts` exporting `AgreementTemplateStatus`,
`AgreementTemplateSummary`, `AgreementTemplate` (extends summary with `content`), and
`AgreementTemplateWrite`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/agreement-template.model.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** none — this is a pure type-only module.

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
export type AgreementTemplateStatus = 'DRAFT' | 'ACTIVE' | 'DEACTIVATED';

export interface AgreementTemplateSummary {
  readonly id: number;
  readonly versionNumber?: number;
  readonly title: string;
  readonly status: AgreementTemplateStatus;
  readonly createdAt: Date;
  readonly activatedAt?: Date;
  readonly deactivatedAt?: Date;
}

export interface AgreementTemplate extends AgreementTemplateSummary {
  readonly content: string;
}

export interface AgreementTemplateWrite {
  title: string;
  content: string;
}
```

**Note:** `AgreementTemplateWrite` deliberately has no `status`/`versionNumber` fields — those are
backend-assigned on `activate()`, never client-supplied, per FR-01's design (Architectural
Overview: "version numbers are assigned on activation").

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
