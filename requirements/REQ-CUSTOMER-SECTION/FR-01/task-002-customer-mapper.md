# Task 002: Customer Mapper

> **Applied Skills:** `angular-component` (pure static class, no side effects), `angular-signals` — enforcing the three-layer data pipeline rule: mapper is the only place that converts between generated API types and domain models.

## 1. Objective

Implement `CustomerMapper` as a pure static class in `customer.mapper.ts`. The mapper converts between generated API response types and the domain interfaces defined in task-001. It is the **only** place where `makeMoney()` is called — components and stores never construct `Money` directly.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/customer.mapper.ts`
* **Action:** Replace Empty File (file exists but is empty)

## 3. Code Implementation

**Imports Required:**

```typescript
import type {
  CustomerResponse,
  CustomerRequest,
  CustomerAccountBalancesResponse,
  RentalSummaryResponse,
} from '@api-models';
import {
  Customer,
  CustomerWrite,
  CustomerBalance,
  CustomerTransaction,
  CustomerRentalSummary,
  makeMoney,
} from '../models/customer.model';
```

**Code to Add/Replace:**

* **Location:** Replace entire file content.

```typescript
import type {
  CustomerResponse,
  CustomerRequest,
  CustomerAccountBalancesResponse,
  RentalSummaryResponse,
} from '@api-models';
import {
  type Customer,
  type CustomerWrite,
  type CustomerBalance,
  type CustomerTransaction,
  type CustomerRentalSummary,
  makeMoney,
} from '../models/customer.model';

interface RawTransactionItem {
  readonly transactionId?: string;
  readonly recordedAt?: Date | string;
  readonly amount?: number;
  readonly description?: string;
  readonly sourceType?: string;
}

export class CustomerMapper {
  static fromResponse(r: CustomerResponse): Customer {
    return {
      id: r.id,
      phone: r.phone,
      firstName: r.firstName ?? '',
      lastName: r.lastName ?? '',
      email: r.email,
      birthDate: r.birthDate ? new Date(r.birthDate) : undefined,
      notes: r.comments,
    };
  }

  static toRequest(w: CustomerWrite): CustomerRequest {
    return {
      phone: w.phone,
      firstName: w.firstName,
      lastName: w.lastName,
      email: w.email,
      birthDate: w.birthDate,
      comments: w.notes,
    };
  }

  static fromBalanceResponse(r: CustomerAccountBalancesResponse): CustomerBalance {
    return {
      available: makeMoney(r.walletBalance),
      reserved: makeMoney(r.holdBalance),
      lastUpdatedAt: new Date(r.lastUpdatedAt),
    };
  }

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

  static fromTransactionItem(item: RawTransactionItem): CustomerTransaction {
    const amount = item.amount ?? 0;
    return {
      transactionId: item.transactionId ?? '',
      recordedAt: item.recordedAt ? new Date(item.recordedAt) : new Date(0),
      amount: makeMoney(amount),
      description: item.description,
      sourceType: item.sourceType,
      amountColor: amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral',
    };
  }
}
```

**Note:** `estimatedCost` is set to `makeMoney(0)` in `fromRentalSummary` because `RentalSummaryResponse` does not include cost data. Cost is only available in the full `RentalResponse` fetched on row expand (FR-05 detail cache).

## 4. Validation Steps

```bash
cd projects/shared && npx tsc --noEmit -p tsconfig.lib.json
```
