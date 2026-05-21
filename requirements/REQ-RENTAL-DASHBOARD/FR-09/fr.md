# User Story: FR-09 — Rental Detail — Current Cost Section

## 1. Description

**As an** operator
**I want to** see the calculated cost for any rental on the Rental Detail screen, with a
toggle to expand a per-equipment breakdown
**So that** I can tell the customer the total price at any moment and verify the per-item
charges regardless of the rental's current status

## 2. Context & Business Rules

* **Trigger:** Rental detail data has loaded and the Cost section is rendered
* **Rules Enforced:**
  * A new dedicated **`RentalCostSectionComponent`** is created for this section; it is
    not shared with the Create Rental flow
  * The section is displayed for **all rental statuses except DRAFT**
  * On mount, the component calls the cost calculation API
    (`POST /api/tariffs/calculate`) once with a request built from `RentalDetail`:
    - `equipments`: one `{ equipmentType }` entry per equipment item in
      `RentalDetail.equipmentItems` (using `categorySlug` as the type)
    - For **ACTIVE** rentals: populate `plannedDurationMinutes` with
      `RentalDetail.plannedDurationMinutes`; omit `actualDurationMinutes`
    - For **closed** rentals (DEBT, COMPLETED, CANCELLED): populate
      `actualDurationMinutes` with `RentalDetail.paidDurationMinutes`; omit
      `plannedDurationMinutes`
    - Discount and special-price fields are forwarded from the Return Pricing section
      state (FR-10) if present; otherwise omitted
  * **Reuse**: `RentalCostEstimate` from `core/models/rental-create.model.ts` is the existing cost type; it exposes `subtotal`, `totalCost`, `discountAmount`, `discountPercent`, `specialPricingApplied`, and `equipmentBreakdowns` — use it directly; do NOT define a new cost type
  * **Reuse**: `RentalMapper.fromCostResponse(response: CostCalculationResponse): RentalCostEstimate` from `core/mappers/rental.mapper.ts` converts the generated API response to the domain type; the component (or its local store) calls this method
  * **Reuse**: The calculation API call uses `TariffsService.calculateCost()` from `core/api/generated/services/`; this is the same service used by `RentalCostCalculationStore`, but the detail component does NOT reuse `RentalCostCalculationStore` directly because that store derives its params from `RentalStore` (create-flow state); instead the detail component makes a one-time call on mount using `rxResource` or a simple `effect`
  * `CostCalculationRequest.actualDurationMinutes` (existing generated field) is used for closed rentals; `CostCalculationRequest.plannedDurationMinutes` (existing generated field) is used for active rentals
  * Section label:
    - `"Current cost"` when the API response has `estimate: true`
    - `"Final cost"` when the API response has `estimate: false`
  * Section header layout (top of section, horizontal row):
    - Left: section label
    - Right: "Show details ▾" / "Collapse ▴" toggle button, aligned to the top of the
      section
  * Below the header: `CostCalculationResponse.totalCost` displayed large and bold
  * A loading spinner replaces the total amount while the API call is in flight
  * Details panel (collapsed by default):
    - Expands below the total amount when the toggle is tapped
    - One row per entry in `RentalDetail.equipmentItems`; the matching breakdown is
      looked up by `RentalEquipmentItem.categorySlug` as the key into
      `CostCalculationResponse.equipmentBreakdowns`:
      `{RentalEquipmentItem.name}  ·  {equipmentBreakdowns[equipmentType].calculationBreakdown.message}`
      (full breakdown detail implementation is deferred; `calculationBreakdown.message`
      is the placeholder output for this release)
    - Subtotal row (always shown): `Subtotal  {CostCalculationResponse.subtotal}` —
      cost before any discount or special price
    - Discount row (shown conditionally):
      - Shown when `CostCalculationResponse.discount?.percent` is non-null:
        `Discount  −{discount.percent}%  (−{discount.amount})`
      - Shown when `CostCalculationResponse.specialPricingApplied === true`:
        `Special price  applied`
      - Hidden when neither condition is met
    - Last row (always shown, with a top divider):
      `Total  {CostCalculationResponse.totalCost}` — final cost after discount or
      special price
  * The toggle label changes: "Show details ▾" when collapsed, "Collapse ▴" when expanded
  * The section is separated from adjacent sections by a divider

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The cost calculation API is called exactly once on mount; it must NOT
  recalculate on every render cycle or on every change detection pass
* **Security/Compliance:** N/A
* **Usability/Other:** The total amount must be the most visually prominent element in this
  section; breakdown rows use a smaller, secondary text style; the loading spinner must
  not cause layout shift

## 4. Acceptance Criteria (BDD)

**Scenario 1: Active rental triggers estimated cost calculation**

* **Given** a rental with `isActive: true`, `plannedDurationMinutes: 60`, and two
  equipment items
* **When** the Cost section mounts
* **Then** `POST /api/tariffs/calculate` is called once with `plannedDurationMinutes: 60`
  and two equipment entries; `actualDurationMinutes` is absent from the request

**Scenario 2: Closed rental triggers final cost calculation**

* **Given** a rental with `isDebt: true` and `paidDurationMinutes: 75`
* **When** the Cost section mounts
* **Then** `POST /api/tariffs/calculate` is called once with `actualDurationMinutes: 75`;
  `plannedDurationMinutes` is absent from the request

**Scenario 3: Section label reflects estimate flag**

* **Given** the API responds with `estimate: true`
* **When** the cost section renders the result
* **Then** the section label reads "Current cost"

**Scenario 4: Section label shows "Final cost" for non-estimate response**

* **Given** the API responds with `estimate: false`
* **When** the cost section renders the result
* **Then** the section label reads "Final cost"

**Scenario 5: Total amount displayed large and bold**

* **Given** the API responds with `totalCost: 180`
* **When** the cost section renders
* **Then** "180 BYN" (or equivalent formatted amount) is displayed large and bold below
  the section label

**Scenario 6: Loading spinner shown while API call is in flight**

* **Given** the cost section has mounted and the API call has not yet returned
* **When** the section renders
* **Then** a loading spinner is visible in place of the total amount

**Scenario 7: Details panel is collapsed by default**

* **Given** any rental detail page
* **When** the Cost section first renders
* **Then** the breakdown panel is not visible; the toggle shows "Show details ▾"

**Scenario 8: Tapping toggle expands the breakdown**

* **Given** the details panel is collapsed and the API result is available
* **When** the operator taps "Show details ▾"
* **Then** the breakdown panel expands with one row per `equipmentBreakdowns` entry and
  a grand total row; the toggle label changes to "Collapse ▴"

**Scenario 9: Breakdown per-item row shows name and calculation message**

* **Given** `equipmentBreakdowns['bike']` has `calculationBreakdown.message: '1 h × 150/h'`
  and the corresponding `RentalEquipmentItem` has `name: 'Trek FX3'` and
  `categorySlug: 'bike'`
* **When** the breakdown panel is expanded
* **Then** the first row shows "Trek FX3 · 1 h × 150/h"

**Scenario 10: Subtotal row always shown in breakdown**

* **Given** `CostCalculationResponse.subtotal: 180`
* **When** the breakdown panel is expanded
* **Then** a "Subtotal 180 BYN" row is visible above the discount and total rows

**Scenario 11: Discount row shown when discount percent is non-null**

* **Given** `CostCalculationResponse.discount: { percent: 10, amount: 18 }` and
  `specialPricingApplied: false`
* **When** the breakdown panel is expanded
* **Then** a row shows "Discount −10%  (−18 BYN)"

**Scenario 12: Special price row shown when specialPricingApplied is true**

* **Given** `CostCalculationResponse.specialPricingApplied: true` and `discount` is null
* **When** the breakdown panel is expanded
* **Then** a row shows "Special price applied"; no discount row is present

**Scenario 13: Discount row hidden when no discount or special price**

* **Given** `CostCalculationResponse.discount` is null and `specialPricingApplied: false`
* **When** the breakdown panel is expanded
* **Then** neither a discount row nor a special price row is visible

**Scenario 14: Total row always last with top divider**

* **Given** `CostCalculationResponse.totalCost: 162`
* **When** the breakdown panel is expanded
* **Then** the last row shows "Total 162 BYN" preceded by a top divider

**Scenario 10: API not called for DRAFT rentals**

* **Given** a rental with `status: 'DRAFT'`
* **When** the Rental Detail page renders
* **Then** the Cost section is not present in the DOM; no API call is made

## 5. Out of Scope

* Editing cost parameters (covered by FR-10)
* DRAFT rental cost display (explicitly out of scope)
* Real-time recalculation as time passes (cost is calculated once on mount)

## 6. Screen Specification

### Layout — Loading

```
┌──────────────────────────────────────────────┐
│  Current cost               [Show details ▾] │  ← Header row (label before response)
│  [ spinner ]                                 │  ← Loading state
└──────────────────────────────────────────────┘
```

### Layout — Collapsed

```
┌──────────────────────────────────────────────┐
│  Current cost               [Show details ▾] │  ← "Current cost" when estimate: true
│  180.00 BYN                                  │  ← Total (large, bold)
└──────────────────────────────────────────────┘
```

### Layout — Expanded

```
┌──────────────────────────────────────────────┐
│  Final cost                 [Collapse ▴]     │  ← "Final cost" when estimate: false
│  162.00 BYN                                  │  ← Total (large, bold)
│  ───────────────────────────────────────────   │
│  Trek FX3  ·  1 h × 150/h                  │  ← Item row: name · message
│  Helmet    ·  1 h flat rate                │
│  ───────────────────────────────────────────   │
│  Subtotal                         180 BYN   │  ← Always shown
│  Discount  −10%  (−18 BYN)                 │  ← Shown when discount.percent non-null
│  ───────────────────────────────────────────   │  ← Divider before total
│  Total                            162 BYN   │  ← Always last
└──────────────────────────────────────────────┘
```

### Elements

| Element                                | Position                                                  | Description                                                                                                                          |
|----------------------------------------|-----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Section label                          | Header, left                                              | "Current cost" (`estimate: true`) or "Final cost" (`estimate: false`)                                                                |
| "Show details ▾" / "Collapse ▴" toggle | Header, right                                             | Toggles breakdown panel visibility                                                                                                   |
| Total amount / spinner                 | Below header, left                                        | `totalCost` large and bold; spinner while loading                                                                                    |
| Breakdown row                          | Inside panel, one per `RentalDetail.equipmentItems` entry | `{RentalEquipmentItem.name} · {equipmentBreakdowns[equipmentType].calculationBreakdown.message}` — lookup key is `categorySlug`      |
| Subtotal row                           | Inside panel, below item rows                             | `Subtotal  {subtotal}` — always shown                                                                                                |
| Discount row                           | Inside panel, below subtotal                              | `Discount  −N%  (−amount)` when `discount.percent` non-null; `Special price  applied` when `specialPricingApplied`; hidden otherwise |
| Total row                              | Last row inside panel, with top divider                   | `Total  {totalCost}` — always last                                                                                                   |

### Transitions

| Interaction          | Outcome                                                                 |
|----------------------|-------------------------------------------------------------------------|
| Component mounts     | `POST /api/tariffs/calculate` called once; spinner shown until response |
| Tap "Show details ▾" | Breakdown panel expands; label becomes "Collapse ▴"                     |
| Tap "Collapse ▴"     | Breakdown panel collapses; label becomes "Show details ▾"               |
