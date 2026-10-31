# User Story: FR-05 — Admin Cash Collection and Terminal Settlement Dialogs

> **Revised 2026-10-31** to match the backend contract (`../backend_contract.md`). The single
> "transfer to bank" dialog with a source choice is **split into two operations** that the backend
> defines separately:
> * **Cash collection** — moves cash from the point's cash drawer to its bank position; recordable
>   by operators and admins; **active points only** (product decision).
> * **Terminal settlement** — moves money from the point's card-terminal position to its bank
>   position; **admins only**, carries the settlement date from the bank statement, refused only at
>   a permanently closed point.
>
> Both are final once recorded (no cancellation) and are protected against duplicate recording on
> retry.

## 1. Description

**As an** admin user
**I want to** record a cash collection from a point's drawer, or a terminal settlement from the
point's card terminal with the date shown on the bank statement, each through a simple dialog with
an explicit confirmation step
**So that** money moved to the bank is recorded quickly, accurately and only once

## 2. Context & Business Rules

* **Trigger:** "Сдать в банк / Collect cash" or "Зачислить в банк / Record settlement" on the Касса
  tab (FR-03) or the Инкассации tab (FR-04)
* **Rules Enforced — common to both dialogs:**
  * The operation is recorded at the point being viewed and attributed to the logged-in admin
  * The dialog shows (read-only): the point name, the source (**Касса / Cash drawer** for a
    collection, **Терминал / Terminal account** for a settlement — fixed by the button that opened
    it), the destination as the generic localized text **"Банковский счёт / Bank account"**, and
    the available amount of the source position
  * **Amount:** required, greater than 0, not more than the available amount, at most two decimal
    places
  * **"Всё / All"** fills the amount with the full available amount
  * **"Останется / Remaining: X"** shows available − entered amount, updating as the admin types
    (the full available amount while the amount is empty or invalid)
  * Submit is disabled while the form is invalid
  * **Confirmation dialog** opens on submit and shows the amount, **Откуда / From** (point +
    source), **Куда / To** ("Bank account"), **Останется / Remaining** and a note that the entry
    cannot be cancelled (a mistake is corrected by an adjustment); buttons **Назад / Back**
    (returns to the form with all values kept) and **Подтвердить / Confirm**
  * The operation executes only after "Confirm" and is instant
  * **No duplicates on retry:** each confirmed submission is one attempt with its own identity.
    If the same attempt is sent again (e.g. after a network failure or a double click) the backend
    returns the first result and nothing is recorded twice; a new submission after success is a
    new attempt
  * The confirm button shows progress and cannot be pressed again while the request is in progress
  * On success: both dialogs close, a localized success message with the amount is shown, and the
    calling tab plus the header balances refresh
* **Rules Enforced — cash collection:**
  * Offered only for an **active** point (FR-03/FR-04 disable the button otherwise); the backend
    refusal for a non-active point is still handled (see error handling)
  * Available amount = the point's current CASH position
* **Rules Enforced — terminal settlement:**
  * **Admin-only** operation; it does not exist in the operator app
  * Allowed at active and temporarily closed points; refused only at a **permanently closed** point
  * Available amount = the point's current CARD_TERMINAL position
  * **Settlement date** — required second field: the date of the settlement as shown on the bank
    statement, chosen with a date picker; it defaults to empty, cannot be later than today
    (business clock), and is shown in the confirmation dialog
* **Assumptions (pending backend confirmation):**
  * A12: The settlement date may be today or any earlier date; a future date is not accepted. No
    earliest allowed date is assumed. Any backend refusal of the date is shown under the date field
  * A13: A cash collection moves cash into the point's Bank position, so its destination is shown
    as "Bank account" like a terminal settlement

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The request completes within 2 seconds under normal conditions
* **Security/Compliance:** The backend is the authority on the available amounts, on point status
  and on who may record a settlement; UI checks are a convenience. Each entry is recorded by the
  backend with performer, point, amount and time for audit
* **Usability/Other:**
  * All dialog text and validation messages localized en + ru (validation messages via the shared
    form error messages)
  * Errors are handled locally in the dialog (no duplicate global notification), and every code
    below is registered with localized copy:
    - **Insufficient cash** (`finance.point.insufficient_cash`, collection) → back in the form, an
      error under the amount field; the available amount updates to the current cash position the
      backend reports with the error
    - **Insufficient terminal funds** (`finance.point.insufficient_terminal`, settlement) → same
      behaviour, using the current terminal position the backend reports with the error
    - **Point not active** (`finance.point.inactive`, collection) or **point permanently closed**
      (`finance.point.permanently_closed`, both) → localized error notification, the dialogs
      close, and the calling tab and header refresh so the new status and disabled buttons show
    - Other errors → localized notification via the standard ProblemDetail handling
  * **Backend dependency:** cash collection is available; terminal settlement is announced but not
    yet published (its fields are final only once they appear in the published API description)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Collection dialog opens with fixed source and destination**

* **Given** active point "Центр" has a CASH position of 850.00
* **When** the admin clicks "Collect cash"
* **Then** the dialog shows "Центр", source "Cash drawer", destination "Bank account", available
  850.00, an empty amount and "Remaining: 850.00"

**Scenario 2: "All" shortcut**

* **Given** the dialog above
* **When** the admin clicks "All"
* **Then** the amount becomes 850.00 and "Remaining: 0.00" is shown

**Scenario 3: Amount above available**

* **Given** available 850.00
* **When** the admin enters 900
* **Then** a localized "exceeds available amount" error is shown and submit is disabled

**Scenario 4: Zero or empty amount**

* **Given** the dialog is open
* **When** the amount is empty or 0
* **Then** submit is disabled and the required / greater-than-zero message is shown once the field
  is touched

**Scenario 5: Collection confirmed and recorded**

* **Given** the admin entered 400.00 in the collection dialog
* **When** they submit and click "Confirm" in the confirmation showing 400.00, From "Центр · Cash
  drawer", To "Bank account", Remaining 450.00 and the cannot-be-cancelled note
* **Then** the collection is recorded, both dialogs close, a success message is shown and the cash
  position becomes 450.00

**Scenario 6: Back from confirmation**

* **Given** the confirmation is open for 400.00
* **When** the admin clicks "Back"
* **Then** the form is shown again with 400.00 still entered and nothing was recorded

**Scenario 7: Retry does not duplicate**

* **Given** the admin confirmed a 400.00 collection and the connection dropped before the answer
  arrived
* **When** the same submission is sent again
* **Then** only one 400.00 collection exists and the success result is shown once

**Scenario 8: Cash changed meanwhile**

* **Given** the dialog opened with 850.00 available but an operator collected 600.00 meanwhile
* **When** the admin confirms a 400.00 collection
* **Then** nothing is recorded, the amount field shows a localized insufficient-cash error and the
  available amount updates to 250.00

**Scenario 9: Point closed meanwhile (collection)**

* **Given** the collection dialog is open but another admin temporarily closed the point
* **When** the admin confirms
* **Then** nothing is recorded, a localized "cash can be collected only at an active point" error
  is shown, the dialogs close and the tab shows the new status with "Collect cash" disabled

**Scenario 10: Terminal settlement with bank-statement date**

* **Given** active point "Центр" has a CARD_TERMINAL position of 830.50
* **When** the admin clicks "Record settlement", enters 830.50, picks the settlement date 27.10.2026
  and confirms in the confirmation showing 830.50, From "Центр · Terminal account", To "Bank
  account", settlement date 27.10.2026 and Remaining 0.00
* **Then** the settlement is recorded, a success message is shown and the terminal position
  becomes 0.00

**Scenario 11: Settlement date required**

* **Given** the settlement dialog with a valid amount
* **When** no settlement date is chosen
* **Then** submit is disabled and a localized "settlement date is required" message is shown once
  the field is touched

**Scenario 12: Settlement date in the future**

* **Given** today is 28.10.2026
* **When** the admin tries to pick 29.10.2026 as the settlement date
* **Then** the date cannot be chosen (or, if typed, a localized "settlement date cannot be in the
  future" message is shown) and submit is disabled

**Scenario 13: Settlement at a temporarily closed point**

* **Given** a temporarily closed point with a CARD_TERMINAL position of 50.00
* **When** the admin records a 50.00 settlement
* **Then** the settlement is recorded successfully

**Scenario 14: Settlement refused at a permanently closed point**

* **Given** the settlement dialog is open but the point was permanently closed meanwhile
* **When** the admin confirms
* **Then** nothing is recorded, a localized "point is permanently closed" error is shown, the
  dialogs close and the tab shows "Record settlement" disabled

**Scenario 15: Terminal funds changed meanwhile**

* **Given** the settlement dialog opened with 830.50 available but the terminal position is now
  300.00
* **When** the admin confirms 830.50
* **Then** nothing is recorded, an insufficient-terminal-funds error is shown under the amount and
  the available amount updates to 300.00

## 5. Out of Scope

* Choosing the source inside a dialog (each dialog has a fixed source)
* Cancelling or reversing a collection or settlement after it is recorded; recording adjustments
* Collections or settlements from a point other than the one being viewed
* Collections at temporarily or permanently closed points (product decision)
* Choosing, naming or managing bank accounts
* Notes / comments / reference numbers
* Cash limits
* Transfers between points or between a point's own positions other than the two operations above
* Scheduling or "in transit" states
* Test files (MVP rule)
