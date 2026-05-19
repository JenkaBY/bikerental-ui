# Task 001: Extend RentalCostEstimate Model and fromCostResponse Mapper

> **Applied Skill:** `angular-data-flow-orchestrator` — Extends the domain model (`core/models/`) and the mapper (`core/mappers/`) following the three-layer data pipeline rule. Generated types are read-only; only domain model and mapper are modified.

## 1. Objective

Add `calculationMessage: string` to `RentalCostBreakdown` and `isEstimate: boolean` to `RentalCostEstimate`, then update `RentalMapper.fromCostResponse()` to populate both new fields from the already-generated `CostCalculationResponse` shape.

## 2. Files to Modify

### File A

* **File Path:** `projects/shared/src/core/models/rental-create.model.ts`
* **Action:** Modify Existing File

### File B

* **File Path:** `projects/shared/src/core/mappers/rental.mapper.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### File A — `rental-create.model.ts`

**Location:** Replace the existing `RentalCostBreakdown` interface (lines 4–8) and the existing `RentalCostEstimate` interface (lines 10–18).

**Code to Replace:**

```typescript
export interface RentalCostBreakdown {
  equipmentType: string;
  tariffId: number;
  itemCost: Money;
}

export interface RentalCostEstimate {
  readonly subtotal: Money;
  readonly totalCost: Money;
  readonly discountAmount?: Money;
  readonly discountPercent?: number;
  readonly specialPricingApplied: boolean;
  readonly equipmentBreakdowns: readonly RentalCostBreakdown[];
}
```

**Replace With:**

```typescript
export interface RentalCostBreakdown {
  equipmentType: string;
  tariffId: number;
  itemCost: Money;
  calculationMessage: string;
}

export interface RentalCostEstimate {
  readonly subtotal: Money;
  readonly totalCost: Money;
  readonly discountAmount?: Money;
  readonly discountPercent?: number;
  readonly specialPricingApplied: boolean;
  readonly isEstimate: boolean;
  readonly equipmentBreakdowns: readonly RentalCostBreakdown[];
}
```

---

### File B — `rental.mapper.ts`

**Location:** Replace the body of `static fromCostResponse()` — the entire method starting at `static fromCostResponse(` through its closing `}`.

**Code to Replace:**

```typescript
  static fromCostResponse(response: CostCalculationResponse): RentalCostEstimate {
    return {
      subtotal: makeMoney(response.subtotal),
      totalCost: makeMoney(response.totalCost),
      specialPricingApplied: response.specialPricingApplied ?? false,
      discountPercent: response.discount?.percent,
      discountAmount: makeMoney(response.discount?.amount ?? 0),
      equipmentBreakdowns: response.equipmentBreakdowns.map((b) => ({
        equipmentType: b.equipmentType,
        tariffId: b.tariffId,
        itemCost: makeMoney(b.itemCost),
      })),
    };
  }
```

**Replace With:**

```typescript
  static fromCostResponse(response: CostCalculationResponse): RentalCostEstimate {
    return {
      subtotal: makeMoney(response.subtotal),
      totalCost: makeMoney(response.totalCost),
      specialPricingApplied: response.specialPricingApplied ?? false,
      isEstimate: response.estimate ?? true,
      discountPercent: response.discount?.percent,
      discountAmount: makeMoney(response.discount?.amount ?? 0),
      equipmentBreakdowns: response.equipmentBreakdowns.map((b) => ({
        equipmentType: b.equipmentType,
        tariffId: b.tariffId,
        itemCost: makeMoney(b.itemCost),
        calculationMessage: b.calculationBreakdown?.message ?? '',
      })),
    };
  }
```

---

## 4. Validation Steps

skip