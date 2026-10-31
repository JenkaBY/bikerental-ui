# User Story: FR-03 — Admin Касса Tab: Point Balances and Today's Cash Movements

## 1. Description

**As an** admin user
**I want to** see a point's cash-drawer balance with today's breakdown, its terminal-account
balance, and a list of today's cash movements, with buttons to transfer money to the bank
**So that** I can reconcile the drawer for the day and start a bank transfer from the account
that needs it

## 2. Context & Business Rules

* **Trigger:** Admin opens the "Касса / Cash" tab of a point (`/points/:slug/cash`)
* **Rules Enforced:**
  * **Cash card ("Касса / Cash drawer")**:
    - Current CASH balance, prominent
    - Today's breakdown, in this order:
      - **На начало дня / Start of day** — CASH balance at the start of the business day
      - **Принято наличными / Cash received** — sum of today's cash inflows (positive)
      - **Выдано наличными / Cash paid out** — sum of today's cash outflows to customers (negative)
      - **Сдано в банк / Transferred to bank** — sum of today's completed cash transfers to the
        bank (negative); cancelled transfers are not counted
    - The breakdown must reconcile: start of day + received − paid out − transferred = current
      balance
    - Button **"Сдать в банк / Transfer to bank"** opens the transfer dialog (FR-05) with source
      = CASH
  * **Terminal card ("Терминал / Terminal account")**:
    - Current CARD_TERMINAL balance
    - Button **"Перевести в банк / Transfer to bank"** opens the transfer dialog (FR-05) with
      source = CARD_TERMINAL
  * **Transfer button availability:**
    - Transfers are allowed only from **active** points. On a temporarily closed or permanently
      closed point both transfer buttons are disabled and a localized hint explains why (e.g.
      "Transfers are only possible from an active point")
    - On an active point, a transfer button is disabled when the corresponding balance is 0
      (nothing to transfer)
  * **Today's cash movements** list (CASH account only, today only, newest first), each row:
    - Time (HH:mm)
    - Type (e.g. rental payment, customer deposit, customer payout, transfer to bank, transfer
      cancelled) — localized
    - Customer · operator (customer name/phone where applicable, then the staff member who
      recorded it; em-dash for parts that do not apply)
    - Signed amount — inflows shown with "+" and positive styling, outflows with "−" and warn
      styling (same colour convention as the customer transactions tab)
    - Running balance of the drawer after that movement
  * Empty state when there are no cash movements today
  * "Today" is the business day according to the app's business clock
  * After a transfer completes (FR-05) or is cancelled (FR-04), the cards, breakdown, movement
    list and header balance pills refresh

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Tab content loads within 2 seconds; the movement list for a single day is not
  paged
* **Security/Compliance:** Admin-only; read-only except for the transfer entry points. The
  active-point rule is also enforced by the backend; the disabled buttons are a convenience
* **Usability/Other:**
  * Amounts in BYN with two decimals; all labels, hints and movement types localized en + ru
  * Load failure → error notification via the standard toolkit and an error/empty state in the
    affected card or list
  * **Backend dependency:** per-point CASH and CARD_TERMINAL balances, the day's opening CASH
    balance and breakdown totals, and the day's CASH movements with type, customer, operator,
    amount and running balance (not available today)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Cash card with breakdown**

* **Given** point `center` opened the day with 500.00, received 900.00 cash, paid out 150.00 and
  transferred 400.00 to the bank today
* **When** the admin opens the Cash tab
* **Then** the cash card shows balance 850.00 and the breakdown 500.00 / +900.00 / −150.00 /
  −400.00

**Scenario 2: Cancelled transfer not counted**

* **Given** today a 400.00 cash transfer was made and then cancelled by an admin
* **When** the Cash tab renders
* **Then** "Transferred to bank" shows 0.00 and the balance includes the returned 400.00

**Scenario 3: Terminal card**

* **Given** the active point's terminal account holds 830.50
* **When** the Cash tab renders
* **Then** the terminal card shows 830.50 and an enabled "Transfer to bank" button

**Scenario 4: Buttons open the dialog with the right source**

* **Given** the Cash tab of an active point is displayed
* **When** the admin clicks "Transfer to bank" on the cash card
* **Then** the transfer dialog opens with source "Cash drawer"; clicking the terminal card button
  instead opens it with source "Terminal account"

**Scenario 5: Zero balance disables the button**

* **Given** an active point whose terminal balance is 0.00
* **When** the Cash tab renders
* **Then** the terminal card's transfer button is disabled

**Scenario 6: Non-active point disables transfers**

* **Given** a temporarily closed (or permanently closed) point with cash 200.00 and terminal 50.00
* **When** the Cash tab renders
* **Then** both transfer buttons are disabled and a localized hint explains that transfers are
  only possible from an active point

**Scenario 7: Movement list**

* **Given** at 10:15 operator "Олег" took a 25.00 cash rental payment from "Иван П." with the drawer
  previously at 500.00
* **When** the Cash tab renders
* **Then** the list contains a row "10:15 · Rental payment · Иван П. · Олег · +25.00 · 525.00"

**Scenario 8: Refresh after transfer**

* **Given** the admin completes a 300.00 cash transfer from the dialog
* **When** the dialog closes with success
* **Then** the cash balance, "Transferred to bank" figure, movement list and header "Cash" pill
  all reflect the transfer without a page reload

**Scenario 9: No movements today**

* **Given** no cash movements happened today
* **When** the Cash tab renders
* **Then** the list shows a localized "No cash movements today" message

## 5. Out of Scope

* Terminal-account movement list (visible on the Operations tab, FR-02)
* Viewing previous days on this tab
* Manual cash adjustments, cash counts or shift closing
* Cash limits and alerts
* The transfer dialog itself (FR-05)
* Test files (MVP rule)
