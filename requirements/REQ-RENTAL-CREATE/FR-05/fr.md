# User Story: FR-05 — Step 2: Rental Parameters

## 1. Description

**As an** operator
**I want to** configure the rental duration, add equipment items, set a discount or special price, and see the live total cost and projected balance — all while the step auto-saves as a draft
**So that** I can set up the rental completely before confirming, and return to it later if I am interrupted

## 2. Context & Business Rules

* **Trigger:** Operator advances from Step 1 with a customer selected
* **Rules Enforced:**
  * **Customer context panel** — displayed at the top of the step; shows the selected customer's full name (or phone if no name), available balance, and a "Top Up" button that opens the `BalanceTopUpDialog`; balance refreshes automatically after a successful top-up
  * **Duration control:**
    * Fixed snap points: `30`, `60`, `120`, `240`, `480`, `1440`, `2880` minutes
    * A `mat-slider` with discrete steps snapping to these points
    * A numeric `mat-form-field` input showing the current value in minutes; operator may type a value — on blur or Enter, the value is rounded to the nearest snap point
    * Both controls are always in sync; changing one updates the other immediately
    * Minimum: 30 min; maximum: 2880 min (2 days)
  * **Equipment section:**
    * A `mat-autocomplete` dropdown that queries `GET /api/equipment?search={query}&status=available` by UID and model name; minimum query length 2 characters; debounced 300 ms
    * A placeholder "Scan QR" icon button is rendered next to the input but is disabled and shows a "coming soon" tooltip
    * Each selected item is shown as a row with: UID, model, type; and a remove (`×`) button
    * The same equipment item cannot be added twice; the dropdown excludes already-selected IDs
    * At least one equipment item is required to proceed to Step 3
  * **Pricing section:**
    * Three mutually exclusive price modes, switched via a compact, always-visible segmented
      control embedded in the sticky footer next to the total: **Full price** (default, no
      adjustment), **Discount**, **Fixed price**
    * **Full price** — no discount, no override; this is the mode on entry to Step 2 and after
      a full reset
    * **Discount mode** — a percentage input (`0–100`, clamped) is embedded directly in the
      "Total" row; default `0`; once the estimate returns, the row reads as a single
      right-aligned formula `subtotal − discount% = total`
    * **Fixed price mode** — the "Total" row itself becomes an input field; it is prefilled with
      the system-calculated full price (`RentalCostEstimate.subtotal`) for the current
      duration/equipment; the operator may replace it with any value `≥ 0`
      * `specialTariffId` is resolved from the store (loaded on init per FR-02 business rules)
      * Advancing to Step 3 and saving the draft are both blocked only while the field is
        genuinely empty — `0` is a valid fixed price and does not block
    * Switching modes clears the values owned by the mode being left (discount percent when
      leaving Discount, fixed price when leaving Fixed) so state never carries over between
      mutually exclusive modes
    * The segmented control is always visible; the **Discount** and **Fixed price** tabs are
      disabled while no equipment is selected (nothing to price yet), and removing the last
      equipment item switches the mode back to **Full price**
    * The control itself (`RentalPriceControlComponent`, `projects/operator/src/app/pricing/`) is
      presentational — `[value]`/`(valueChange)` on a `RentalPricingDraft`, no store injected — so
      it is reused as-is by the active-rental "Change price" bottom sheet (see
      `REQ-RENTAL-PRICING-UPDATE`); this step's footer owns the binding to `RentalStore`
  * **Always-visible sticky footer:**
    * Displays: calculated total cost and projected balance after payment
    * When `costEstimate` is loading, a spinner replaces the total cost value
    * When balance is insufficient, a warning chip/badge is shown; the "Next" button is disabled
  * **Draft management:**
    * Auto-save fires when the operator taps "Next" (before advancing to Step 3)
    * A "Save Draft" button triggers manual save; it is disabled while a save is in progress
    * On successful save, a snackbar confirms "Draft saved"; `id` is set in the store

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Equipment search results are debounced at 300 ms and limited to the first page (max 20 items); cost recalculation is debounced at 400 ms
* **Security/Compliance:** N/A
* **Usability/Other:** All interactive elements have ≥ 48 px touch targets; the sticky footer must not obscure the last form field on small screens (add bottom padding equal to footer height); the step scrolls independently of the footer

## 4. Acceptance Criteria (BDD)

**Scenario 1: Duration slider and numeric input stay in sync**

* **Given** the duration slider is at 60 minutes
* **When** the operator types `120` in the numeric input and presses Enter
* **Then** the slider snaps to the 120-minute position and `RentalStore.durationMinutes` updates to `120`

**Scenario 2: Numeric input value snaps to nearest snap point**

* **Given** the operator types `90` in the duration input
* **When** focus leaves the field
* **Then** the value is rounded to `120` (the nearest snap point) and the slider moves accordingly

**Scenario 3: Equipment item is added from the dropdown**

* **Given** the operator types `'Trek'` in the equipment search input
* **When** results appear and the operator selects `'Trek FX3 (ABC12)'`
* **Then** the item is added to the equipment list and removed from subsequent dropdown results

**Scenario 4: Equipment item is removed**

* **Given** one equipment item is in the list
* **When** the operator taps the remove button on that item
* **Then** the item is removed from the list and `canProceedFromStep2` becomes `false`

**Scenario 5: Fixed price mode blocks proceed when price is empty**

* **Given** Fixed price mode is active and the price field is empty
* **When** the operator taps "Next"
* **Then** the step remains on Step 2 and the "Next" button is disabled; a fixed price of `0` is
  valid and does **not** block

**Scenario 6: Switching to Fixed price mode clears the discount**

* **Given** a discount of 15 % was entered in Discount mode
* **When** the operator switches to Fixed price mode
* **Then** the discount input is replaced by the fixed price field, prefilled with the calculated
  subtotal; the discount value in the store is cleared

**Scenario 7: Cost estimate updates after adding equipment**

* **Given** the store has a 60-minute duration and no equipment
* **When** the operator adds one equipment item
* **Then** after the debounce period, `TariffsService.calculateCost()` is called and the footer shows the updated total cost

**Scenario 8: Auto-save fires when tapping "Next"**

* **Given** the step is valid (equipment present, special price filled if enabled)
* **When** the operator taps "Next"
* **Then** `RentalStore.save()` is called; on success, the stepper advances to Step 3

**Scenario 9: Insufficient balance warning is shown**

* **Given** the customer's available balance is 100 and the total cost estimate is 200
* **When** Step 2 renders the footer
* **Then** an insufficient-balance warning is visible and the "Next" button is disabled

## 5. Out of Scope

* QR code scanning (placeholder button only)
* Editing the selected customer from this step
* Selecting a specific tariff manually (tariff is auto-selected by the backend)
* Adding rental notes or comments
