# User Story: FR-07 — Operator Cash Collection Flow: Form, Confirmation and Success Screen

> **Revised 2026-10-31** to match the backend contract (`../backend_contract.md`). Operators can
> only **collect cash**, and only at an **active** working point (product decision): the Касса /
> Терминал source tabs are removed (terminal settlement is admin-only, FR-05). The confirmation
> note no longer says "only an administrator can cancel" — collections cannot be cancelled; a
> mistake is corrected by an administrator with an adjustment. Duplicate recording on retry is
> prevented.

## 1. Description

**As an** operator
**I want to** hand in cash from my point's drawer through a short mobile flow with a confirmation
and a clear success receipt
**So that** I can safely hand in takings without involving an admin and know for sure that it was
recorded exactly once

## 2. Context & Business Rules

* **Trigger:** "Сдать наличные / Hand in cash" on the operator Касса screen (FR-06); only enabled
  when the working point is active and a shift is running
* **Rules Enforced:**
  * Cash can be collected only at an **active** working point. The flow cannot be started for a
    temporarily closed point, and if the backend refuses because the point is not active (e.g. its
    status changed meanwhile), nothing is recorded (see error handling below)
  * **Collection screen "Сдать наличные / Hand in cash"**:
    - Full screen with a back arrow (returns to Касса without recording anything); the bottom
      navigation is hidden on this screen
    - Shows the source **Касса / Cash drawer** (fixed — there is no source choice) with the expected
      cash of the running shift as the available amount
    - Large amount input (numeric keypad on mobile): required, > 0, ≤ available amount, at most two
      decimals
    - **"Всё / All"** shortcut fills the full available amount
    - **"Останется / Remaining: X"** and the destination, shown as the generic localized text
      **"Банковский счёт / Bank account"**, appear under the input
    - Primary button **"Сдать X BYN / Hand in X BYN"** reflects the entered amount and is disabled
      while the amount is invalid
    - The point is always the operator's current working point and is not selectable here
  * **Confirmation dialog "Сдать наличные? / Hand in cash?"**: amount, **откуда / from** (point +
    cash drawer), **куда / to** ("Bank account"), **останется / remaining**, and a note that the
    collection is instant and cannot be cancelled — if it was a mistake, an administrator corrects
    it; buttons **Назад / Back** (closes the dialog, amount kept) and **Сдать / Hand in**
  * The collection is recorded only after confirming
  * **No duplicates on retry:** each confirmed submission is one attempt with its own identity; if
    the same attempt is sent again (network failure, double tap) the first result is returned and
    nothing is recorded twice. The confirm button cannot be pressed again while in progress
  * **Success screen "Наличные сданы / Cash handed in"**: amount, source (Cash drawer), destination
    ("Bank account"), the time the backend recorded it, and the cash remaining in the drawer as
    reported by the backend; button **"Готово / Done"** returns to the Касса screen, which shows the
    refreshed shift summary
  * Pressing back from the success screen also returns to Касса and must not resubmit or reopen the
    form with the old amount
  * If the working point changes while on the collection screen, the operator is returned to Касса
    (the form targeted the previous point)
  * All operators may hand in cash; no extra role check. The collection is attributed to the
    logged-in operator and the working point
  * **Assumptions (pending backend confirmation):**
    - A13: A cash collection moves cash into the point's Bank position, so the destination is shown
      as the generic "Bank account"

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The collection completes within 2 seconds on a normal mobile connection; a
  progress indicator is shown on the confirm button meanwhile
* **Security/Compliance:** The backend enforces the cash limit, the active-point rule and the
  working-point scope; each collection is recorded with operator, point, amount and time. The
  operator sees no other users' data
* **Usability/Other:**
  * Layout fits the operator max width (480 px); large touch targets; all text localized en + ru
  * Errors are handled locally (no duplicate global notification), each with registered localized
    copy:
    - **Insufficient cash** (`finance.point.insufficient_cash`) → error under the amount; the
      available amount updates to the current cash position the backend reports with the error
    - **Point not active / permanently closed** (`finance.point.inactive`,
      `finance.point.permanently_closed`) or **working point not established** → existing localized
      operator point-error copy; the operator is returned to Касса, which shows the button disabled
    - Other errors → localized notification via the standard ProblemDetail handling
  * **Backend dependency:** cash collection for operators at their working point is available

## 4. Acceptance Criteria (BDD)

**Scenario 1: Screen opens with the cash drawer as source**

* **Given** the active working point "Центр" has expected cash 850.00 in the running shift
* **When** the operator taps "Hand in cash"
* **Then** the collection screen opens without the bottom nav, showing source "Cash drawer"
  850.00, an empty amount, "Remaining: 850.00" and the destination "Bank account", with no
  Terminal option

**Scenario 2: "All" and button caption**

* **Given** the collection screen with 850.00 available
* **When** the operator taps "All"
* **Then** the amount is 850.00, "Remaining: 0.00" is shown and the primary button reads
  "Hand in 850.00 BYN"

**Scenario 3: Invalid amount**

* **Given** 850.00 available
* **When** the operator enters 900
* **Then** a localized "exceeds available amount" message is shown and the primary button is
  disabled

**Scenario 4: Confirm and succeed**

* **Given** 400.00 entered
* **When** the operator taps "Hand in 400.00 BYN" and then "Hand in" in the confirmation, which
  shows 400.00, from "Центр · Cash drawer", to "Bank account", remaining 450.00 and the
  cannot-be-cancelled note
* **Then** the success screen shows 400.00, Cash drawer, "Bank account", the recorded time and
  450.00 remaining in the drawer

**Scenario 5: Back in confirmation**

* **Given** the confirmation dialog is open
* **When** the operator taps "Back"
* **Then** the dialog closes, the amount is still entered and nothing was recorded

**Scenario 6: Done returns to Касса**

* **Given** the success screen is shown
* **When** the operator taps "Done"
* **Then** the Касса screen shows expected cash 450.00 and a "Cash collection −400.00" line in the
  shift summary

**Scenario 7: Back arrow abandons**

* **Given** the collection screen with an amount entered
* **When** the operator taps the back arrow
* **Then** they return to Касса and nothing is recorded

**Scenario 8: Retry after a lost connection**

* **Given** the operator confirmed 400.00 and the connection dropped before the answer arrived
* **When** the same submission is retried
* **Then** exactly one 400.00 collection is recorded and the success screen is shown

**Scenario 9: Cash changed meanwhile**

* **Given** the screen showed 850.00 available but the cash position is now 250.00
* **When** the operator confirms 400.00
* **Then** nothing is recorded, an insufficient-cash error is shown under the amount and the
  available amount updates to 250.00

**Scenario 10: Point closed meanwhile**

* **Given** the operator is on the collection screen but an admin temporarily closed the working
  point
* **When** the operator confirms
* **Then** nothing is recorded, the localized "point is not active" message is shown, and the
  operator is returned to Касса with the button disabled

## 5. Out of Scope

* Terminal settlements in the operator app (admin-only, FR-05)
* Collections at temporarily or permanently closed points (product decision)
* Shift closure (FR-08)
* Cancelling collections or viewing collection history in the operator app
* Choosing a destination account or another point; showing bank account details
* Notes, receipts to print/share, photos of cash
* Offline queuing of collections
* Test files (MVP rule)
