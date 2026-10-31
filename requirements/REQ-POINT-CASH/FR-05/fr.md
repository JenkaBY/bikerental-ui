# User Story: FR-05 — Admin Transfer-to-Bank Dialog with Confirmation

## 1. Description

**As an** admin user
**I want to** transfer an amount from a point's cash drawer or terminal account to the business
bank account through a simple dialog with an explicit confirmation step
**So that** money is moved to the bank quickly and mistakes are caught before they happen

## 2. Context & Business Rules

* **Trigger:** "Сдать в банк" / "Перевести в банк" buttons on the Касса tab (FR-03) or the
  Инкассации tab (FR-04); these are only enabled for active points
* **Rules Enforced:**
  * Transfers are allowed only from an **active** point. The dialog is never opened for a
    temporarily or permanently closed point, and if the backend refuses a transfer because the
    point is not active (e.g. its status changed meanwhile), no transfer happens (see error
    handling below)
  * **Dialog "Перевести в банк / Transfer to bank"** shows (read-only):
    - The point name
    - The source: **Касса / Cash drawer** or **Терминал / Terminal account** — fixed by the button
      that opened the dialog; the admin cannot change it inside the dialog
    - The destination as the generic localized text **"Банковский счёт / Bank account"** — there is
      a single bank account with no name or number shown, and it is never selectable
    - The available balance of the source account
  * **Exactly one input: amount**
    - Required
    - Must be greater than 0
    - Must not exceed the available balance of the source
    - At most two decimal places
  * **"Всё / All"** shortcut fills the amount with the full available balance
  * **"Останется / Remaining: X"** hint shows available − entered amount, updating as the admin
    types (shows the full balance while the amount is empty or invalid)
  * Submit is disabled while the amount is invalid
  * **Confirmation dialog "Перевести в банк? / Transfer to bank?"** opens on submit and shows:
    amount, **Откуда / From** (point + source), **Куда / To** ("Bank account"), **Останется /
    Remaining**; buttons **Назад / Back** (returns to the transfer dialog with the amount kept)
    and **Перевести / Transfer**
  * The transfer executes only after "Перевести" is clicked in the confirmation; it is instant and
    completes as status Проведено / Completed
  * On success: both dialogs close, a localized success message with the amount is shown, and the
    calling tab plus the header balances refresh
  * The button is protected against double submission while the request is in progress
  * The transfer is attributed to the logged-in admin and to the point being viewed

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Transfer request completes within 2 seconds under normal conditions
* **Security/Compliance:** The backend is the authority on the available balance and on the
  active-point rule; the UI checks are a convenience. Each transfer is recorded with performer,
  point, source, amount and time for audit
* **Usability/Other:**
  * All dialog text and validation messages localized en + ru (validation messages via the shared
    form error messages)
  * Errors are handled locally in the dialog (no duplicate global notification):
    - Insufficient balance (balance changed meanwhile) → error under the amount field after
      returning to the transfer dialog, with the available balance refreshed
    - Point not active (temporarily or permanently closed) → localized error notification, the
      dialogs close and the calling tab and header refresh so the new status and disabled buttons
      are shown
    - Other errors → localized notification
    - Any new backend error codes are registered with localized messages
  * **Backend dependency:** a "transfer to bank" operation taking point, source account
    (CASH / CARD_TERMINAL) and amount, which refuses non-active points (not available today)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Dialog opens with fixed source and destination**

* **Given** active point "Центр" has 850.00 in cash
* **When** the admin clicks "Transfer to bank" on the cash card
* **Then** the dialog shows "Центр", source "Cash drawer", destination "Bank account", available
  850.00, an empty amount and "Remaining: 850.00"

**Scenario 2: "All" shortcut**

* **Given** the dialog above
* **When** the admin clicks "All"
* **Then** the amount becomes 850.00 and "Remaining: 0.00" is shown

**Scenario 3: Amount above balance**

* **Given** available 850.00
* **When** the admin enters 900
* **Then** a localized "exceeds available balance" error is shown and submit is disabled

**Scenario 4: Zero or empty amount**

* **Given** the dialog is open
* **When** the amount is empty or 0
* **Then** submit is disabled and the appropriate required / greater-than-zero message is shown
  once the field is touched

**Scenario 5: Confirmation then execution**

* **Given** the admin entered 400.00 from cash
* **When** they submit and click "Transfer" in the confirmation showing 400.00, From "Центр · Cash
  drawer", To "Bank account", Remaining 450.00
* **Then** the transfer is executed, both dialogs close, a success message is shown and the cash
  balance becomes 450.00

**Scenario 6: Back from confirmation**

* **Given** the confirmation is open for 400.00
* **When** the admin clicks "Back"
* **Then** the transfer dialog is shown again with 400.00 still entered and nothing was transferred

**Scenario 7: Balance changed meanwhile**

* **Given** the dialog opened with 850.00 available but an operator transferred 600.00 meanwhile
* **When** the admin confirms a 400.00 transfer
* **Then** no transfer happens, the amount field shows a localized insufficient-balance error and
  the available balance updates to 250.00

**Scenario 8: Terminal source**

* **Given** the terminal account of an active point holds 830.50
* **When** the admin opens the dialog from the terminal card and transfers 830.50
* **Then** the confirmation shows From "Центр · Terminal account" and, after confirming, the
  terminal balance becomes 0.00

**Scenario 9: Point closed meanwhile**

* **Given** the dialog is open but another admin temporarily closed the point in the meantime
* **When** the admin confirms the transfer
* **Then** no transfer happens, a localized "transfers are only possible from an active point"
  error is shown, the dialogs close, and the tab shows the new status with transfer buttons
  disabled

## 5. Out of Scope

* Transfers from temporarily or permanently closed points
* Choosing, naming or managing bank accounts
* Transfer notes / comments / reference numbers
* Cash limits
* Transfers between points or between a point's own accounts
* Scheduling or "in transit" states
* Test files (MVP rule)
