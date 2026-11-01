# User Story: FR-08 — Close the Running Shift with a Cash Count (Operator and Admin)

> **Added 2026-10-31** after product decision: shift closure is in scope for **both** operators and
> admins. Follows the backend contract (`../backend_contract.md`): the running shift is closed with
> the cash actually counted in the drawer; the count becomes the opening amount of the next shift.

## 1. Description

**As an** operator at my working point, or an admin viewing a point
**I want to** close the point's running shift by entering the cash I actually counted in the
drawer, and see how it compares with the expected cash
**So that** each shift ends with a reconciled drawer, any shortage or surplus is recorded, and the
next shift starts from the real counted amount

## 2. Context & Business Rules

* **Trigger:**
  * Operator: **"Закрыть смену / Close shift"** on the operator Касса screen (FR-06), for the
    current working point
  * Admin: **"Закрыть смену / Close shift"** on the cash card of the point's Касса tab (FR-03), for
    the point being viewed
* **Rules Enforced:**
  * Only the **running shift** of the point can be closed; the closure names that specific shift.
    If the shift shown is no longer the running one (someone else closed it meanwhile), nothing is
    closed (see error handling)
  * **Close-shift form** shows (read-only): point name, shift number, time the shift opened, and
    **Ожидается в кассе / Expected cash**
  * **Exactly one input: Посчитано / Counted amount** — required, 0 or more, at most two decimal
    places. There is no "All" shortcut: the user must enter what they physically counted
  * **Difference** hint updates as the user types: counted − expected, labelled
    **"Излишек / Surplus +X"** when positive, **"Недостача / Shortage −X"** when negative, and
    **"Сходится / Matches"** when zero
  * **Confirmation dialog "Закрыть смену? / Close shift?"** shows shift number, expected cash,
    counted amount and the difference, and a note that a closed shift cannot be reopened; buttons
    **Назад / Back** (returns to the form, value kept) and **Закрыть смену / Close shift**
  * The closure executes only after confirming
  * **Outcome:**
    - The shift is closed with the counted amount
    - When counted ≠ expected, the difference is recorded as a **Shift discrepancy** movement and
      the point's cash position matches the counted amount
    - The counted amount becomes the **opening amount** of the next shift
  * **Result view** after success: shift number closed, expected cash, counted amount, difference
    (Surplus / Shortage / Matches) and the time of closure; button **"Готово / Done"** returns to
    the calling screen
  * **After closure, screens show:**
    - Operator Касса screen (FR-06) and admin Касса tab (FR-03): the new running shift with its
      opening amount equal to the count, no movement-type lines yet, and expected cash equal to
      the opening amount; the admin's shift movement list is empty
    - Admin header Cash pill and Operations tab (FR-02) reflect any Shift discrepancy movement
  * **No running shift:** when the point has no running shift, the operator Касса screen and the
    admin Касса tab show a localized "No shift is running" state instead of the shift breakdown;
    "Close shift" and "Collect cash / Hand in cash" are not offered; the admin still sees the
    point's positions
  * **No duplicates on retry:** each confirmed closure is one attempt with its own identity; if the
    same attempt is sent again (network failure, double tap) the first result is returned and the
    shift is not closed twice. The confirm button shows progress and cannot be pressed again while
    in progress
  * The closure is attributed to the logged-in user and the point
  * Operators close only the running shift of their working point; if the working point changes
    while the operator is in the close-shift flow, they are returned to Касса
  * **Assumptions (pending backend confirmation):**
    - A1: Admins can read and close the running shift of the point they are viewing (the point is
      named the same way as for collections)
    - A2: When counted ≠ expected the backend records the Shift discrepancy movement itself; the UI
      does not record it separately
    - A3: After a closure the backend opens the next shift automatically with the counted amount
      as its opening; the UI offers no "open shift" action. If it does not, the "No shift is
      running" state applies until the backend opens one
    - A4: When the point has no running shift, the running-shift request returns a recognisable
      "no running shift" answer that the UI shows as the "No shift is running" state rather than
      an error
    - A5: Closing a shift that is no longer running is refused with a recognisable error; the UI
      shows a localized "This shift is already closed" message and refreshes
    - A6: Shift closure is allowed regardless of the point's status (active, temporarily or
      permanently closed); any backend refusal is shown as a localized error

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The closure completes within 2 seconds; the refreshed shift appears without a
  manual reload
* **Security/Compliance:** The backend is the authority on which shift is running and records who
  closed it, when, the counted amount and any discrepancy. Operators see only their working point's
  shift; the UI does not log personal data
* **Usability/Other:**
  * Operator flow fits the operator mobile layout (max width 480 px, large touch targets, numeric
    keypad); admin flow is a dialog consistent with FR-05
  * All labels, hints, difference wording, notes and messages localized en + ru; every new backend
    error code is registered with localized copy
  * Errors handled locally (no duplicate global notification): shift already closed → message +
    refresh (A5); operator working point not established → existing operator point-error copy;
    other errors → localized notification via the standard ProblemDetail handling
  * **Backend dependency:** the running-shift summary and the shift closure operation are available

## 4. Acceptance Criteria (BDD)

**Scenario 1: Operator closes a matching shift**

* **Given** the operator's working point "Центр" has running shift no. 42 with expected cash 850.00
* **When** the operator taps "Close shift", enters 850.00 ("Matches" shown) and confirms
* **Then** the result shows shift 42 closed, expected 850.00, counted 850.00, "Matches", and after
  "Done" the Касса screen shows shift 43 with opening 850.00 and expected cash 850.00

**Scenario 2: Shortage recorded as discrepancy**

* **Given** an admin views point `center` whose running shift has expected cash 850.00
* **When** the admin closes the shift with a counted amount of 830.00
* **Then** the confirmation and result show "Shortage −20.00"; afterwards the Cash tab shows the
  new shift with opening 830.00, the header Cash pill shows 830.00, and the Operations tab lists a
  "Shift discrepancy −20.00" movement

**Scenario 3: Surplus**

* **Given** expected cash 850.00
* **When** the counted amount entered is 860.00
* **Then** the difference hint reads "Surplus +10.00"

**Scenario 4: Counted amount required**

* **Given** the close-shift form is open
* **When** the counted amount is empty or negative
* **Then** the confirm action is disabled and the localized required / not-negative message is
  shown once the field is touched; 0.00 is accepted

**Scenario 5: Back from confirmation**

* **Given** the confirmation is open for a counted 830.00
* **When** the user taps "Back"
* **Then** the form is shown with 830.00 still entered and the shift is still running

**Scenario 6: Retry does not close twice**

* **Given** the user confirmed the closure and the connection dropped before the answer arrived
* **When** the same submission is retried
* **Then** the shift is closed once, only one discrepancy (if any) is recorded and the result is
  shown

**Scenario 7: Shift closed by someone else meanwhile**

* **Given** the operator has the close-shift form open for shift 42, and an admin closed shift 42
  in the meantime
* **When** the operator confirms
* **Then** nothing is closed, a localized "This shift is already closed" message is shown and the
  Касса screen refreshes to the current state

**Scenario 8: No shift running**

* **Given** the point has no running shift
* **When** the operator opens the Касса screen, or the admin opens the point's Cash tab
* **Then** a localized "No shift is running" state is shown, with no "Close shift" or collection
  button; the admin still sees the CASH and CARD_TERMINAL positions

**Scenario 9: Working point switched during the flow**

* **Given** the operator is in the close-shift flow for "Центр"
* **When** they switch the working point to "Парк"
* **Then** they are returned to the Касса screen of "Парк" and nothing was closed

## 5. Out of Scope

* Reopening a closed shift or editing a recorded count
* Opening a shift manually (see assumption A3)
* Counting by denomination / banknote breakdown
* Approval workflow or tolerance thresholds for discrepancies
* History of closed shifts as a separate view (discrepancies are visible in the Operations tab,
  FR-02)
* Printing or sharing a shift report
* Test files (MVP rule)
