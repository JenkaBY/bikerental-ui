# Task 002: Create `EquipmentSearchItem` Domain Model

> **Applied Skill:** `angular-data-flow-orchestrator` — New UI domain model for equipment search results. Must be placed in `projects/shared/src/core/models/` and exported from the barrel. Components import exclusively from `@bikerental/shared`.

## 1. Objective

Create the lightweight UI domain model representing one equipment item returned from the search autocomplete. It holds only what `EquipmentItemRowComponent` needs to display (UID, model, resolved type name).

## 2. Files to Modify / Create

### 2a. Create New File: `projects/shared/src/core/models/equipment-search-item.model.ts`

```typescript
import type { EquipmentType } from './equipment-type.model';

export interface EquipmentSearchItem {
  readonly id: number;
  readonly uid: string;
  readonly model: string;
  readonly type: EquipmentType;
}
```

### 2b. Modify `projects/shared/src/core/models/index.ts`

**Location:** Add after the last `export *` line.

```typescript
export * from './equipment-search-item.model';
```

### 2c. Modify `projects/shared/src/public-api.ts`

The `core/models` barrel is already exported via `export * from './core/models'`. No change needed here — the new type will be automatically included.

> **Verify:** The public-api.ts file exports `export * from './core/models'`. If it exports individual model files instead, add `export * from './core/models/equipment-search-item.model'` explicitly.

## 4. Validation Steps

```bash
npx ng build shared --configuration=development
```
