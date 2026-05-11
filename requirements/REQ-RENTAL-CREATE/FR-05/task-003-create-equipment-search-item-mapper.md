# Task 003: Create `EquipmentSearchItemMapper`

> **Applied Skill:** `angular-data-flow-orchestrator` — Pure static mapper class converting the generated `EquipmentResponse` to the UI `EquipmentSearchItem`. Resolves the full `EquipmentType` object from the pre-loaded `EquipmentType[]` array passed by the caller (same pattern as `EquipmentMapper.fromResponse`). Falls back to a minimal `EquipmentType` stub when the type is not found in the store.

## 1. Objective

Create the mapper that converts a raw `EquipmentResponse` from the generated API client into the UI domain `EquipmentSearchItem`. Export it from the mappers barrel and from `public-api.ts`.

> **⚠️ Dependency:** Requires **task-002** (`EquipmentSearchItem` model) to be completed first.

## 2. Files to Modify / Create

### 2a. Create New File: `projects/shared/src/core/mappers/equipment-search-item.mapper.ts`

```typescript
import type { EquipmentResponse } from '@api-models';
import type { EquipmentSearchItem, EquipmentType } from '@ui-models';

export class EquipmentSearchItemMapper {
  static fromResponse(r: EquipmentResponse, types: EquipmentType[] = []): EquipmentSearchItem {
    const type: EquipmentType = types.find((t) => t.slug === r.type) ?? {
      slug: r.type,
      name: r.type,
      isForSpecialTariff: false,
    };
    return {
      id: r.id,
      uid: r.uid,
      model: r.model,
      type,
    };
  }
}
```

### 2b. Modify `projects/shared/src/core/mappers/index.ts`

**Location:** Add after the last `export *` line.

```typescript
export * from './equipment-search-item.mapper';
```

## 4. Validation Steps

```bash
npx ng build shared --configuration=development
```
