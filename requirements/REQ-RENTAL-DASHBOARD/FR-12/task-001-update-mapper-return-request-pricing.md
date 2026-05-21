# Task 001: Verify `RentalDashboardMapper.toReturnRequest()` Does Not Send Pricing Fields

> **Applied Skill:** `angular-data-flow-orchestrator` — Mapper layer verification; confirms that `discountPercent` and `specialPrice` from `ReturnEquipmentWrite` are intentionally **excluded** from the generated `ReturnEquipmentRequest`. The backend derives pricing from the rental record at return time.

## 1. Objective

`RentalDashboardMapper.toReturnRequest()` must only map the minimum required fields: `rentalId`, `equipmentIds`, and `operatorId`. The pricing fields (`discountPercent`, `specialPrice`) available on `ReturnEquipmentWrite` are **not sent** to the return endpoint — the backend applies them from the rental record server-side.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/rental-dashboard.mapper.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Step A — Confirm `toReturnRequest` sends only the three required fields

Open `projects/shared/src/core/mappers/rental-dashboard.mapper.ts` and confirm the method already reads exactly as shown below. **No code change is required** if it already matches.

```typescript
  static
toReturnRequest(w
:
ReturnEquipmentWrite, operatorId
:
string
):
ReturnEquipmentRequest
{
  return {
    rentalId: w.rentalId,
    equipmentIds: w.equipmentItemIds,
    operatorId,
  };
}
}
```

Do **not** add `discountPercent` or `specialPrice` to this return object. Those fields exist on `ReturnEquipmentWrite` to support a future API extension but are deliberately omitted from the request body.

## 4. Validation Steps

skip
