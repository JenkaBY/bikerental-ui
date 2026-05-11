# Task 006: Write Specs for New `RentalMapper` Methods

> **Applied Skill:** `angular-testing` — Vitest unit testing for pure static mapper functions; no TestBed required; use `describe`/`it`/`expect` from `vitest`; `as unknown as T` for partial API response stubs.

## 1. Objective

Extend `rental.mapper.spec.ts` with three new `describe` blocks that cover all five BDD acceptance criteria defined in `fr.md`:

* `toCreateRequest` — Scenario 1 (required fields) and Scenario 2 (special price mode)
* `toCostCalculationRequest` — Scenario 3 (equipment types population)
* `fromCostResponse` — Scenario 5 (RentalCostEstimate typing)

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/rental.mapper.spec.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

Add the following named type imports to the top of the file, alongside the existing import:

```typescript
import { describe, expect, it } from 'vitest';
import type { RentalSummaryResponse, CostCalculationResponse } from '@api-models';
import type { RentalWrite } from '@ui-models';
import { RentalMapper } from './rental.mapper';
import { makeMoney } from './money.mapper';
```

**Code to Add/Replace:**

* **Location:** Replace the entire file content with the snippet below. The existing two `it` blocks are preserved verbatim; the three new `describe` blocks are appended at the end.

```typescript
import { describe, expect, it } from 'vitest';
import type { RentalSummaryResponse, CostCalculationResponse } from '@api-models';
import type { RentalWrite } from '@ui-models';
import { RentalMapper } from './rental.mapper';
import { makeMoney } from './money.mapper';

describe('RentalMapper', () => {
  it('maps RentalSummaryResponse -> CustomerRentalSummary with provided fields', () => {
    const resp = {
      id: 42,
      status: 'ACTIVE',
      startedAt: '2024-01-02T10:00:00Z',
      expectedReturnAt: '2024-01-03T12:00:00Z',
      equipmentIds: [1, 2, 3],
    } as unknown as RentalSummaryResponse;

    const out = RentalMapper.fromRentalSummary(resp);

    expect(out.id).toBe(42);
    expect(out.status).toBe('ACTIVE');
    expect(out.startedAt).toBeInstanceOf(Date);
    expect(out.expectedReturnAt).toBeInstanceOf(Date);
    expect(out.equipmentIds).toEqual([1, 2, 3]);
    expect(out.estimatedCost).toEqual(makeMoney(0));
  });

  it('defaults missing fields to safe values', () => {
    const resp = {} as unknown as RentalSummaryResponse;
    const out = RentalMapper.fromRentalSummary(resp);

    expect(out.id).toBe(0);
    expect(out.status).toBe('');
    expect(out.startedAt).toBeInstanceOf(Date);
    expect((out.startedAt as Date).getTime()).toBe(new Date(0).getTime());
    expect(out.expectedReturnAt).toBeUndefined();
    expect(out.equipmentIds).toEqual([]);
    expect(out.estimatedCost).toEqual(makeMoney(0));
  });
});

describe('RentalMapper.toCreateRequest', () => {
  it('maps all required fields and omits undefined optional fields (Scenario 1)', () => {
    const draft: RentalWrite = {
      customerId: 'uuid-1',
      equipmentIds: [10, 20],
      durationMinutes: 120,
      discountPercent: 10,
      operatorId: 'op-1',
    };

    const result = RentalMapper.toCreateRequest(draft);

    expect(result.customerId).toBe('uuid-1');
    expect(result.equipmentIds).toEqual([10, 20]);
    expect(result.duration).toBe(120);
    expect(result.discountPercent).toBe(10);
    expect(result.operatorId).toBe('op-1');
    expect(result.specialTariffId).toBeUndefined();
    expect(result.specialPrice).toBeUndefined();
  });

  it('includes specialTariffId and specialPrice when set; omits discountPercent (Scenario 2)', () => {
    const draft: RentalWrite = {
      customerId: 'uuid-2',
      equipmentIds: [5],
      durationMinutes: 60,
      specialTariffId: 5,
      specialPrice: 500,
      operatorId: 'op-2',
    };

    const result = RentalMapper.toCreateRequest(draft);

    expect(result.specialTariffId).toBe(5);
    expect(result.specialPrice).toBe(500);
    expect(result.discountPercent).toBeUndefined();
  });
});

describe('RentalMapper.toCostCalculationRequest', () => {
  it('populates equipments from equipmentTypes array and maps durationMinutes (Scenario 3)', () => {
    const draft: Partial<RentalWrite> = {
      durationMinutes: 60,
      discountPercent: 5,
    };

    const result = RentalMapper.toCostCalculationRequest(draft, ['bike', 'helmet']);

    expect(result.equipments).toEqual([
      { equipmentType: 'bike' },
      { equipmentType: 'helmet' },
    ]);
    expect(result.plannedDurationMinutes).toBe(60);
    expect(result.discountPercent).toBe(5);
  });
});

describe('RentalMapper.fromCostResponse', () => {
  it('flattens discount and maps all fields from CostCalculationResponse (Scenario 5)', () => {
    const response = {
      subtotal: 200,
      totalCost: 180,
      discount: { percent: 10, amount: 20 },
      specialPricingApplied: false,
      equipmentBreakdowns: [
        { equipmentType: 'bike', tariffId: 1, itemCost: 180, tariffName: 'Standard', pricingType: 'PER_MINUTE', billedDurationMinutes: 60, calculationBreakdown: {} },
      ],
    } as unknown as CostCalculationResponse;

    const result = RentalMapper.fromCostResponse(response);

    expect(result.subtotal).toBe(200);
    expect(result.totalCost).toBe(180);
    expect(result.discountPercent).toBe(10);
    expect(result.discountAmount).toBe(20);
    expect(result.specialPricingApplied).toBe(false);
    expect(result.equipmentBreakdowns).toEqual([
      { equipmentType: 'bike', tariffId: 1, itemCost: 180 },
    ]);
  });

  it('returns undefined discountPercent and discountAmount when no discount object present', () => {
    const response = {
      subtotal: 100,
      totalCost: 100,
      specialPricingApplied: true,
      equipmentBreakdowns: [],
    } as unknown as CostCalculationResponse;

    const result = RentalMapper.fromCostResponse(response);

    expect(result.discountPercent).toBeUndefined();
    expect(result.discountAmount).toBeUndefined();
    expect(result.specialPricingApplied).toBe(true);
  });
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx vitest run --reporter=verbose projects/shared/src/core/mappers/rental.mapper.spec.ts
```
