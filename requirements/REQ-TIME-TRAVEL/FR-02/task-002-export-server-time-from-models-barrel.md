# Task 002: Export `ServerTime` from the Models Barrel

> **Applied Skill:** `angular-data-flow-orchestrator` — barrel index kept as the single import point for all domain models; new entry appended in alphabetical order following the existing pattern

## 1. Objective

Add `ServerTime` to the `core/models/index.ts` barrel so that every consumer can import it via the single `@ui-models` path alias rather than a deep relative path.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports — this is a barrel re-export line
```

**Code to Add/Replace:**

* **Location:** Append as the last line of `projects/shared/src/core/models/index.ts`, after the current final export (`export * from './rental-dashboard.model';`).

* **Snippet (Append):**

```typescript
export * from './server-time.model';
```

The file should look like this after the change:

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
export * from './server-time.model';
```

## 4. Validation Steps

skip