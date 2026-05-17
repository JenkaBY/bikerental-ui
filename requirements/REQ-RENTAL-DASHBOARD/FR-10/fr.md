# User Story: FR-10 — Rental Detail — Return Pricing Section

## 1. Description

**As an** operator
**I want to** adjust the discount percentage or switch to a fixed special price before
returning equipment, using the same pricing controls as the Create Rental flow
**So that** I can apply a farewell discount or override the calculated price at the moment
of return without navigating to a separate screen

## 2. Context & Business Rules

* **Trigger:** Rental detail data has loaded, `isActive === true`, and the Return
  Pricing section is rendered
* **Rules Enforced:**
  * The section is **not rendered** when `isDebt === true` (rental is already closed;
    pricing changes are not applicable)
  * The section **reuses the existing `RentalPricingSectionComponent`**
    (`app-rental-pricing-section`) from the Create Rental flow — it is not reimplemented
  * The `RentalPricingSectionComponent` injects `RentalStore` by DI token; the Rental
    Detail feature must provide a compatible store that exposes the same pricing-related
    signals and methods:
    - `specialPriceEnabled(): boolean`
    - `isSelectedAnyEquipment(): boolean`
    - `specialPrice(): number | null`
    - `discountPercent(): number | null`
    - `setSpecialPriceEnabled(value: boolean): void`
    - `setSpecialPrice(value: number | null): void`
    - `setDiscountPercent(value: number | null): void`
  * **DI pattern**: `RentalPricingSectionComponent` currently calls `inject(RentalStore)` directly; the same injection token approach described in FR-07 applies: define a `RENTAL_PRICING_STORE_TOKEN` (or share a single comprehensive token) so the component can be provided with any compatible implementation; this token is defined once and reused for both `RentalCustomerPanelComponent` and `RentalPricingSectionComponent`
  * The section title "Return pricing" appears above the `RentalPricingSectionComponent`
    host element as a static label
  * Pricing changes made in this section are **not sent to the API immediately**; they
    are held in the detail store's local state and submitted together when the operator
    taps "Return equipment" (FR-12)
  * When special price mode is active (`specialPriceEnabled() === true`) and
    `specialPrice() === null`, both action buttons at the bottom of the screen ("Return
    equipment" and "Cancel rental") are disabled — this rule is enforced by FR-12, not
    by this section itself
  * The section is separated from adjacent sections by a divider

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Pricing state changes are purely synchronous signal updates; no API
  calls are triggered by this section alone
* **Security/Compliance:** N/A
* **Usability/Other:** The reused component must function identically to its behavior in
  the Create Rental flow; no visual or behavioral divergence is permitted

## 4. Acceptance Criteria (BDD)

**Scenario 1: Section is hidden for debt rentals**

* **Given** a rental with `isDebt: true`
* **When** the detail page renders
* **Then** the Return Pricing section is not present in the DOM

**Scenario 2: Section is visible for active rentals**

* **Given** a rental with `isActive: true`
* **When** the detail page renders
* **Then** the "Return pricing" label and the `app-rental-pricing-section` component are
  visible

**Scenario 3: Discount input updates store locally**

* **Given** the detail store has `discountPercent: null` and `specialPriceEnabled: false`
* **When** the operator enters "10" in the discount input
* **Then** the detail store's `discountPercent` signal becomes `10`; no API call is made

**Scenario 4: Toggling special price hides discount row**

* **Given** `specialPriceEnabled: false` and the discount row is visible
* **When** the operator activates the special price toggle
* **Then** the discount row disappears and the special price input appears (behavior
  inherited from `RentalPricingSectionComponent`)

**Scenario 5: Pricing state is submitted with Return action**

* **Given** the detail store has `discountPercent: 15` and `specialPriceEnabled: false`
* **When** the operator taps "Return equipment" (FR-12)
* **Then** `ReturnEquipmentWrite.discountPercent` is `15` and `ReturnEquipmentWrite.specialPrice`
  is `undefined` in the submitted payload

## 5. Out of Scope

* Reimplementing discount or special price inputs (existing `RentalPricingSectionComponent`
  is reused)
* Applying pricing changes in real-time to the current cost display (cost calculation
  for active rentals is a one-time mount call per FR-09)

## 6. Screen Specification

### Layout

```
┌──────────────────────────────────────────────┐
│  Return pricing                              │  ← Static section label
│  ┌──────────────────────────────────────┐   │
│  │  app-rental-pricing-section          │   │  ← Reused component (discount/special price)
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Elements

| Element                      | Position                        | Description                                                                                  |
|------------------------------|---------------------------------|----------------------------------------------------------------------------------------------|
| "Return pricing" label       | Section header, top             | Static section title                                                                         |
| `app-rental-pricing-section` | Below section label, full width | Reused component; provides discount % input or special price input depending on toggle state |

### Transitions

All internal transitions (discount ↔ special price toggle) are handled by the reused
`RentalPricingSectionComponent` and are documented in that component's own specification.
