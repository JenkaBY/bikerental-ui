# User Story: FR-06 — Step 3: Confirmation & Start Rental

## 1. Description

**As an** operator
**I want to** review a read-only summary of all rental parameters and start the rental with a single tap when the customer's balance is sufficient
**So that** I can verify all details before committing, and the rental becomes active immediately upon confirmation

## 2. Context & Business Rules

* **Trigger:** Operator advances from Step 2 (auto-save has already been triggered by the store)
* **Rules Enforced:**
  * The step is entirely read-only — no fields are editable; the operator must go back to Step 2 to make changes
  * The summary displays all of the following:
    * Customer: full name and phone number
    * Duration: formatted as human-readable (e.g. "2 hours", "1 day 30 minutes")
    * Equipment list: each item shows UID and model
    * Pricing: discount percentage (if applied) OR special price amount (if special price mode was active); subtotal and total cost
    * Projected balance after payment
  * **Balance check:**
    * If `isBalanceSufficient` is `true` in the store: the "Start Rental" primary button is enabled
    * If `isBalanceSufficient` is `false`: the "Start Rental" button is disabled and a warning section is shown that includes the shortfall amount and a "Top Up Balance" button
    * The "Top Up Balance" button opens the `BalanceTopUpDialog`; after a successful top-up the balance and `isBalanceSufficient` are re-evaluated
  * **Start Rental action:**
    * Calls `RentalStore.activateRental()` which calls `POST /api/rentals` with the `CreateRentalRequest` built by `RentalMapper.toCreateRequest()`
    * The button is disabled and shows a spinner while the call is in flight
    * On success: store is reset, a success snackbar "Rental started" is shown, and the router navigates to `/dashboard`
    * On error: a snackbar error message is shown; the button is re-enabled; the operator remains on Step 3

## 3. Non-Functional Requirements (NFRs)

* **Performance:** No additional API calls on rendering this step; all data comes from the store's signals; cost estimate was already loaded in Step 2
* **Security/Compliance:** N/A
* **Usability/Other:** "Start Rental" button uses the primary colour and is visually prominent; it occupies full width on mobile; it must be at least 48 px tall

## 4. Acceptance Criteria (BDD)

**Scenario 1: Summary displays all rental parameters**

* **Given** the operator advances to Step 3 with customer "Anna +79001234567", duration 60 min, equipment `[{uid: 'ABC', model: 'Trek FX3'}]`, discount 10%, total cost 180
* **When** Step 3 renders
* **Then** all these values are visible in the summary in a read-only format

**Scenario 2: Start Rental button is enabled when balance is sufficient**

* **Given** the customer's available balance is 500 and the total cost is 180
* **When** Step 3 renders
* **Then** the "Start Rental" button is enabled and no insufficient-balance warning is shown

**Scenario 3: Start Rental button is disabled when balance is insufficient**

* **Given** the customer's available balance is 100 and the total cost is 200
* **When** Step 3 renders
* **Then** the "Start Rental" button is disabled, a warning shows the shortfall of 100, and a "Top Up Balance" button is visible

**Scenario 4: Top Up from Step 3 re-evaluates balance**

* **Given** balance is insufficient and the "Top Up Balance" button is shown
* **When** the operator taps the button, tops up 150 via the dialog, and the dialog closes successfully
* **Then** the projected balance is recalculated and if now sufficient, the "Start Rental" button becomes enabled

**Scenario 5: Successful rental activation navigates to dashboard**

* **Given** the balance is sufficient and the operator taps "Start Rental"
* **When** `POST /api/rentals` succeeds
* **Then** the store is reset, a "Rental started" snackbar appears, and the operator is navigated to `/dashboard`

**Scenario 6: Activation failure keeps operator on Step 3**

* **Given** the operator taps "Start Rental"
* **When** the API returns an error
* **Then** a snackbar error is shown, the "Start Rental" button is re-enabled, and the operator remains on Step 3

**Scenario 7: Back navigation returns to Step 2 with unchanged data**

* **Given** the operator is on Step 3
* **When** the operator taps "Back"
* **Then** the stepper returns to Step 2 with all previously entered values intact

## 5. Out of Scope

* Editing any rental parameter from this step
* Selecting a payment method for the rental itself (payment is deducted from the customer wallet)
* Recording a separate prepayment transaction from this step
* Cancelling the draft from this step
