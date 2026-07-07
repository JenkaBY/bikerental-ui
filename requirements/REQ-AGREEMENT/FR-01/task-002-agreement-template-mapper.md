# Task 002: Agreement Template Mapper

> **Applied Skill:** `typescript-es2022` (pure static class, no side effects, explicit ISO-string →
> `Date` conversion) — implements `AgreementTemplateMapper`, translating the generated
> `AgreementTemplate*Response`/`Request` shapes into the domain model from Task 001, per FR-01's
> design section 3.

## 1. Objective

Create `agreement-template.mapper.ts` exporting a static `AgreementTemplateMapper` class with
`fromSummaryResponse`, `fromResponse` (ISO date strings → `Date`, absent → `undefined`), and
`toRequest`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/agreement-template.mapper.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import type {
  AgreementPdfPreviewRequest,
  AgreementTemplateRequest,
  AgreementTemplateResponse,
  AgreementTemplateSummaryResponse,
} from '@api-models';
import type {
  AgreementTemplate,
  AgreementTemplateSummary,
  AgreementTemplateWrite,
} from '../models/agreement-template.model';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import type {
  AgreementPdfPreviewRequest,
  AgreementTemplateRequest,
  AgreementTemplateResponse,
  AgreementTemplateSummaryResponse,
} from '@api-models';
import type {
  AgreementTemplate,
  AgreementTemplateSummary,
  AgreementTemplateWrite,
} from '../models/agreement-template.model';

export class AgreementTemplateMapper {
  static fromSummaryResponse(r: AgreementTemplateSummaryResponse): AgreementTemplateSummary {
    return {
      id: r.id ?? 0,
      versionNumber: r.versionNumber ?? undefined,
      title: r.title ?? '',
      status: r.status ?? 'DRAFT',
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(0),
      activatedAt: r.activatedAt ? new Date(r.activatedAt) : undefined,
      deactivatedAt: r.deactivatedAt ? new Date(r.deactivatedAt) : undefined,
    };
  }

  static fromResponse(r: AgreementTemplateResponse): AgreementTemplate {
    return {
      ...AgreementTemplateMapper.fromSummaryResponse(r),
      content: r.content ?? '',
    };
  }

  static toRequest(w: AgreementTemplateWrite): AgreementTemplateRequest {
    return {
      title: w.title,
      content: w.content,
    };
  }

  static toPreviewRequest(w: AgreementTemplateWrite): AgreementPdfPreviewRequest {
    return {
      title: w.title,
      content: w.content,
    };
  }
}
```

**Note:** `@api-models` resolves to `projects/shared/src/core/api/generated/models/index.ts` via
the root `tsconfig.json` path alias — this is the correct way for mapper code inside
`projects/shared/**` to reference generated types (see `managed-user.mapper.ts` for the identical
convention). Never import a relative path into `core/api/generated/` from a mapper.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
