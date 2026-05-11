# Task 001: Create `rental-create.model.ts`

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 1 (Model Definition): define clean UI-layer TypeScript interfaces in `core/models/`; no raw DTO types may appear here.

## 1. Objective

Create a new model file `rental-create.model.ts` that introduces three read-only domain interfaces required by the Create Rental flow: `RentalWrite`, `RentalCostEstimate`, and `EquipmentSearchItem`. This is a pure addition — no existing files are modified.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/rental-create.model.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports needed — all types are primitives
```

**Code to Add/Replace:**

* **Location:** New file, full content as shown below.
* **Snippet:**

```typescript
export interface RentalCostBreakdown {
  equipmentType: string;
  tariffId: number;
  itemCost: number;
}

export interface RentalCostEstimate {
  readonly subtotal: number;
  readonly totalCost: number;
  readonly discountAmount?: number;
  readonly discountPercent?: number;
  readonly specialPricingApplied: boolean;
  readonly equipmentBreakdowns: readonly RentalCostBreakdown[];
}

export interface RentalWrite {
  customerId: string;
  equipmentIds: number[];
  durationMinutes: number;
  discountPercent?: number;
  specialTariffId?: number;
  specialPrice?: number;
  operatorId: string;
}

export interface EquipmentSearchItem {
  readonly id: number;
  readonly uid: string;
  readonly model: string;
  readonly typeSlug: string;
  readonly statusSlug: string;
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx tsc --project tsconfig.app.json --noEmit
```
