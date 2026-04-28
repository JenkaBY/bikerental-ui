# User Story: FR-08 — Top Up Dialog

## 1. Description

**As an** admin user
**I want to** enter an amount and payment method in a dialog to top up a customer's wallet
**So that** the customer's available balance increases and the transaction is recorded immediately

## 2. Context & Business Rules

* **Trigger:** User clicks "Top Up" on the Account tab
* **Rules Enforced:**
  * Dialog is opened by the Account tab component via `MatDialog.open(TopUpDialogComponent, { data: { customerId } })`
  * Fields:
    - **Amount** (required): positive number only; minimum value 0.01; shown as a `mat-form-field` number input
    - **Payment method** (required): `mat-select` with options: CASH, BANK_TRANSFER, CARD_TERMINAL
  * Confirm button disabled when form is invalid
  * On Confirm: calls `FinanceService.recordDeposit(RecordDepositRequest)` where:
    - `customerId` comes from dialog data
    - `idempotencyKey` is a client-generated UUID (generated once when dialog opens)
    - `amount` and `paymentMethod` come from the form
  * On HTTP success: close dialog with `true`; this signals the Account tab to trigger a balance refresh in the shell
  * On HTTP error: show error `MatSnackBar` inside the dialog; do NOT close the dialog
  * Cancel button always closes dialog with `undefined`

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — single API call on confirm
* **Security/Compliance:** `idempotencyKey` is a UUID generated client-side to prevent duplicate deposits on retry; it must not be re-generated after the dialog opens
* **Usability/Other:** Loading state on the Confirm button while the HTTP call is in flight; button re-enabled on error

## 4. Acceptance Criteria (BDD)

**Scenario 1: Dialog opens with empty form**

* **Given** the user clicks "Top Up"
* **When** the dialog opens
* **Then** the amount field is empty and the payment method has no pre-selection; Confirm is disabled

**Scenario 2: Amount validation — zero or negative**

* **Given** the user enters 0 or a negative number in the amount field
* **When** the amount field is blurred
* **Then** a validation error message is shown and Confirm remains disabled

**Scenario 3: Successful deposit triggers balance refresh**

* **Given** the user enters a valid amount and selects a payment method
* **When** the user clicks Confirm and the API returns 200/201
* **Then** the dialog closes with result `true` and the Account tab triggers a balance refresh in the shell

**Scenario 4: API error keeps dialog open**

* **Given** the user submits a valid form and the API returns a 4xx/5xx error
* **When** the response is received
* **Then** the dialog remains open, an error snackbar is shown, and the Confirm button is re-enabled

**Scenario 5: Cancel closes dialog**

* **Given** the dialog is open with or without form values
* **When** the user clicks Cancel
* **Then** the dialog closes with `undefined` and no API call is made

**Scenario 6: idempotency key is stable**

* **Given** the dialog has opened and an idempotency key was generated
* **When** the user submits the form multiple times (e.g. after an error)
* **Then** the same idempotency key is used in every `RecordDepositRequest` for that dialog session

## 5. Out of Scope

* Withdrawal or adjustment operations
* Operator ID field (not exposed in this section)
* Pre-filling amount from URL or external state
