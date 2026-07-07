# Task 004: Export RentalSignatureStore from public-api.ts

> **Applied Skill:** Shared Import Convention (AGENTS.md) — cross-project code must import shared
> symbols only from `@bikerental/shared`; the store must be added to the barrel so
> `RentalDetailComponent` (in `projects/operator`) can import it — implements FR-04 design section
> 3, bullet 3 / "Barrels" bullet.

## 1. Objective

Export the new `RentalSignatureStore` from the shared library's public barrel.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

None — this file only contains re-export statements.

**Code to Add/Replace:**

* **Location:** Immediately after the line `export * from './core/state/agreement-signing.store';`.
* **Snippet:**

```typescript
export * from './core/state/agreement-signing.store';
export * from './core/state/rental-signature.store';
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng build shared
```
