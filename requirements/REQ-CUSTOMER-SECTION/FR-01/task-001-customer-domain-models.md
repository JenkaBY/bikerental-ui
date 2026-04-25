# Task 001: Customer Domain Models

> **Applied Skills:** `angular-component` (OnPush, signal patterns), `angular-signals` (signal() / computed()) — enforcing immutable value objects, typed status maps, and pure helper functions with no side effects.

## 1. Objective

Implement all customer-domain TypeScript types in `customer.model.ts`. This is the foundational layer every downstream task (002–016) depends on. The file must export `Money`, all domain interfaces, the two typed status maps, and the two status-lookup helpers.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/models/customer.model.ts`
* **Action:** Replace Empty File (file exists but is empty)

## 3. Code Implementation

**Imports Required:** None (pure type/value file — no external imports needed).

**Code to Add/Replace:**

* **Location:** Replace the entire file content with the snippet below.

```typescript
export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export function makeMoney(amount: number, currency = 'BYN'): Money {
  return { amount, currency };
}

export interface Customer {
  readonly id: string;
  readonly phone: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly birthDate?: Date;
  readonly notes?: string;
}

export interface CustomerWrite {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthDate?: Date;
  notes?: string;
}

export interface CustomerRentalSummary {
  readonly id: number;
  readonly status: string;
  readonly startedAt: Date;
  readonly expectedReturnAt?: Date;
  readonly estimatedCost: Money;
  readonly equipmentIds: number[];
}

export interface CustomerBalance {
  readonly available: Money;
  readonly reserved: Money;
  readonly lastUpdatedAt: Date;
}

export interface CustomerTransaction {
  readonly transactionId: string;
  readonly recordedAt: Date;
  readonly amount: Money;
  readonly description?: string;
  readonly sourceType?: string;
  readonly amountColor: 'positive' | 'negative' | 'neutral';
}

export interface RentalStatusMeta {
  readonly slug: string;
  readonly colour: 'primary' | 'accent' | 'warn' | 'default';
  readonly labelKey: string;
}

export interface EquipmentItemStatusMeta {
  readonly slug: string;
  readonly colour: 'primary' | 'accent' | 'warn' | 'default';
  readonly labelKey: string;
}

export const RentalStatus: Record<string, RentalStatusMeta> = {
  DRAFT: { slug: 'DRAFT', colour: 'default', labelKey: 'rentalStatus.draft' },
  ACTIVE: { slug: 'ACTIVE', colour: 'primary', labelKey: 'rentalStatus.active' },
  COMPLETED: { slug: 'COMPLETED', colour: 'default', labelKey: 'rentalStatus.completed' },
  CANCELLED: { slug: 'CANCELLED', colour: 'default', labelKey: 'rentalStatus.cancelled' },
  DEBT: { slug: 'DEBT', colour: 'warn', labelKey: 'rentalStatus.debt' },
};

export const EquipmentItemStatus: Record<string, EquipmentItemStatusMeta> = {
  ASSIGNED: { slug: 'ASSIGNED', colour: 'primary', labelKey: 'equipmentItemStatus.assigned' },
  ACTIVE: { slug: 'ACTIVE', colour: 'warn', labelKey: 'equipmentItemStatus.active' },
  RETURNED: { slug: 'RETURNED', colour: 'default', labelKey: 'equipmentItemStatus.returned' },
};

const DEFAULT_RENTAL_STATUS: RentalStatusMeta = { slug: '', colour: 'default', labelKey: '' };
const DEFAULT_EQUIPMENT_ITEM_STATUS: EquipmentItemStatusMeta = { slug: '', colour: 'default', labelKey: '' };

export function mapRentalStatus(slug: string): RentalStatusMeta {
  return RentalStatus[slug] ?? DEFAULT_RENTAL_STATUS;
}

export function mapEquipmentItemStatus(slug: string): EquipmentItemStatusMeta {
  return EquipmentItemStatus[slug] ?? DEFAULT_EQUIPMENT_ITEM_STATUS;
}
```

## 4. Validation Steps

```bash
cd projects/shared && npx tsc --noEmit -p tsconfig.lib.json
```
