# Task 004: Export Agreement Template Mapper from Barrel

> **Applied Skill:** `typescript-es2022` (barrel re-export convention) — makes
> `AgreementTemplateMapper` importable from `../mappers` inside `shared`, matching every other
> mapper in this barrel.

## 1. Objective

Add one export line for the new `agreement-template.mapper.ts` file to the `core/mappers` barrel.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none.

**Code to Add/Replace:**

* **Location:** Append as the last line of the file (after
  `export * from './managed-user.mapper';`).
* **Snippet:**

```typescript
export * from './agreement-template.mapper';
```

**Full resulting file (for reference — only the last line is new):**

```typescript
export * from './equipment.mapper';
export * from './equipment-condition.mapper';
export * from './equipment-status.mapper';
export * from './equipment-type.mapper';
export * from './pricing-type.mapper';
export * from './page.mapper';
export * from './tariff.mapper';
export * from './customer.mapper';
export * from './transaction.mapper';
export * from './money.mapper';
export * from './balance.mapper';
export * from './cost-calculation.mapper';
export * from './rental.mapper';
export * from './customer-finance.mapper';
export * from './user-profile.mapper';
export * from './equipment-search-item.mapper';
export * from './rental-dashboard.mapper';
export * from './managed-user.mapper';
export * from './agreement-template.mapper';
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
