# Task 003: Implement RentalDashboardMapper

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 2: Mapper Implementation. A pure
> static class with no Angular DI and no side effects that bridges generated API shapes to domain
> types. Follows the same pattern as the existing `RentalMapper` and `CustomerMapper` in
> `core/mappers/`.

## 1. Objective

Create `projects/shared/src/core/mappers/rental-dashboard.mapper.ts` implementing three static
methods: `toListItem`, `toDetailState`, and `toReturnRequest`. Export it from the
`core/mappers/index.ts` barrel.

**Depends on:** Task 001 (domain interfaces must exist).

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/rental-dashboard.mapper.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/core/mappers/index.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### 3.1 — Create `rental-dashboard.mapper.ts`

**Imports Required:**

```typescript
import type {
  CustomerResponse,
  EquipmentItemResponse,
  EquipmentResponse,
  RentalResponse,
  RentalSummaryResponse,
  ReturnEquipmentRequest,
} from '@api-models';
import type {
  BrokenEquipmentEntry,
  RentalDetailState,
  RentalEquipmentItem,
  RentalListItem,
  ReturnEquipmentWrite,
} from '@ui-models';
import { CustomerMapper } from './customer.mapper';
import { makeMoney } from './money.mapper';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import type {
  CustomerResponse,
  EquipmentItemResponse,
  EquipmentResponse,
  RentalResponse,
  RentalSummaryResponse,
  ReturnEquipmentRequest,
} from '@api-models';
import type {
  BrokenEquipmentEntry,
  RentalDetailState,
  RentalEquipmentItem,
  RentalListItem,
  ReturnEquipmentWrite,
} from '@ui-models';
import { CustomerMapper } from './customer.mapper';
import { makeMoney } from './money.mapper';

export class RentalDashboardMapper {
  static toListItem(
    r: RentalSummaryResponse,
    customer: CustomerResponse | null,
    equipmentNameMap: Map<number, string>,
  ): RentalListItem {
    const isActive = r.status === 'ACTIVE';
    const isDebt = r.status === 'DEBT';
    const isOverdue = r.overdueMinutes != null && r.overdueMinutes > 0;
    const firstName = customer?.firstName ?? '';
    const lastName = customer?.lastName ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    return {
      id: r.id ?? 0,
      status: r.status ?? '',
      customerPhone: customer?.phone ?? '',
      customerName: fullName || undefined,
      startedAt: r.startedAt ? new Date(r.startedAt) : new Date(0),
      equipmentNames: (r.equipmentIds ?? []).map((id) => equipmentNameMap.get(id) ?? ''),
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      isActive,
      isDebt,
      isOverdue,
      overdueMinutes: isOverdue ? r.overdueMinutes : undefined,
    };
  }

  static toDetailState(
    r: RentalResponse,
    customer: CustomerResponse | null,
    equipmentBatch: EquipmentResponse[],
  ): Partial<RentalDetailState> {
    const isActive = r.status === 'ACTIVE';
    const isDebt = r.status === 'DEBT';
    const startedAt = r.startedAt ? new Date(r.startedAt) : null;
    const now = new Date();
    const isOverdue =
      isActive &&
      startedAt !== null &&
      r.plannedDurationMinutes != null &&
      new Date(startedAt.getTime() + r.plannedDurationMinutes * 60_000) < now;

    const equipmentMap = new Map<number, EquipmentResponse>(
      equipmentBatch.map((e) => [e.id, e]),
    );
    const equipmentItems: RentalEquipmentItem[] = (r.equipmentItems ?? []).map(
      (item: EquipmentItemResponse) => {
        const eq = equipmentMap.get(item.equipmentId);
        return {
          id: item.equipmentId,
          uid: eq?.uid ?? item.equipmentUid ?? '',
          model: eq?.model ?? '',
          type: { slug: eq?.type ?? '', name: eq?.type ?? '', isForSpecialTariff: false },
          statusSlug: item.status,
          isReturned: item.status === 'RETURNED',
        };
      },
    );

    return {
      id: r.id,
      status: r.status,
      customerId: r.customerId,
      customer: customer ? CustomerMapper.fromResponse(customer) : null,
      equipmentItems,
      durationMinutes: r.plannedDurationMinutes,
      startedAt,
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      paidDurationMinutes: r.actualDurationMinutes,
      finalCost: r.finalCost !== undefined ? makeMoney(r.finalCost) : undefined,
      debtAmount: isDebt && r.finalCost !== undefined ? makeMoney(r.finalCost) : undefined,
      isActive,
      isDebt,
      isOverdue,
      brokenEquipmentEntries: [] as BrokenEquipmentEntry[],
      isReturning: false,
    };
  }

  static toReturnRequest(
    w: ReturnEquipmentWrite,
    operatorId: string,
  ): ReturnEquipmentRequest {
    return {
      rentalId: w.rentalId,
      equipmentIds: w.equipmentItemIds,
      operatorId,
    };
  }
}
```

**Key implementation notes:**

- `toListItem`: `isOverdue` is `true` only when `overdueMinutes != null && overdueMinutes > 0`.
  When `isOverdue` is `false`, `overdueMinutes` must be `undefined` on the returned object.
- `toDetailState`: accepts `equipmentBatch: EquipmentResponse[]` as a third parameter — retrieved
  by the caller (the detail store in FR-06) via `EquipmentsCatalogueService.getBatchEquipments(equipmentIds)`,
  where `equipmentIds` is extracted from `RentalResponse.equipmentItems[].equipmentId`. The mapper
  builds a lookup map and merges `model` and `type` slug from the batch into each `RentalEquipmentItem`.
  When an ID is not found in the batch (silently omitted by the API), `model` defaults to `''` and
  `type.slug` defaults to `''`.
- `toDetailState`: `isOverdue` is computed client-side for `RentalResponse` (which lacks
  `overdueMinutes`). Formula: `isActive && startedAt + plannedDurationMinutes * 60000 < now`.
- `toReturnRequest`: `operatorId` is provided by the caller (the detail store). `discountPercent`,
  `specialPrice`, and `paymentMethod` are intentionally NOT forwarded — the backend return
  endpoint does not support pricing overrides at return time. `ReturnEquipmentWrite` retains
  these fields because the detail store uses them to drive the cost estimate display (FR-09),
  not the return API call itself.

---

### 3.2 — Update `core/mappers/index.ts` barrel

**File Path:** `projects/shared/src/core/mappers/index.ts`

* **Location:** After the last existing `export * from` line (currently `export * from './equipment-search-item.mapper';`)

* **Snippet:**

```typescript
export * from './rental-dashboard.mapper';
```

The final lines of `projects/shared/src/core/mappers/index.ts` should look like:

```typescript
export * from './rental.mapper';
export * from './customer-finance.mapper';
export * from './user-profile.mapper';
export * from './equipment-search-item.mapper';
export * from './rental-dashboard.mapper';
```

---

## 4. Validation Steps

```bash
ng build operator --configuration=development
```

Expected: zero TypeScript errors. The mapper is exported from `@bikerental/shared` and
`@api-models`/`@ui-models` type aliases resolve correctly.
