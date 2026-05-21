# Task 002: Add i18n Labels for FR-09

> **Applied Skill:** `angular.instructions.md` — All visible text must use Angular's `$localize`. New UI labels are added to `shared/constant/labels.ts` as static readonly properties of the `Labels` class.

## 1. Objective

Add eight new label constants to `Labels` required by `RentalCostSectionComponent`: section header labels, detail toggle labels, and breakdown row labels.

## 2. File to Modify

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

**Location:** At the end of the `Labels` class body, immediately before the final closing `}` of the class (after the existing `static readonly Retry = $localize\`Retry\`;` line).

**Code to Add:**

```typescript
  static readonly CurrentCost = $localize`Current cost`;
  static readonly FinalCost = $localize`Final cost`;
  static readonly ShowDetails = $localize`Show details`;
  static readonly CollapseDetails = $localize`Collapse`;
  static readonly Subtotal = $localize`Subtotal`;
  static readonly DiscountLabel = $localize`Discount`;
  static readonly Total = $localize`Total`;
  static readonly SpecialPriceApplied = $localize`Special price applied`;
```

---

## 4. Validation Steps

skip
