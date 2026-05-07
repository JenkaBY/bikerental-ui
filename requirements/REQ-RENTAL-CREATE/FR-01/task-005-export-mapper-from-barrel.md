# Task 005: Export `EquipmentSearchItemMapper` from `core/mappers/index.ts`

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 2 (Mapper Implementation): all mapper classes must be re-exported through the mappers barrel so consumers import from a single well-known location.

## 1. Objective

Add `export * from './equipment-search-item.mapper';` to the mappers barrel so that `EquipmentSearchItemMapper` is reachable via `core/mappers` (which is re-exported by `public-api.ts`).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports — this is a barrel export file
```

**Code to Add/Replace:**

* **Location:** Append as the **last line** of `projects/shared/src/core/mappers/index.ts`, after `export * from './user-profile.mapper';`.

Current last two lines of the file:

```typescript
export * from './customer-finance.mapper';
export * from './user-profile.mapper';
```

Replace with:

```typescript
export * from './customer-finance.mapper';
export * from './user-profile.mapper';
export * from './equipment-search-item.mapper';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
```
