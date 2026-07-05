# Task 003: Export Agreement Template Model from Barrel

> **Applied Skill:** `typescript-es2022` (barrel re-export convention) — makes
> `AgreementTemplateStatus`/`AgreementTemplateSummary`/`AgreementTemplate`/`AgreementTemplateWrite`
> importable via `@ui-models`, matching every other domain model in this barrel.

## 1. Objective

Add one export line for the new `agreement-template.model.ts` file to the `core/models` barrel.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none.

**Code to Add/Replace:**

* **Location:** Append as the last line of the file (after
  `export * from './managed-user.model';`).
* **Snippet:**

```typescript
export * from './agreement-template.model';
```

**Full resulting file (for reference — only the last line is new):**

```typescript
export * from './common.model';
export * from './equipment.model';
export * from './equipment-status.model';
export * from './equipment-type.model';
export * from './tariff.model';
export * from './customer.model';
export * from './customer-balance.model';
export * from './rental.model';
export * from './transaction.model';
export * from './user-profile.model';
export * from './user-preferences.model';
export * from './rental-create.model';
export * from './rental-dashboard.model';
export * from './role.model';
export * from './managed-user.model';
export * from './agreement-template.model';
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
