# User Story: FR-07 — Operator Transfer Flow: Form, Confirmation and Success Screen

## 1. Description

**As an** operator
**I want to** hand in money from my point's cash drawer or terminal account to the business bank
account through a short mobile flow with a confirmation and a clear success receipt
**So that** I can safely deposit takings without involving an admin and know for sure that it
went through

## 2. Context & Business Rules

* **Trigger:** "Сдать в банк" / "Перевести в банк" on the operator Касса screen (FR-06); these are
  only enabled when the working point is active
* **Rules Enforced:**
  * Transfers are allowed only from an **active** working point. The flow cannot be started for a
    temporarily closed point, and if the backend refuses the transfer because the point is not
    active (e.g. its status changed meanwhile), no transfer happens (see error handling below)
  * **Transfer screen "Сдать в банк / Transfer to bank"**:
    - Full screen with a back arrow (returns to Касса without transferring); the bottom navigation
      is hidden on this screen
    - **Source tabs: Касса / Cash and Терминал / Terminal**, each showing its current balance; the
      tab matching the button that opened the screen is preselected and the operator may switch
    - Switching source clears the entered amount (the limit differs per source)
    - Large amount input (numeric keypad on mobile): required, > 0, ≤ selected source balance, at
      most two decimals
    - **"Всё / All"** shortcut fills the full balance of the selected source
    - **"Останется / Remaining: X"** and the destination, shown as the generic localized text
      **"Банковский счёт / Bank account"**, appear under the input
    - Primary button **"Перевести X BYN / Transfer X BYN"** reflects the entered amount and is
      disabled while the amount is invalid
    - The point is always the operator's current working point and is not selectable here
  * **Confirmation dialog "Перевести в банк? / Transfer to bank?"**: amount, **откуда / from**
    (point + source), **куда / to** ("Bank account"), **останется / remaining**, and a note that
    the transfer is instant and only an administrator can cancel it; buttons **Отмена / Cancel**
    (closes the dialog, amount kept) and **Перевести / Transfer**
  * The transfer executes only after confirming; double submission is prevented
  * **Success screen "Переведено в банк / Transferred to bank"**: amount, source, destination
    ("Bank account"), time of the transfer, remaining balance of the source; button
    **"Готово / Done"** returns to the Касса screen, which shows refreshed data
  * Pressing back from the success screen also returns to Касса and must not resubmit or reopen the
    form with the old amount
  * If the working point changes while on the transfer screen, the operator is returned to Касса
    (the form targeted the previous point)
  * All operators may transfer; no extra role check. The transfer is attributed to the logged-in
    operator and the working point

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The transfer completes within 2 seconds on a normal mobile connection; a progress
  indicator is shown on the confirm button meanwhile
* **Security/Compliance:** The backend enforces the balance limit, the active-point rule and the
  working-point scope; each transfer is recorded with operator, point, source, amount and time
* **Usability/Other:**
  * Layout fits the operator max width (480 px); large touch targets; all text localized en + ru
  * Errors are handled locally (no duplicate global notification):
    - Insufficient balance (balance changed meanwhile) → error under the amount with refreshed
      balances
    - Point not active (temporarily or permanently closed) or working point not established →
      existing localized operator point-error copy; the operator is returned to Касса, which shows
      transfer buttons disabled
    - Other errors → localized notification via the standard ProblemDetail handling
    - New backend error codes are registered with localized messages
  * **Backend dependency:** the same "transfer to bank" operation as FR-05, callable by operators
    for their working point, refusing non-active points, and returning the completed transfer
    (time, remaining balance) — not available today

## 4. Acceptance Criteria (BDD)

**Scenario 1: Screen opens with preselected source**

* **Given** the active working point "Центр" has cash 850.00 and terminal 120.00
* **When** the operator taps "Transfer to bank" on the cash card
* **Then** the transfer screen opens without the bottom nav, with the "Cash 850.00" tab selected,
  an empty amount, "Remaining: 850.00" and the destination "Bank account"

**Scenario 2: Switch source**

* **Given** the operator entered 300 under Cash
* **When** they switch to the Terminal tab
* **Then** the amount is cleared and "Remaining: 120.00" is shown

**Scenario 3: "All" and button caption**

* **Given** the Cash tab is selected with 850.00
* **When** the operator taps "All"
* **Then** the amount is 850.00, "Remaining: 0.00" is shown and the primary button reads
  "Transfer 850.00 BYN"

**Scenario 4: Invalid amount**

* **Given** the Terminal tab with 120.00
* **When** the operator enters 150
* **Then** a localized "exceeds available balance" message is shown and the primary button is
  disabled

**Scenario 5: Confirm and succeed**

* **Given** 400.00 entered under Cash
* **When** the operator taps "Transfer 400.00 BYN" and then "Transfer" in the confirmation, which
  shows 400.00, from "Центр · Cash", to "Bank account", remaining 450.00 and the
  instant/admin-only-cancel note
* **Then** the success screen shows 400.00, Cash, "Bank account", the transfer time and remaining
  450.00

**Scenario 6: Cancel in confirmation**

* **Given** the confirmation dialog is open
* **When** the operator taps "Cancel"
* **Then** the dialog closes, the amount is still entered and nothing was transferred

**Scenario 7: Done returns to Касса**

* **Given** the success screen is shown
* **When** the operator taps "Done"
* **Then** the Касса screen shows cash 450.00 and the new transfer in today's movements

**Scenario 8: Back arrow abandons**

* **Given** the transfer screen with an amount entered
* **When** the operator taps the back arrow
* **Then** they return to Касса and no transfer is made

**Scenario 9: Balance changed meanwhile**

* **Given** the screen showed cash 850.00 but another transfer reduced it to 250.00
* **When** the operator confirms 400.00
* **Then** no transfer happens, an insufficient-balance error is shown under the amount and the
  Cash tab balance updates to 250.00

**Scenario 10: Point closed meanwhile**

* **Given** the operator is on the transfer screen but an admin temporarily closed the working point
* **When** the operator confirms the transfer
* **Then** no transfer happens, the localized "point is not active" message is shown, and the
  operator is returned to Касса with the transfer buttons disabled

## 5. Out of Scope

* Transfers from temporarily or permanently closed points
* Cancelling or viewing transfer history in the operator app
* Choosing a destination account or another point; showing bank account details
* Transfer notes, receipts to print/share, photos of cash
* Offline queuing of transfers
* Test files (MVP rule)
