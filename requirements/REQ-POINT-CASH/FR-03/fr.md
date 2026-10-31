# User Story: FR-03 — Admin Касса Tab: Running Shift, Point Positions and Shift Cash Movements

> **Revised 2026-10-31** to match the backend contract (`../backend_contract.md`). "Today" is now
> the point's **running shift**, not a calendar day: the opening amount is the cash counted when
> the previous shift closed. The cash card offers **cash collection** and **Close shift** (FR-08),
> the terminal card offers **terminal settlement** (FR-05). There is no cancellation, so the
> "cancelled transfer" rules are removed.

## 1. Description

**As an** admin user
**I want to** see a point's cash position with the running shift's breakdown, its card-terminal
position, and the cash movements of the running shift, with buttons to record a cash collection, a
terminal settlement, or to close the shift
**So that** I can reconcile the drawer for the current shift and move money to the bank from the
position that needs it

## 2. Context & Business Rules

* **Trigger:** Admin opens the "Касса / Cash" tab of a point (`/points/:slug/cash`)
* **Rules Enforced:**
  * **Cash card ("Касса / Cash drawer")**:
    - Current CASH position, prominent
    - **Running shift** caption: shift number and the time it opened
    - Running-shift breakdown, in this order:
      - **На начало смены / Shift opening** — the cash counted at the close of the previous shift
      - One line per movement type that occurred in the running shift (e.g. Deposit, Withdrawal,
        Rental payment, Penalty, Adjustment, Cash collection), each with its signed total, using
        the localized movement-type names from FR-02
      - **Ожидается в кассе / Expected cash** — the expected drawer amount reported for the shift
    - The breakdown reconciles: shift opening + the signed type totals = expected cash
    - Button **"Сдать в банк / Collect cash"** opens the cash collection dialog (FR-05)
    - Button **"Закрыть смену / Close shift"** opens the shift closure dialog (FR-08)
  * **Terminal card ("Терминал / Terminal account")**:
    - Current CARD_TERMINAL position
    - Button **"Зачислить в банк / Record settlement"** opens the terminal settlement dialog
      (FR-05)
  * **Action availability:**
    - **Cash collection** is offered only for an **active** point. On a temporarily or permanently
      closed point the collection button is disabled with a localized hint (e.g. "Cash can be
      collected only at an active point")
    - **Terminal settlement** is refused only at a **permanently closed** point. On a permanently
      closed point the settlement button is disabled with a localized hint (e.g. "Settlements
      cannot be recorded at a permanently closed point"); on an active or temporarily closed point
      it is available
    - A collection or settlement button is also disabled when its position is 0 or less (nothing
      to move)
    - **Close shift** is available whenever a shift is running (rules in FR-08)
    - These rules are a convenience; the backend is the authority and its refusals are handled in
      FR-05 and FR-08
  * **No running shift:** when the point has no running shift, the cash card shows the CASH
    position and a localized "No shift is running" state instead of the breakdown; "Collect cash"
    and "Close shift" are not offered and the shift movement list is not shown (FR-08)
  * **Shift cash movements** list — CASH position movements recorded since the running shift
    opened, newest first, paged (page size at most 100). Each row:
    - Time (HH:mm; date added when the shift spans more than one day)
    - Type — localized movement type (FR-02 list)
    - Customer — link to the customer's page when the movement relates to a customer; em-dash
      otherwise
    - Recorded by — staff member's name resolved from the user directory ("Unknown user" when it
      cannot be resolved)
    - Signed amount — inflows "+" with positive styling, outflows "−" with warn styling
    - Running cash position after that movement
  * Empty state when no cash movements have been recorded in the running shift
  * After a collection or settlement completes (FR-05) or the shift is closed (FR-08), the cards,
    breakdown, movement list and header balance pills refresh
  * A wrong collection is never undone here; it is corrected by an adjustment, which then appears
    as an "Adjustment" movement and in the breakdown
  * **Assumptions (pending backend confirmation):**
    - A1: Admins can read the running-shift summary of the point being viewed (the point is named
      the same way as for collections)
    - A4: When the point has no running shift, the backend returns a recognisable "no running
      shift" answer, shown as the "No shift is running" state rather than an error
    - A7: The shift movement list is built from the point's CASH movements over the period from
      the shift's opening time to now (one position per request, see FR-02 assumption A8)
    - A10: Movements carry only a customer reference, not a name, so the customer is shown as a
      link to the customer's page

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Tab content loads within 2 seconds
* **Security/Compliance:** Admin-only (till, terminal and movement views are administrator views);
  read-only except for the collection, settlement and shift-closure entry points
* **Usability/Other:**
  * Amounts in BYN with two decimals; all labels, hints, shift captions and movement types
    localized en + ru
  * Load failure → error notification via the standard toolkit and an error/empty state in the
    affected card or list; the other card stays usable
  * **Backend dependency:** the running-shift summary and shift closure exist; the point positions
    and point movements are announced but not yet published

## 4. Acceptance Criteria (BDD)

**Scenario 1: Cash card with running-shift breakdown**

* **Given** point `center`'s running shift no. 42 opened at 08:00 with 500.00 counted at the
  previous close, and in this shift rental payments total +900.00, withdrawals −150.00 and cash
  collections −400.00
* **When** the admin opens the Cash tab
* **Then** the cash card shows the CASH position 850.00, "Shift 42 · opened 08:00", and the
  breakdown Shift opening 500.00 / Rental payment +900.00 / Withdrawal −150.00 / Cash collection
  −400.00 / Expected cash 850.00

**Scenario 2: Shift opening is the previous count, not midnight**

* **Given** the previous shift closed yesterday at 22:00 with 480.00 counted, and the running shift
  opened at 22:00
* **When** the admin opens the Cash tab today at 10:00
* **Then** the shift opening shows 480.00 and the movement list includes yesterday's movements
  recorded after 22:00

**Scenario 3: Terminal card**

* **Given** the active point's CARD_TERMINAL position is 830.50
* **When** the Cash tab renders
* **Then** the terminal card shows 830.50 and an enabled "Record settlement" button

**Scenario 4: Buttons open the right dialog**

* **Given** the Cash tab of an active point is displayed
* **When** the admin clicks "Collect cash", "Close shift" or "Record settlement"
* **Then** respectively the cash collection dialog (FR-05), the shift closure dialog (FR-08) or the
  terminal settlement dialog (FR-05) opens

**Scenario 5: Zero position disables the button**

* **Given** an active point whose CARD_TERMINAL position is 0.00
* **When** the Cash tab renders
* **Then** the "Record settlement" button is disabled

**Scenario 6: Temporarily closed point**

* **Given** a temporarily closed point with CASH 200.00 and CARD_TERMINAL 50.00
* **When** the Cash tab renders
* **Then** "Collect cash" is disabled with the localized active-point hint, and "Record settlement"
  is enabled

**Scenario 7: Permanently closed point**

* **Given** a permanently closed point with CASH 200.00 and CARD_TERMINAL 50.00
* **When** the Cash tab renders
* **Then** "Collect cash" and "Record settlement" are disabled, each with its localized hint

**Scenario 8: Movement list**

* **Given** at 10:15 operator "Олег" recorded a 25.00 cash rental payment for a customer with the
  drawer previously at 500.00
* **When** the Cash tab renders
* **Then** the list contains a row "10:15 · Rental payment · <customer link> · Олег · +25.00 ·
  525.00"

**Scenario 9: Refresh after collection**

* **Given** the admin records a 300.00 cash collection from the dialog
* **When** the dialog closes with success
* **Then** the CASH position, the "Cash collection" breakdown line, the expected cash, the movement
  list and the header "Cash" pill all reflect the collection without a page reload

**Scenario 10: Refresh after shift closure**

* **Given** the admin closes shift 42 with a counted amount of 830.00 (FR-08)
* **When** the dialog closes with success
* **Then** the cash card shows the new running shift with opening 830.00 and expected cash 830.00,
  the movement list is empty and the header "Cash" pill shows 830.00

**Scenario 11: No movements in the running shift**

* **Given** no cash movements have been recorded since the running shift opened
* **When** the Cash tab renders
* **Then** the list shows a localized "No cash movements in this shift" message and the breakdown
  shows only the shift opening and expected cash

**Scenario 12: No running shift**

* **Given** the point has no running shift
* **When** the Cash tab renders
* **Then** the cash card shows the CASH position and "No shift is running", with no "Collect cash"
  or "Close shift" button; the terminal card is unaffected

## 5. Out of Scope

* The shift closure flow itself (FR-08)
* Viewing previous shifts on this tab (use the Operations tab with a period, FR-02)
* Terminal-position movement list (visible on the Operations tab, FR-02)
* Cancelling or reversing a collection or settlement (corrections are adjustments)
* Recording adjustments from this tab
* Cash limits and alerts
* The collection and settlement dialogs themselves (FR-05)
* Test files (MVP rule)
