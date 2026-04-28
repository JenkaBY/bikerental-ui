# User Story: FR-06 — Customer Account Tab

## 1. Description

**As an** admin user
**I want to** see a customer's wallet balances and top up or withdraw money from their account via dialogs
**So that** I can manage a customer's available funds directly from the account tab

## 2. Context & Business Rules

* **Trigger:** User activates the Account tab at `/customers/:id/account`
* **Rules Enforced:**
  * Balance values are passed into this component via `input()` signals from the shell — the tab does NOT call `FinanceService.getBalances()` on its own on initial load
  * Both fields are read-only; Reserved balance has no edit action
  * **"Top Up" button** opens `TopUpDialogComponent` via `MatDialog` (defined in FR-08)
  * **"Withdraw" button** opens `WithdrawDialogComponent` via `MatDialog` (defined in FR-09); only enabled when `available` balance > 0
  * On either dialog close with result `true`: notify the shell to re-fetch balances via an `output()` event; show success snackbar
  * On dialog close with `undefined`/`false` (cancelled or errored inside dialog): no balance refresh

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Balances are pre-loaded by the shell; the Account tab renders immediately with no additional HTTP call on activate; re-fetch only triggered after a successful Top Up
* **Security/Compliance:** N/A
* **Usability/Other:** Amounts formatted with 2 decimal places and currency symbol (locale-aware)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Balances display on tab activate**

* **Given** the shell has fetched balances and passes them via `input()` signals
* **When** the user opens the Account tab
* **Then** Available balance and Reserved balance are shown immediately, formatted with 2 decimal places

**Scenario 2: Top Up dialog opens on button click**

* **Given** the user is on the Account tab
* **When** the user clicks "Top Up"
* **Then** the `TopUpDialogComponent` dialog opens

**Scenario 2a: Withdraw dialog opens on button click**

* **Given** the user is on the Account tab and available balance is greater than 0
* **When** the user clicks "Withdraw"
* **Then** the `WithdrawDialogComponent` dialog opens

**Scenario 2b: Withdraw button disabled when balance is zero**

* **Given** the available balance is `0`
* **When** the Account tab renders
* **Then** the "Withdraw" button is disabled

**Scenario 3: Balances refresh in shell after successful Top Up or Withdrawal**

* **Given** either the Top Up or Withdraw dialog closes with result `true`
* **When** the dialog result is processed
* **Then** the shell re-fetches balances via `FinanceService.getBalances()`, the header and Account tab update with fresh values, and a success snackbar is shown

**Scenario 4: No refresh on dialog cancel**

* **Given** the Top Up dialog is open
* **When** the user cancels the dialog
* **Then** the dialog closes, balances are NOT re-fetched, and no snackbar is shown

**Scenario 5: Balance placeholder when shell fetch failed**

* **Given** the shell's `getBalances` call failed (error handled in FR-03)
* **When** the user opens the Account tab
* **Then** balance fields show a dash (`—`) placeholder; the Top Up button remains available

## 5. Out of Scope

* Adjustments or chargebacks from this tab
* Editing the reserved balance
* Balance history (covered in FR-07 Transactions tab)
