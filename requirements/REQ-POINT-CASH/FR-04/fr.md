# User Story: FR-04 — Admin Инкассации Tab: Transfer History and Cancellation

## 1. Description

**As an** admin user
**I want to** browse a point's history of transfers to the bank, filter it by status and date, and
cancel a mistaken transfer
**So that** I can audit what left each point's accounts and correct errors by returning the money
to the source account

## 2. Context & Business Rules

* **Trigger:** Admin opens the "Инкассации / Bank transfers" tab of a point
  (`/points/:slug/transfers`)
* **Rules Enforced:**
  * Paged list of transfers for this point from both source accounts, newest first
  * **Filters:**
    - Status chips: **Все / All** (default), **Проведено / Completed**, **Отменено / Cancelled** —
      exactly one active at a time
    - Date range (from / to, inclusive); empty means no date restriction
    - Changing any filter resets to the first page
  * **Columns:**
    - **Дата / Date** — date and time of the transfer, with the name of the person who made it
      beneath
    - **Сумма / Amount** — amount in BYN, two decimals
    - **Источник / Source** — the point account the money left: **Касса / Cash drawer** or
      **Терминал / Terminal account**
    - **Статус / Status** — pill: **Проведено / Completed** or **Отменено / Cancelled**; a
      cancelled row also shows who cancelled it and when (as secondary text or tooltip)
    - **Row actions** menu
  * There is no destination column: every transfer goes to the same bank account
  * **Row actions:** "Отменить / Cancel transfer" is available only for Completed transfers; the
    menu is absent or the item disabled for Cancelled ones
  * **Cancellation:**
    - Choosing "Cancel transfer" in the row menu cancels the transfer **immediately** — there is
      no confirmation dialog and no reason field
    - The transfer status becomes Cancelled and the amount is added back to the source account
      balance
    - The cancellation is irreversible: a cancelled transfer cannot be cancelled again or
      reinstated
    - The cancellation records who cancelled and when
    - Only admins can cancel; this action does not exist in the operator app
  * Header button **"Сдать в банк / Transfer to bank"** on this tab opens the transfer dialog
    (FR-05) with source = CASH. It follows the same availability rules as on the Касса tab
    (FR-03): disabled with a localized hint when the point is not active (temporarily or
    permanently closed), and disabled when the cash balance is 0
  * Cancelling a transfer is allowed regardless of the point's current status (it returns money to
    the point; it does not move money out)
  * After a transfer is created or cancelled, the list (current filters kept), the header balance
    pills and the Cash tab data refresh
  * Transfers are instant: there is no "pending / in transit" status

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Server-side paging; a page loads within 2 seconds
* **Security/Compliance:** Cancellation is an auditable admin action — the backend must record who
  cancelled and when; the UI shows this information. The UI does not log personal data
* **Usability/Other:**
  * All labels, chips, statuses, hints and success/error messages localized en + ru
  * A successful cancellation shows a localized success message
  * Cancellation errors (e.g. already cancelled by someone else) are shown via the standard
    ProblemDetail error handling; any new backend error codes are registered with localized
    messages; an "already cancelled" error refreshes the list
  * The cancel action is protected against double clicks while the request is in progress
  * Empty state when no transfers match the filters
  * **Backend dependency:** paged, filterable per-point transfer history (status, date range) with
    performer, source account and cancellation info; and a cancel-transfer operation (neither
    exists today)

## 4. Acceptance Criteria (BDD)

**Scenario 1: History renders**

* **Given** point `center` has 3 completed and 1 cancelled transfer
* **When** the admin opens the Bank transfers tab
* **Then** 4 rows are shown newest first with date + performer, amount, source (Cash drawer /
  Terminal account), status pill and an actions menu

**Scenario 2: Status filter**

* **Given** the history above
* **When** the admin selects the "Cancelled" chip
* **Then** only the 1 cancelled transfer is shown and the list is on page 1

**Scenario 3: Date range filter**

* **Given** transfers on 01.10, 15.10 and 28.10
* **When** the admin sets the range 10.10–20.10
* **Then** only the 15.10 transfer is shown

**Scenario 4: Cancel a transfer immediately**

* **Given** a completed cash transfer of 400.00 and a cash balance of 100.00
* **When** the admin chooses "Cancel transfer" in the row menu
* **Then** without any confirmation step the row status becomes "Cancelled" with the admin's name
  and time, a success message is shown, and the header "Cash" pill shows 500.00

**Scenario 5: Cancelled transfer has no cancel action**

* **Given** a cancelled transfer row
* **When** the admin opens its actions
* **Then** "Cancel transfer" is not available

**Scenario 6: Concurrent cancellation**

* **Given** another admin already cancelled the transfer
* **When** this admin chooses "Cancel transfer"
* **Then** a localized error is shown and the list refreshes, showing the transfer as Cancelled

**Scenario 7: Transfer from this tab**

* **Given** the Bank transfers tab of an active point is open
* **When** the admin clicks "Transfer to bank" and completes the transfer
* **Then** the new Completed transfer appears at the top of the list (if it matches the active
  filters)

**Scenario 8: Transfer button on a non-active point**

* **Given** the point is temporarily or permanently closed
* **When** the Bank transfers tab renders
* **Then** the "Transfer to bank" button is disabled with a localized hint that transfers are only
  possible from an active point, while the history and the cancel actions remain available

## 5. Out of Scope

* Confirmation dialog or reason input for cancellation
* Editing a transfer's amount or source after it is made
* Partial cancellation
* "In transit", bank confirmation or discrepancy handling
* Showing or managing bank account details
* Exporting history
* Cross-point (business-wide) transfer history page
* Test files (MVP rule)
