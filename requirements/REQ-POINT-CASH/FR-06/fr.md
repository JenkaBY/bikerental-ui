# User Story: FR-06 — Operator Касса Screen and Bottom-Nav Entry

## 1. Description

**As an** operator
**I want to** open a "Касса" screen from the bottom navigation that shows my working point's
cash-drawer and terminal balances and today's money movements
**So that** I always know how much money is at my point and can start a bank transfer from my phone

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
  * If the operator has no working point assigned, the screen shows the existing "no working point"
    guidance instead of balances, and transfer buttons are not shown
  * **Cash card:** current CASH balance (prominent) with the primary button **"Сдать в банк /
    Transfer to bank"** → opens the transfer screen (FR-07) with source Касса preselected
  * **Terminal card:** current CARD_TERMINAL balance with the button **"Перевести в банк /
    Transfer to bank"** → opens the transfer screen (FR-07) with source Терминал preselected
  * **Transfer button availability:**
    - Transfers are allowed only from an **active** point. If the working point is temporarily
      closed, both transfer buttons are disabled and a localized hint explains that transfers are
      only possible from an active point
    - On an active point, a transfer button is disabled when its balance is 0
  * **Today's movements:** movements of **both** point accounts (CASH and CARD_TERMINAL) for today,
    newest first, as a mobile-friendly list. Each row shows time, type, customer · operator,
    the account it belongs to (Касса / Терминал, clearly marked), signed amount with colour, and
    the running balance of that account. Empty state when none
  * Returning from a successful transfer (FR-07) shows refreshed balances and movements
  * Every operator may use this screen and start transfers — no additional role check
  * Operators cannot cancel transfers; there is no cancel action anywhere in the operator app

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Screen data loads within 2 seconds on a mobile connection; pull-to-refresh is not
  required, but reopening the tab reloads the data
* **Security/Compliance:** Data is scoped to the operator's working point only; operators see no
  other point's balances. The active-point rule is enforced by the backend; disabled buttons are a
  convenience
* **Usability/Other:**
  * Touch targets sized for mobile; all labels, hints and account markers localized en + ru
  * Load failure → standard error notification and a retry-able error state
  * Errors such as working point not established or point inactive use the existing operator
    point-error copy
  * **Backend dependency:** working-point CASH and CARD_TERMINAL balances and today's movements on
    both accounts (with account, running balance), accessible to operators for their working point
    (not available today)

## 4. Acceptance Criteria (BDD)

**Scenario 1: New nav item**

* **Given** an operator is logged in
* **When** any screen with the bottom navigation is shown
* **Then** four items are visible: Rentals, New, Return, Cash (with the point-of-sale icon)

**Scenario 2: Balances for the working point**

* **Given** the working point is active "Центр" with cash 850.00 and terminal 120.00
* **When** the operator taps "Cash"
* **Then** the screen shows the cash card with 850.00 and an enabled "Transfer to bank" primary
  button, and the terminal card with 120.00 and an enabled "Transfer to bank" button

**Scenario 3: Point switch**

* **Given** the operator is on the Cash screen for "Центр"
* **When** they switch the working point to "Парк" in the toolbar
* **Then** the screen shows "Парк" balances and movements

**Scenario 4: Today's movements on both accounts**

* **Given** today at the working point there was a 25.00 cash rental payment at 10:15 and a 40.00
  card-terminal rental payment at 11:00
* **When** the Cash screen opens
* **Then** both are listed newest first, the 11:00 row marked "Терминал / Terminal" and the 10:15
  row marked "Касса / Cash", each with time, type, customer · operator, signed amount and the
  running balance of its account

**Scenario 5: Buttons open the transfer screen with the right source**

* **Given** the Cash screen of an active point is shown
* **When** the operator taps the terminal card's "Transfer to bank"
* **Then** the transfer screen opens with the "Terminal" source selected

**Scenario 6: Zero balance**

* **Given** an active point whose cash balance is 0.00
* **When** the screen renders
* **Then** the cash card's transfer button is disabled

**Scenario 7: Working point not active**

* **Given** the working point is temporarily closed and holds cash 200.00
* **When** the operator opens the Cash screen
* **Then** balances and movements are shown, both transfer buttons are disabled, and a localized
  hint explains that transfers are only possible from an active point

**Scenario 8: No working point**

* **Given** the operator has no working point assigned
* **When** they open the Cash screen
* **Then** the "no working point" guidance is shown and no balances or transfer buttons are shown

## 5. Out of Scope

* Operator view of transfer history or cancellation
* Viewing other points or previous days
* Cash counts, shift closing, cash limits
* The transfer flow itself (FR-07)
* Test files (MVP rule)
