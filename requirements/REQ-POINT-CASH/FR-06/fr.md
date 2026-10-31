# User Story: FR-06 — Operator Касса Screen: Running Shift and Bottom-Nav Entry

> **Revised 2026-10-31** to match the backend contract (`../backend_contract.md`). Operators see
> **only the running shift of their working point** — the till, terminal, bank and movement views
> are admin-only. The terminal card, the terminal "transfer to bank" button and the per-movement
> list (with customers and other staff) are removed; the screen shows the shift summary and the
> two operator actions, **cash collection** (FR-07) and **Close shift** (FR-08).

## 1. Description

**As an** operator
**I want to** open a "Касса" screen from the bottom navigation that shows the running shift of my
working point — what the drawer opened with, what came in and went out by type, and how much cash
is expected in the drawer
**So that** I always know how much cash should be at my point, can hand it in, and can close my
shift from my phone

## 2. Context & Business Rules

* **Trigger:** Operator taps the new **"Касса / Cash"** item in the bottom navigation
* **Rules Enforced:**
  * The bottom navigation gains a **4th item "Касса / Cash"** with the `point_of_sale` icon, placed
    after Аренды / Rentals, Новая / New and Возврат / Return; it highlights when active like the
    other items
  * The screen follows the operator app's mobile layout (max content width 480 px, bottom nav
    visible)
  * The screen always shows the **current working point** — the point selected in the toolbar
    point switcher. When the operator switches point, the screen reloads for the new point
  * If the operator has no working point established, the screen shows the existing "no working
    point" guidance instead of the shift, and no action buttons are shown
  * **Running shift card:**
    - Shift number and the time it opened
    - **На начало смены / Shift opening** — the cash counted when the previous shift closed
    - One line per movement type that occurred in the running shift (e.g. Deposit, Withdrawal,
      Rental payment, Penalty, Adjustment, Cash collection, Shift discrepancy), each with its signed
      total, localized
    - **Ожидается в кассе / Expected cash** — prominent; the breakdown reconciles: shift opening +
      signed type totals = expected cash
  * Primary button **"Сдать наличные / Hand in cash"** → opens the cash collection flow (FR-07)
  * Secondary button **"Закрыть смену / Close shift"** → opens the shift closure flow (FR-08)
  * **Button availability:**
    - Cash collection is offered only at an **active** working point. If the working point is
      temporarily closed, "Hand in cash" is disabled and a localized hint explains that cash can be
      collected only at an active point
    - On an active point, "Hand in cash" is disabled when expected cash is 0 or less
    - "Close shift" is available whenever a shift is running (rules in FR-08)
  * **No running shift:** when the working point has no running shift, the screen shows a
    localized "No shift is running" state instead of the shift card, and neither button is offered
    (FR-08)
  * The screen shows **no** card-terminal or bank figures, no list of individual movements, and no
    customer or other staff members' data
  * Returning from a successful collection (FR-07) or shift closure (FR-08) shows the refreshed
    shift summary
  * Every operator may use this screen, hand in cash and close the shift — no additional role check
  * Operators cannot cancel collections and cannot record terminal settlements; neither action
    exists in the operator app
  * **Assumptions (pending backend confirmation):**
    - A4: When the working point has no running shift, the backend returns a recognisable "no
      running shift" answer, shown as the "No shift is running" state rather than an error

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Screen data loads within 2 seconds on a mobile connection; pull-to-refresh is not
  required, but reopening the tab reloads the data
* **Security/Compliance:** Data is limited to the running shift of the operator's working point;
  operators see no other point's data and no other users' data. The active-point rule is enforced by
  the backend; the disabled button is a convenience
* **Usability/Other:**
  * Touch targets sized for mobile; all labels, hints and movement-type names localized en + ru
  * Load failure → standard error notification and a retry-able error state
  * Errors such as working point not established or point inactive use the existing operator
    point-error copy
  * **Backend dependency:** the running-shift summary and shift closure for the working point are
    available

## 4. Acceptance Criteria (BDD)

**Scenario 1: New nav item**

* **Given** an operator is logged in
* **When** any screen with the bottom navigation is shown
* **Then** four items are visible: Rentals, New, Return, Cash (with the point-of-sale icon)

**Scenario 2: Running shift for the working point**

* **Given** the working point is active "Центр", its running shift no. 42 opened at 08:00 with
  500.00, and in this shift rental payments total +400.00 and withdrawals −50.00
* **When** the operator taps "Cash"
* **Then** the screen shows "Shift 42 · opened 08:00", Shift opening 500.00, Rental payment
  +400.00, Withdrawal −50.00, Expected cash 850.00, an enabled "Hand in cash" button and a
  "Close shift" button

**Scenario 3: Point switch**

* **Given** the operator is on the Cash screen for "Центр"
* **When** they switch the working point to "Парк" in the toolbar
* **Then** the screen shows the running shift of "Парк"

**Scenario 4: No terminal or personal data**

* **Given** the working point has card-terminal payments in the running shift
* **When** the Cash screen opens
* **Then** no terminal balance, no individual movement rows and no customer or staff names are
  shown

**Scenario 5: Buttons open the flows**

* **Given** the Cash screen of an active point is shown
* **When** the operator taps "Hand in cash" or "Close shift"
* **Then** the cash collection screen (FR-07) or the shift closure flow (FR-08) opens respectively

**Scenario 6: Nothing to hand in**

* **Given** an active point whose expected cash is 0.00
* **When** the screen renders
* **Then** "Hand in cash" is disabled and "Close shift" is still available

**Scenario 7: Working point not active**

* **Given** the working point is temporarily closed and its expected cash is 200.00
* **When** the operator opens the Cash screen
* **Then** the shift summary is shown, "Hand in cash" is disabled, and a localized hint explains
  that cash can be collected only at an active point

**Scenario 8: No working point**

* **Given** the operator has no working point established
* **When** they open the Cash screen
* **Then** the "no working point" guidance is shown and no shift data or button is shown

**Scenario 9: No running shift**

* **Given** the working point has no running shift
* **When** the operator opens the Cash screen
* **Then** a localized "No shift is running" state is shown with neither "Hand in cash" nor
  "Close shift"

## 5. Out of Scope

* The collection flow (FR-07) and the shift closure flow (FR-08) themselves
* Card-terminal, bank or till position views for operators (admin-only)
* Individual movement lists, customer data or other staff data for operators
* Terminal settlements and cancellations in the operator app
* Viewing other points or previous shifts
* Cash limits
* Test files (MVP rule)
