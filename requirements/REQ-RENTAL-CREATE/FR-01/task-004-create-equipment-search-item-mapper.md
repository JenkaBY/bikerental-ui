# Task 004: Create `EquipmentSearchItemMapper`

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 2 (Mapper Implementation): new pure static mapper class; maps generated `EquipmentResponse` → domain `EquipmentSearchItem`; no side effects or Angular DI.

## 1. Objective

Create a new mapper file `equipment-search-item.mapper.ts` containing the `EquipmentSearchItemMapper` class with a single static method `fromResponse(r: EquipmentResponse): EquipmentSearchItem`. This is entirely additive and does not touch the existing `equipment.mapper.ts`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/equipment-search-item.mapper.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import type { EquipmentResponse } from '@api-models';
import type { EquipmentSearchItem } from '@ui-models';
```

**Code to Add/Replace:**

* **Location:** New file, full content as shown below.
* **Snippet:**

```typescript
import type { EquipmentResponse } from '@api-models';
import type { EquipmentSearchItem } from '@ui-models';

export class EquipmentSearchItemMapper {
  static fromResponse(r: EquipmentResponse): EquipmentSearchItem {
    return {
      id: r.id,
      uid: r.uid,
      model: r.model,
      type: r.type,
      status: r.status,
    };
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
```
