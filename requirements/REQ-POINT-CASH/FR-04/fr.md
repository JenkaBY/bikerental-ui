# User Story: FR-04 — Admin Инкассации Tab: Collection and Settlement History

> **Revised 2026-10-31** to match the backend contract (`../backend_contract.md`). The purpose of
> this story changed: it is now a **read-only history** of cash collections and terminal
> settlements with period totals. **Cancellation is withdrawn** — the backend offers no
> cancellation; a wrong collection is corrected with an adjustment. The status column and the
> Completed / Cancelled filter are removed because every recorded movement is final.

## 1. Description

**As an** admin user
**I want to** browse a point's history of cash collections and terminal settlements for a chosen
period, together with the period totals
**So that** I can audit what left the point's cash drawer and card terminal for the bank

## 2. Context & Business Rules

* **Trigger:** Admin opens the "Инкассации / Collections" tab of a point
  (`/points/:slug/transfers`)
* **Rules Enforced:**
  * The history lists the point's movements of the kinds **Cash collection** and **Terminal
    settlement**, as recorded by the backend; any other movement the backend returns in this view
    (e.g. an adjustment correcting a collection) is shown with its own localized type name
  * **Period (from / to, inclusive) is always required**, at most 366 days; it defaults to the
    current calendar month up to today (business clock). An invalid range shows a localized message
    and no request is made. Changing the period resets to the first page
  * **Always paged**, page size at most 100; sorted by recording time only — newest first
    (default) or oldest first
  * **Columns:**
    - **Дата / Date** — date and time the movement was recorded, with the name of the staff member
      who recorded it beneath (resolved from the user directory; "Unknown user" when it cannot be
      resolved)
    - **Тип / Type** — **Инкассация / Cash collection** (money left the cash drawer) or
      **Зачисление по терминалу / Terminal settlement** (money left the card terminal)
    - **Сумма / Amount** — amount in BYN, two decimals
  * There is no destination column (the destination is always the point's bank position) and no
    status column (there is no pending or cancelled state)
  * **Period totals** above the list: cash collected and terminal settlements for the selected
    period at this point, as reported by the backend's period results
  * There is **no row action menu** and no way to cancel, edit or reverse an entry here. A short
    localized note explains that a mistaken entry is corrected by an adjustment
  * **Header actions** on this tab:
    - **"Сдать в банк / Collect cash"** opens the cash collection dialog (FR-05), with the same
      availability rules as on the Касса tab (FR-03): disabled with a localized hint unless the
      point is active, and disabled when the CASH position is 0 or less
    - **"Зачислить в банк / Record settlement"** opens the terminal settlement dialog (FR-05),
      disabled with a localized hint only on a permanently closed point, and when the
      CARD_TERMINAL position is 0 or less
  * After a collection or settlement is recorded, the list (current period and order kept), the
    period totals, the header balance pills and the Cash tab data refresh
  * Collections and settlements are instant: there is no "pending / in transit" state
  * **Assumptions (pending backend confirmation):**
    - A9: The movements view has no filter by movement type. The history is therefore the point's
      **Bank** position movements for the period, which consist of cash collections and terminal
      settlements; any other kind found there (e.g. an adjustment) is shown with its own type
      name. No type filter is offered
    - A11: The period results, when given this point and the period, report the collected cash and
      the terminal settlements as separate totals
    - A13: A cash collection moves cash into the point's Bank position (same destination as a
      terminal settlement)
    - A14: The movement row does not carry the bank-statement settlement date, so the list shows
      only the recording date and time

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Server-side paging; a page loads within 2 seconds
* **Security/Compliance:** Admin-only (movement and results views are administrator views); the UI
  does not log personal data
* **Usability/Other:**
  * All labels, types, notes, hints and period messages localized en + ru
  * Empty state when no collections or settlements fall into the period
  * Load failure of the list or of the totals → standard error notification; the other part stays
    usable
  * **Backend dependency:** point movements and period results are published; field names
    follow the published API description

## 4. Acceptance Criteria (BDD)

**Scenario 1: History renders**

* **Given** point `center` had in October two cash collections (400.00 by "Анна К." on 15.10, 300.00
  by operator "Олег" on 28.10) and one terminal settlement of 830.50 recorded by "Анна К." on 20.10
* **When** the admin opens the Collections tab on 28.10
* **Then** the period 01.10–28.10 is preselected and 3 rows are shown newest first, each with date
  + recorded-by name, type and amount, and no actions menu

**Scenario 2: Period totals**

* **Given** the history above
* **When** the tab renders
* **Then** the totals show "Collected 700.00" and "Terminal settlements 830.50"

**Scenario 3: Period filter**

* **Given** collections on 01.10, 15.10 and 28.10
* **When** the admin sets the range 10.10–20.10
* **Then** only the 15.10 collection is shown, the list is on page 1 and the totals cover only
  10.10–20.10

**Scenario 4: Period too long**

* **Given** the Collections tab
* **When** the admin sets a range longer than 366 days
* **Then** a localized "The period may not exceed 366 days" message is shown and the list is not
  reloaded

**Scenario 5: No cancellation**

* **Given** any row in the history
* **When** the admin looks for a way to cancel it
* **Then** no cancel action exists, and the note explains that mistaken entries are corrected by an
  adjustment

**Scenario 6: Collect cash from this tab**

* **Given** the Collections tab of an active point with the default period
* **When** the admin records a cash collection
* **Then** the new collection appears at the top of the list, the "Collected" total increases by
  its amount and the header "Cash" pill decreases

**Scenario 7: Temporarily closed point**

* **Given** the point is temporarily closed
* **When** the Collections tab renders
* **Then** "Collect cash" is disabled with the active-point hint, "Record settlement" is enabled,
  and the history and totals remain available

**Scenario 8: Permanently closed point**

* **Given** the point is permanently closed
* **When** the Collections tab renders
* **Then** both header actions are disabled with their localized hints, while the history and
  totals remain available

## 5. Out of Scope

* Cancelling, reversing, editing or partially cancelling a collection or settlement (withdrawn —
  not offered by the backend; corrections are adjustments)
* Recording adjustments from this tab
* Filtering by type or status (see assumption A9)
* Showing the bank-statement settlement date in the list (see assumption A14)
* "In transit", bank confirmation or discrepancy handling
* Showing or managing bank account details
* Exporting history
* Cross-point (business-wide) collection history page
* Test files (MVP rule)
