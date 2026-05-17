# Task 005: RentalDashboardMapper Unit Tests

> **Applied Skill:** `angular-testing` — Pure static class tests use Vitest directly without
> TestBed. No Angular DI needed. Import generated and domain types with `as unknown as` casts
> to construct minimal stubs, following the pattern established in
> `projects/shared/src/core/mappers/rental.mapper.spec.ts`.

## 1. Objective

Create `projects/shared/src/core/mappers/rental-dashboard.mapper.spec.ts` covering all seven
BDD acceptance criteria from `fr.md` — three for `toListItem`, one for `toDetailState`, and one
for `toReturnRequest`, plus edge cases for customer name building and empty inputs.

**Depends on:** Task 001 (domain interfaces) and Task 003 (mapper).

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/rental-dashboard.mapper.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Imports Required:**

```typescript
import { describe, expect, it } from 'vitest';
import type {
  CustomerResponse,
  EquipmentItemResponse,
  EquipmentResponse,
  RentalResponse,
  RentalSummaryResponse,
} from '@api-models';
import { RentalDashboardMapper } from './rental-dashboard.mapper';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { describe, expect, it } from 'vitest';
import type {
  CustomerResponse,
  EquipmentItemResponse,
  RentalResponse,
  RentalSummaryResponse,
} from '@api-models';
import { RentalDashboardMapper } from './rental-dashboard.mapper';

// ─── toListItem ────────────────────────────────────────────────────────────────

describe('RentalDashboardMapper.toListItem', () => {
  it('marks overdue rental correctly when overdueMinutes > 0 (Scenario 1)', () => {
    const r = {
      id: 1,
      status: 'ACTIVE',
      customerId: 'cust-1',
      equipmentIds: [],
      startedAt: new Date().toISOString(),
      overdueMinutes: 30,
    } as unknown as RentalSummaryResponse;

    const result = RentalDashboardMapper.toListItem(r, null, new Map());

    expect(result.isOverdue).toBe(true);
    expect(result.overdueMinutes).toBe(30);
    expect(result.isActive).toBe(true);
  });

  it('marks non-overdue rental correctly when overdueMinutes is undefined (Scenario 2)', () => {
    const r = {
      id: 2,
      status: 'ACTIVE',
      customerId: 'cust-2',
      equipmentIds: [],
      startedAt: new Date().toISOString(),
      overdueMinutes: undefined,
    } as unknown as RentalSummaryResponse;

    const result = RentalDashboardMapper.toListItem(r, null, new Map());

    expect(result.isOverdue).toBe(false);
    expect(result.overdueMinutes).toBeUndefined();
  });

  it('resolves equipment names from the equipment name map (Scenario 3)', () => {
    const r = {
      id: 3,
      status: 'ACTIVE',
      customerId: 'cust-3',
      equipmentIds: [10, 20],
      startedAt: new Date().toISOString(),
    } as unknown as RentalSummaryResponse;
    const nameMap = new Map<number, string>([
      [10, 'Trek FX3'],
      [20, 'Helmet S'],
    ]);

    const result = RentalDashboardMapper.toListItem(r, null, nameMap);

    expect(result.equipmentNames).toEqual(['Trek FX3', 'Helmet S']);
  });

  it('produces empty string for unknown equipment IDs in the name map', () => {
    const r = {
      id: 4,
      status: 'ACTIVE',
      customerId: 'cust-4',
      equipmentIds: [99],
      startedAt: new Date().toISOString(),
    } as unknown as RentalSummaryResponse;

    const result = RentalDashboardMapper.toListItem(r, null, new Map());

    expect(result.equipmentNames).toEqual(['']);
  });

  it('populates customerPhone and customerName from a CustomerResponse', () => {
    const r = {
      id: 5,
      status: 'ACTIVE',
      customerId: 'cust-5',
      equipmentIds: [],
      startedAt: new Date().toISOString(),
    } as unknown as RentalSummaryResponse;
    const customer = {
      id: 'cust-5',
      phone: '+375291234567',
      firstName: 'Alice',
      lastName: 'Smith',
    } as CustomerResponse;

    const result = RentalDashboardMapper.toListItem(r, customer, new Map());

    expect(result.customerPhone).toBe('+375291234567');
    expect(result.customerName).toBe('Alice Smith');
  });

  it('omits customerName when both firstName and lastName are absent', () => {
    const r = {
      id: 6,
      status: 'ACTIVE',
      customerId: 'cust-6',
      equipmentIds: [],
      startedAt: new Date().toISOString(),
    } as unknown as RentalSummaryResponse;
    const customer = {
      id: 'cust-6',
      phone: '+375290000000',
    } as CustomerResponse;

    const result = RentalDashboardMapper.toListItem(r, customer, new Map());

    expect(result.customerPhone).toBe('+375290000000');
    expect(result.customerName).toBeUndefined();
  });

  it('sets customerPhone to empty string when customer is null', () => {
    const r = {
      id: 7,
      status: 'ACTIVE',
      customerId: 'cust-7',
      equipmentIds: [],
      startedAt: new Date().toISOString(),
    } as unknown as RentalSummaryResponse;

    const result = RentalDashboardMapper.toListItem(r, null, new Map());

    expect(result.customerPhone).toBe('');
    expect(result.customerName).toBeUndefined();
  });

  it('sets isDebt true for DEBT status rental', () => {
    const r = {
      id: 8,
      status: 'DEBT',
      customerId: 'cust-8',
      equipmentIds: [],
      startedAt: new Date().toISOString(),
    } as unknown as RentalSummaryResponse;

    const result = RentalDashboardMapper.toListItem(r, null, new Map());

    expect(result.isDebt).toBe(true);
    expect(result.isActive).toBe(false);
  });
});

// ─── toDetailState ─────────────────────────────────────────────────────────────

describe('RentalDashboardMapper.toDetailState', () => {
  it('maps all nested equipment items with model from batch, statusSlug and isReturned (Scenario 4)', () => {
    const r = {
      id: 10,
      status: 'ACTIVE',
      customerId: 'cust-10',
      equipmentItems: [
        {
          equipmentId: 101,
          equipmentUid: 'UID-101',
          status: 'ACTIVE',
          estimatedCost: 100,
        },
        {
          equipmentId: 102,
          equipmentUid: 'UID-102',
          status: 'RETURNED',
          estimatedCost: 50,
        },
      ] as EquipmentItemResponse[],
      plannedDurationMinutes: 60,
      estimatedCost: 150,
    } as unknown as RentalResponse;
    const equipmentBatch = [
      { id: 101, uid: 'UID-101', model: 'Trek FX3', type: 'BIKE', status: 'ACTIVE', serialNumber: 'SN-101' },
      { id: 102, uid: 'UID-102', model: 'Helmet S', type: 'HELMET', status: 'RETURNED', serialNumber: 'SN-102' },
    ] as unknown as EquipmentResponse[];

    const result = RentalDashboardMapper.toDetailState(r, null, equipmentBatch);

    expect(result.equipmentItems).toHaveLength(2);
    expect(result.equipmentItems![0].id).toBe(101);
    expect(result.equipmentItems![0].uid).toBe('UID-101');
    expect(result.equipmentItems![0].model).toBe('Trek FX3');
    expect((result.equipmentItems![0] as any).statusSlug).toBe('ACTIVE');
    expect((result.equipmentItems![0] as any).isReturned).toBe(false);
    expect(result.equipmentItems![1].model).toBe('Helmet S');
    expect((result.equipmentItems![1] as any).statusSlug).toBe('RETURNED');
    expect((result.equipmentItems![1] as any).isReturned).toBe(true);
  });

  it('defaults model to empty string when equipment ID is not in the batch', () => {
    const r = {
      id: 15,
      status: 'ACTIVE',
      customerId: 'cust-15',
      equipmentItems: [{ equipmentId: 999, equipmentUid: 'UID-999', status: 'ACTIVE', estimatedCost: 0 }] as EquipmentItemResponse[],
      plannedDurationMinutes: 60,
      estimatedCost: 0,
    } as unknown as RentalResponse;

    const result = RentalDashboardMapper.toDetailState(r, null, []);

    expect(result.equipmentItems![0].model).toBe('');
    expect(result.equipmentItems![0].uid).toBe('UID-999');
  });

  it('populates paidDurationMinutes from actualDurationMinutes', () => {
    const r = {
      id: 11,
      status: 'COMPLETED',
      customerId: 'cust-11',
      equipmentItems: [],
      plannedDurationMinutes: 60,
      actualDurationMinutes: 75,
      estimatedCost: 0,
    } as unknown as RentalResponse;

    const result = RentalDashboardMapper.toDetailState(r, null, []);

    expect(result.paidDurationMinutes).toBe(75);
    expect(result.durationMinutes).toBe(60);
  });

  it('populates debtAmount from finalCost when status is DEBT', () => {
    const r = {
      id: 12,
      status: 'DEBT',
      customerId: 'cust-12',
      equipmentItems: [],
      plannedDurationMinutes: 60,
      finalCost: 250,
      estimatedCost: 0,
    } as unknown as RentalResponse;

    const result = RentalDashboardMapper.toDetailState(r, null, []);

    expect(result.isDebt).toBe(true);
    expect(result.debtAmount?.amount).toBe(250);
    expect(result.finalCost?.amount).toBe(250);
  });

  it('omits debtAmount when status is not DEBT even if finalCost is present', () => {
    const r = {
      id: 13,
      status: 'COMPLETED',
      customerId: 'cust-13',
      equipmentItems: [],
      plannedDurationMinutes: 60,
      finalCost: 300,
      estimatedCost: 0,
    } as unknown as RentalResponse;

    const result = RentalDashboardMapper.toDetailState(r, null, []);

    expect(result.isDebt).toBe(false);
    expect(result.debtAmount).toBeUndefined();
    expect(result.finalCost?.amount).toBe(300);
  });

  it('initialises brokenEquipmentEntries as empty array and isReturning as false', () => {
    const r = {
      id: 14,
      status: 'ACTIVE',
      customerId: 'cust-14',
      equipmentItems: [],
      plannedDurationMinutes: 60,
      estimatedCost: 0,
    } as unknown as RentalResponse;

    const result = RentalDashboardMapper.toDetailState(r, null, []);

    expect(result.brokenEquipmentEntries).toEqual([]);
    expect(result.isReturning).toBe(false);
  });
});

// ─── toReturnRequest ──────────────────────────────────────────────────────────

describe('RentalDashboardMapper.toReturnRequest', () => {
  it('maps rentalId, equipmentIds, and operatorId — no pricing fields forwarded (Scenario 5)', () => {
    const write = {
      rentalId: 7,
      equipmentItemIds: [1, 2],
      discountPercent: 10,
      specialPrice: 500,
    };

    const result = RentalDashboardMapper.toReturnRequest(write, 'op-1');

    expect(result.rentalId).toBe(7);
    expect(result.equipmentIds).toEqual([1, 2]);
    expect(result.operatorId).toBe('op-1');
    expect((result as any).discountPercent).toBeUndefined();
    expect((result as any).specialPrice).toBeUndefined();
    expect((result as any).paymentMethod).toBeUndefined();
  });

  it('maps equipmentItemIds to equipmentIds (field name changes at the API boundary)', () => {
    const write = { rentalId: 9, equipmentItemIds: [10, 11, 12] };

    const result = RentalDashboardMapper.toReturnRequest(write, 'op-3');

    expect(result.equipmentIds).toEqual([10, 11, 12]);
  });
});
```

---

## 4. Validation Steps

```bash
ng test shared --watch=false
```

Expected: all tests in `rental-dashboard.mapper.spec.ts` pass. Zero failures.
