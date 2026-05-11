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
    * Default mode: an optional discount percentage input (`0–100`); empty means no discount
    * A "Special price" toggle switch; when enabled:
      * The discount input is hidden
      * A required price input field appears (positive number, currency format)
      * Advancing to Step 3 and saving the draft are both blocked until the field is filled
      * `specialTariffId` is resolved from the store (loaded on init per FR-02 business rules)
    * When special price mode is toggled off, the special price field value is cleared
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

**Scenario 5: Special price mode blocks proceed when price is empty**

* **Given** the "Special price" toggle is enabled and the price field is empty
* **When** the operator taps "Next"
* **Then** the step remains on Step 2; the price field shows a validation error; the "Next" button is disabled

**Scenario 6: Discount mode is hidden when special price is active**

* **Given** a discount of 15 % was entered in default mode
* **When** the operator enables "Special price" mode
* **Then** the discount input is hidden; the discount value in the store is cleared

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
