# Task 004: Export `TimeTravelMapper` from the Mappers Barrel

> **Applied Skill:** `angular-data-flow-orchestrator` — barrel index kept as the single import point for all mapper classes; new entry appended after the last existing export

## 1. Objective

Add `TimeTravelMapper` to the `core/mappers/index.ts` barrel so that downstream consumers (e.g., `TimeTravelStore` in FR-03) can import it via `@shared` or the mappers barrel without deep relative paths.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports — this is a barrel re-export line
```

**Code to Add/Replace:**

* **Location:** Append as the last line of `projects/shared/src/core/mappers/index.ts`, after the current final export (`export * from './rental-dashboard.mapper';`).

* **Snippet (Append):**

```typescript
export * from './time-travel.mapper';
```

The file should look like this after the change:

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
export * from './rental.mapper';
export * from './customer-finance.mapper';
export * from './user-profile.mapper';
export * from './equipment-search-item.mapper';
export * from './rental-dashboard.mapper';
export * from './time-travel.mapper';
```

## 4. Validation Steps

skip