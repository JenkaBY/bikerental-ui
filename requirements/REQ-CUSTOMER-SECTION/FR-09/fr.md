# User Story: FR-09 — Withdraw Dialog

## 1. Description

**As an** admin user
**I want to** enter a withdrawal amount and payout method in a dialog
**So that** funds are deducted from a customer's available balance and the transaction is recorded immediately

## 2. Context & Business Rules

* **Trigger:** User clicks "Withdraw" on the Account tab
* **Rules Enforced:**
  * Dialog is opened by the Account tab component via `MatDialog.open(WithdrawDialogComponent, { data: { customerId, availableBalance } })`
  * Fields:
    - **Amount** (required): positive number only; minimum value 0.01; must not exceed `availableBalance` passed in dialog data; shown as a `mat-form-field` number input
    - **Payout method** (required): `mat-select` with options: CASH, CARD_TERMINAL, BANK_TRANSFER
  * Confirm button disabled when form is invalid
  * On Confirm: calls `FinanceService.recordWithdrawal(RecordWithdrawalRequest)` where:
    - `customerId` comes from dialog data
    - `idempotencyKey` is a client-generated UUID (generated once when dialog opens, never regenerated)
    - `amount` and `paymentMethod` come from the form
  * On HTTP success: close dialog with `true`; this signals the Account tab to trigger a balance refresh in the shell
  * On HTTP error: show error `MatSnackBar` inside the dialog; do NOT close the dialog
  * Cancel button always closes dialog with `undefined`

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — single API call on confirm
* **Security/Compliance:** `idempotencyKey` is a UUID generated client-side to prevent duplicate withdrawals on retry; it must not be re-generated after the dialog opens
* **Usability/Other:** Loading state on the Confirm button while the HTTP call is in flight; button re-enabled on error; `availableBalance` displayed as a hint below the amount field so the user knows the ceiling

## 4. Acceptance Criteria (BDD)

**Scenario 1: Dialog opens with empty form and balance hint**

* **Given** the user clicks "Withdraw" and the available balance is `150.00`
* **When** the dialog opens
* **Then** the amount field is empty, no payout method is pre-selected, Confirm is disabled, and a hint shows the available balance (`150.00`)

**Scenario 2: Amount validation — zero or negative**

* **Given** the user enters 0 or a negative number in the amount field
* **When** the amount field is blurred
* **Then** a validation error is shown and Confirm remains disabled

**Scenario 3: Amount validation — exceeds available balance**

* **Given** the available balance passed in dialog data is `150.00`
* **When** the user enters `200.00` in the amount field
* **Then** a validation error "Amount exceeds available balance" is shown and Confirm remains disabled

**Scenario 4: Successful withdrawal triggers balance refresh**

* **Given** the user enters a valid amount not exceeding available balance and selects a payout method
* **When** the user clicks Confirm and the API returns 200/201
* **Then** the dialog closes with result `true` and the Account tab triggers a balance refresh in the shell

**Scenario 5: API error keeps dialog open**

* **Given** the user submits a valid form and the API returns a 4xx/5xx error
* **When** the response is received
* **Then** the dialog remains open, an error snackbar is shown, and the Confirm button is re-enabled

**Scenario 6: Cancel closes dialog**

* **Given** the dialog is open with or without form values
* **When** the user clicks Cancel
* **Then** the dialog closes with `undefined` and no API call is made

**Scenario 7: idempotency key is stable**

* **Given** the dialog has opened and an idempotency key was generated
* **When** the user submits the form multiple times (e.g. after an error)
* **Then** the same idempotency key is used in every `RecordWithdrawalRequest` for that dialog session

## 5. Out of Scope

* Deposit / top-up operations (covered in FR-08)
* Operator ID field (not exposed in this section)
* Partial withdrawal against reserved balance
