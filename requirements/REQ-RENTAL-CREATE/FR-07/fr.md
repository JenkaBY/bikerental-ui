# User Story: FR-07 — Balance Top-Up Dialog (Reuse Existing)

## 1. Description

**As a** developer
**I want to** move the existing `TopUpDialogComponent` from the admin project to the `shared` library and adapt it so it can be opened from both the admin and operator applications
**So that** the operator can top up a customer's balance from within the Create Rental flow without duplicating the dialog implementation

## 2. Context & Business Rules

* **Trigger:** Operator taps the "Top Up" button on the customer context panel in Step 2, or taps "Top Up Balance" in Step 3
* **Rules Enforced:**
  * The existing `TopUpDialogComponent` currently lives at `projects/admin/src/app/customers/dialogs/top-up-dialog/`; it must be **moved** to `projects/shared/src/shared/components/top-up-dialog/` and exported from `projects/shared/src/public-api.ts`
  * The admin application must be updated to import `TopUpDialogComponent` from `@bikerental/shared` instead of the local path
  * The current dependency on `CustomerFinanceStore` (admin-specific) must be replaced with direct injection of `FinanceService` (from `core/api/generated/services/finance.service.ts`), so the component is no longer bound to any project-specific store
  * All other behaviour and the component's public API remain unchanged:
    * Dialog receives `customerId: string` via `MAT_DIALOG_DATA`
    * Amount field is required, positive number (> 0)
    * Payment method is required; defaults to `CASH`; available options: `CASH`, `CARD_TERMINAL`, `BANK_TRANSFER` (rendered via the existing `PaymentMethodSelectComponent`)
    * An `idempotencyKey` UUID is generated once per dialog instance (on construction) using `uuid()`
    * On "Confirm": calls `POST /api/finance/deposits`; on success closes with `true`; on error shows snackbar and keeps the form open
    * On "Cancel": closes with `undefined`; no API call
    * `disableClose: true` must be set on `MatDialog.open()` calls so the backdrop click does not dismiss the dialog
  * Both Step 2 and Step 3 of the Create Rental flow open the shared `TopUpDialogComponent` and, on `true` result, call `RentalStore`'s customer-balance refresh method

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Single POST call; no polling; no behaviour changes from the existing implementation
* **Security/Compliance:** Idempotency key prevents double-submission; amount and PII are not logged
* **Usability/Other:** No visual or UX change to the dialog; existing i18n labels in `Labels` are already defined and must be retained

## 4. Acceptance Criteria (BDD)

**Scenario 1: Dialog is importable from the shared library in the operator project**

* **Given** the `TopUpDialogComponent` has been moved to `projects/shared/src/shared/components/top-up-dialog/`
* **When** the operator project imports `TopUpDialogComponent` from `@bikerental/shared`
* **Then** the import resolves without error and the dialog opens correctly

**Scenario 2: Admin project continues to work after the move**

* **Given** the admin project previously imported `TopUpDialogComponent` from a local path
* **When** the import is updated to `@bikerental/shared`
* **Then** the admin top-up flow behaves identically to before the refactor

**Scenario 3: Dialog no longer depends on CustomerFinanceStore**

* **Given** the dialog is instantiated in the operator project (which has no `CustomerFinanceStore`)
* **When** the dialog is opened and "Confirm" is tapped with a valid amount and payment method
* **Then** `FinanceService.recordDeposit()` is called directly and the dialog closes with `true` on success

**Scenario 4: Successful top-up triggers balance refresh in the operator flow**

* **Given** the "Top Up" button is tapped from Step 2 or Step 3
* **When** the dialog closes with result `true`
* **Then** the caller refreshes the customer's balance in `RentalStore` and the projected balance in the footer/summary is recalculated

**Scenario 5: Cancel closes dialog without an API call**

* **Given** the dialog is open
* **When** the operator taps "Cancel"
* **Then** the dialog closes with `undefined` and no API call is made

## 5. Out of Scope

* Visual or copy changes to the dialog
* Adding new payment method options beyond the existing three
* Withdrawal flow
* Using the dialog outside the admin and operator projects
