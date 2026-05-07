# Task 007: Write Spec for `EquipmentSearchItemMapper`

> **Applied Skill:** `angular-testing` — Vitest unit testing for pure static mapper functions; no TestBed required; use `as unknown as T` for API response stubs; cover BDD Scenario 4 verbatim.

## 1. Objective

Create `equipment-search-item.mapper.spec.ts` alongside the mapper file. Covers BDD Scenario 4: `EquipmentSearchItemMapper.fromResponse` must correctly map all five fields from `EquipmentResponse` to `EquipmentSearchItem`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/equipment-search-item.mapper.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { describe, expect, it } from 'vitest';
import type { EquipmentResponse } from '@api-models';
import { EquipmentSearchItemMapper } from './equipment-search-item.mapper';
```

**Code to Add/Replace:**

* **Location:** New file, full content as shown below.
* **Snippet:**

```typescript
import { describe, expect, it } from 'vitest';
import type { EquipmentResponse } from '@api-models';
import { EquipmentSearchItemMapper } from './equipment-search-item.mapper';

describe('EquipmentSearchItemMapper.fromResponse', () => {
  it('maps all five fields from EquipmentResponse to EquipmentSearchItem (Scenario 4)', () => {
    const response = {
      id: 7,
      uid: 'ABC123',
      model: 'Trek FX3',
      type: 'bike',
      status: 'available',
      serialNumber: 'SN-001',
    } as unknown as EquipmentResponse;

    const result = EquipmentSearchItemMapper.fromResponse(response);

    expect(result.id).toBe(7);
    expect(result.uid).toBe('ABC123');
    expect(result.model).toBe('Trek FX3');
    expect(result.typeSlug).toBe('bike');
    expect(result.statusSlug).toBe('available');
  });

  it('preserves exact slug strings without transformation', () => {
    const response = {
      id: 1,
      uid: 'XYZ',
      model: 'Giant Escape 3',
      type: 'city-bike',
      status: 'maintenance',
      serialNumber: 'SN-002',
    } as unknown as EquipmentResponse;

    const result = EquipmentSearchItemMapper.fromResponse(response);

    expect(result.typeSlug).toBe('city-bike');
    expect(result.statusSlug).toBe('maintenance');
  });
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx vitest run --reporter=verbose projects/shared/src/core/mappers/equipment-search-item.mapper.spec.ts
```
