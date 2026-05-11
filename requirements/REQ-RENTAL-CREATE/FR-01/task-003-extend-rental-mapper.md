# Task 003: Extend `RentalMapper` with Create-Rental Methods

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 2 (Mapper Implementation): pure static class; no side effects; strict typing against generated API types and domain models only.

## 1. Objective

Add three new static methods to the existing `RentalMapper` class in `rental.mapper.ts`:

* `toCreateRequest(draft: RentalWrite): CreateRentalRequest` — maps domain draft → generated API request shape
* `toCostCalculationRequest(draft: Partial<RentalWrite>, equipmentTypes: string[]): CostCalculationRequest` — maps domain partial draft + equipment type slugs → cost calculation request
* `fromCostResponse(response: CostCalculationResponse): RentalCostEstimate` — maps generated API response → domain cost estimate

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/rental.mapper.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

Add the following imports to the **top** of `projects/shared/src/core/mappers/rental.mapper.ts` (additional named imports alongside `RentalSummaryResponse`):

```typescript
import type {
  RentalSummaryResponse,
  CreateRentalRequest,
  CostCalculationRequest,
  CostCalculationResponse,
} from '@api-models';
import { type CustomerRentalSummary, type RentalWrite, type RentalCostEstimate } from '@ui-models';
import { makeMoney } from './money.mapper';
```

**Code to Add/Replace:**

* **Location:** Inside the `RentalMapper` class body, **appended after** the closing `}` of the existing `fromRentalSummary` method, **before** the closing `}` of the class.

The current file content is:

```typescript
import type { RentalSummaryResponse } from '@api-models';
import { type CustomerRentalSummary } from '@ui-models';
import { makeMoney } from './money.mapper';

export class RentalMapper {
  static fromRentalSummary(r: RentalSummaryResponse): CustomerRentalSummary {
    return {
      id: r.id ?? 0,
      status: r.status ?? '',
      startedAt: r.startedAt ? new Date(r.startedAt) : new Date(0),
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      estimatedCost: makeMoney(0),
      equipmentIds: r.equipmentIds ?? [],
    };
  }
}
```

Replace the entire file with:

```typescript
import type {
  RentalSummaryResponse,
  CreateRentalRequest,
  CostCalculationRequest,
  CostCalculationResponse,
} from '@api-models';
import { type CustomerRentalSummary, type RentalWrite, type RentalCostEstimate } from '@ui-models';
import { makeMoney } from './money.mapper';

export class RentalMapper {
  static fromRentalSummary(r: RentalSummaryResponse): CustomerRentalSummary {
    return {
      id: r.id ?? 0,
      status: r.status ?? '',
      startedAt: r.startedAt ? new Date(r.startedAt) : new Date(0),
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      estimatedCost: makeMoney(0),
      equipmentIds: r.equipmentIds ?? [],
    };
  }

  static toCreateRequest(draft: RentalWrite): CreateRentalRequest {
    return {
      customerId: draft.customerId,
      equipmentIds: draft.equipmentIds,
      duration: draft.durationMinutes,
      operatorId: draft.operatorId,
      ...(draft.discountPercent !== undefined && { discountPercent: draft.discountPercent }),
      ...(draft.specialTariffId !== undefined && { specialTariffId: draft.specialTariffId }),
      ...(draft.specialPrice !== undefined && { specialPrice: draft.specialPrice }),
    };
  }

  static toCostCalculationRequest(
    draft: Partial<RentalWrite>,
    equipmentTypes: string[],
  ): CostCalculationRequest {
    return {
      equipments: equipmentTypes.map((equipmentType) => ({ equipmentType })),
      plannedDurationMinutes: draft.durationMinutes ?? 0,
      ...(draft.discountPercent !== undefined && { discountPercent: draft.discountPercent }),
      ...(draft.specialTariffId !== undefined && { specialTariffId: draft.specialTariffId }),
      ...(draft.specialPrice !== undefined && { specialPrice: draft.specialPrice }),
    };
  }

  static fromCostResponse(response: CostCalculationResponse): RentalCostEstimate {
    return {
      subtotal: response.subtotal,
      totalCost: response.totalCost,
      specialPricingApplied: response.specialPricingApplied ?? false,
      discountPercent: response.discount?.percent,
      discountAmount: response.discount?.amount,
      equipmentBreakdowns: response.equipmentBreakdowns.map((b) => ({
        equipmentType: b.equipmentType,
        tariffId: b.tariffId,
        itemCost: b.itemCost,
      })),
    };
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
```
