# Task 002: Export New Model from `core/models/index.ts`

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 1 (Model Definition): all domain types must be re-exported through the barrel so that downstream components never import from file paths directly.

## 1. Objective

Add a single `export *` line for `rental-create.model.ts` to the models barrel (`core/models/index.ts`) so that `RentalWrite`, `RentalCostEstimate`, `RentalCostBreakdown`, and `EquipmentSearchItem` are accessible via the `@ui-models` path alias.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports — this is a barrel export file
```

**Code to Add/Replace:**

* **Location:** Append as the **last line** of `projects/shared/src/core/models/index.ts`, after `export * from './user-preferences.model';`.
* **Snippet:**

Current last two lines of the file:

```typescript
export * from './user-profile.model';
export * from './user-preferences.model';
```

Replace with:

```typescript
export * from './user-profile.model';
export * from './user-preferences.model';
export * from './rental-create.model';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
```
