# Task 003: Update Shared Library Barrels

> **Applied Skills:** `angular-di` — ensuring all new domain types and mappers are discoverable from a single import path (`@bikerental/shared`) before any consuming code is written.

## 1. Objective

Wire the new `customer.model.ts` and `customer.mapper.ts` into the three barrel files so downstream admin components can import them from `@bikerental/shared` without deep paths.

## 2. Files to Modify

### File 1: `projects/shared/src/core/models/index.ts`

* **Action:** Modify Existing File
* **Location:** Add the new export at the end of the file, after the existing exports.

**Current file:**

```typescript
export * from './common.model';
export * from './equipment.model';
export * from './equipment-status.model';
export * from './equipment-type.model';
export * from './tariff.model';
```

**New line to append:**

```typescript
export * from './customer.model';
```

---

### File 2: `projects/shared/src/core/mappers/index.ts`

* **Action:** Modify Existing File
* **Location:** Add the new export at the end of the file, after the existing exports.

**Current file:**

```typescript
export * from './equipment.mapper';
export * from './equipment-status.mapper';
export * from './equipment-type.mapper';
export * from './pricing-type.mapper';
export * from './page.mapper';
export * from './tariff.mapper';
```

**New line to append:**

```typescript
export * from './customer.mapper';
```

---

### File 3: `projects/shared/src/public-api.ts`

* **Action:** No change required.

The `public-api.ts` already re-exports both barrels via:

```typescript
export * from './core/mappers';   // includes customer.mapper after task-002 barrel update
export * from './core/models';    // includes customer.model after task-001 barrel update
```

No modification needed — the new types will flow through automatically once the barrel files are updated.

## 4. Validation Steps

```bash
cd projects/shared && npx tsc --noEmit -p tsconfig.lib.json
```

After running this, confirm that `Customer`, `Money`, `CustomerMapper`, `mapRentalStatus`, `mapEquipmentItemStatus` appear in the library's type output without errors.
