# User Story: FR-01 — Points List with Money Overview

> **Revised 2026-10-31** to match the backend contract (`../backend_contract.md`). The backend model
> drives: the single "bank transfer" is replaced by **cash collection** and **terminal settlement**.
> The "last bank transfer" column is dropped by product decision (not needed).

## 1. Description

**As an** admin user
**I want to** see all rental points in one table showing each point's status, cash-drawer
position and card-terminal position, with business-wide totals above it
**So that** I can tell at a glance where money is building up and which points need a cash
collection or a terminal settlement, without opening each point

## 2. Context & Business Rules

* **Trigger:** Admin navigates to `/points` (existing "Points" item in the admin sidebar)
* **Rules Enforced:**
  * The current side-by-side list + edit form layout of the Points page is replaced by a
    full-width table, visually consistent with the Customers list page
  * Columns, in order:
    - **Точка / Point** — point name with the slug shown beneath it as secondary text
    - **Статус / Status** — status pill using the existing point-status wording and colours
      (Active, Temporarily closed, Permanently closed). The status is the point's **current**
      status; there is no status history
    - **Наличные в кассе / Cash in drawer** — the point's CASH position
    - **Терминал / Terminal** — the point's CARD_TERMINAL position
  * Money is shown in the business currency (BYN) with two decimals, right-aligned
  * Clicking anywhere on a row opens the point detail page `/points/:slug` (default tab — see FR-02)
  * All point positions for all points (including closed ones) come from one business-wide
    positions overview; positions are never fetched one point at a time
  * Three summary cards sit above the table:
    - **Наличные во всех кассах / Cash across all drawers** — business-wide total of the CASH
      position
    - **На счетах терминалов / On terminal accounts** — business-wide total of the CARD_TERMINAL
      position
    - **Зачислено в банк за <месяц> / Deposited to bank in <month>** — the period totals the backend
      reports for the current calendar month across all points: cash collections and terminal
      settlements, shown as a total with the collections / settlements split beneath; the month
      name is localized
  * Summary totals cover **all** points, including ones currently hidden by the closed-points
    filter, so the business totals never depend on a display toggle
  * **Closed-points filter:**
    - Permanently closed points are hidden by default
    - A checkbox **"Показывать закрытые точки / Show closed points"** reveals them
    - While hidden, a counter **"Скрыто закрытых: N / Closed hidden: N"** shows how many
      permanently closed points are not displayed; the counter is not shown when N = 0 or when
      the checkbox is on
    - Temporarily closed (inactive) points are always visible
  * A **"New point"** action on the list page (placement follows the Customers list "create"
    pattern) opens the point profile form in create mode (see FR-02)
  * The current calendar month for the third card is determined by the app's business clock (the
    same clock the app uses for other "this month" figures)
  * **Assumptions (pending backend confirmation):**
    - A11: The period results report cash collections and terminal settlements as separate totals
      for a period (business-wide when no point is given). No count of operations is assumed; the
      third card shows amounts only

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The list and summary cards should render within 2 seconds for up to ~50 points,
  using one positions overview request and one period-totals request — never one request per point
* **Security/Compliance:** Admin-only screen (point positions and period totals are available to
  administrators only); figures are read-only here
* **Usability/Other:**
  * All labels, column headers, card titles, the checkbox and the counter are localized (en + ru)
  * If positions fail to load while the point list loads, rows still render with an em-dash in the
    money columns and an error is surfaced through the standard error-handling toolkit; the same
    applies independently to the period totals card
  * Empty state message when there are no points at all
  * **Backend dependency:** the business-wide point positions overview and the period results are
    announced by the backend but not yet published; field names are final only once they appear in
    the published API description

## 4. Acceptance Criteria (BDD)

**Scenario 1: Table renders with money columns**

* **Given** point "Центр" (slug `center`, Active) has a CASH position of 1 250.00 BYN and a
  CARD_TERMINAL position of 830.50 BYN
* **When** the admin opens `/points`
* **Then** the row shows "Центр" with `center` beneath, an "Active" pill, `1 250.00` and `830.50`

**Scenario 2: Summary cards**

* **Given** three points with CASH positions 100, 200, 300 and CARD_TERMINAL positions 10, 20, 30,
  and this month cash collections totalling 700.00 and terminal settlements totalling 200.00
* **When** the admin opens `/points`
* **Then** the cards show "Cash across all drawers 600.00", "On terminal accounts 60.00" and
  "Deposited to bank in October 900.00" with "Collections 700.00 · Terminal settlements 200.00"
  beneath

**Scenario 3: A corrected collection is reflected through the backend totals**

* **Given** a mistaken collection this month was corrected by an adjustment
* **When** the admin opens `/points`
* **Then** the cards show exactly the figures the backend reports — the UI does not subtract or
  re-calculate anything itself

**Scenario 4: Permanently closed points hidden by default**

* **Given** 5 points, of which 2 are permanently closed and 1 is temporarily closed
* **When** the admin opens `/points`
* **Then** 3 rows are shown (including the temporarily closed one), the "Show closed points"
  checkbox is unchecked and the counter reads "Closed hidden: 2"

**Scenario 5: Showing closed points**

* **Given** the situation in Scenario 4
* **When** the admin checks "Show closed points"
* **Then** all 5 rows are shown, the permanently closed ones with the "Permanently closed" pill,
  and the hidden counter disappears

**Scenario 6: Summary totals independent of filter**

* **Given** a permanently closed point still holds 40.00 BYN cash and is hidden
* **When** the list renders with the filter off
* **Then** "Cash across all drawers" still includes the 40.00

**Scenario 7: Row opens point detail**

* **Given** the table is displayed
* **When** the admin clicks the row for `center`
* **Then** the app navigates to `/points/center`

**Scenario 8: Positions load failure**

* **Given** the point registry loads but the positions overview fails to load
* **When** the page renders
* **Then** all point rows are shown with em-dashes in the money columns, the two position cards
  show em-dashes, and an error notification is displayed

**Scenario 9: Status closed earlier today**

* **Given** a point was permanently closed earlier today
* **When** the admin opens `/points`
* **Then** the point is treated as permanently closed (hidden by default, counted in "Closed
  hidden")

## 5. Out of Scope

* A "Last collection / last bank transfer" column (date · who) — not needed (product decision)
* The BANK, REVENUE and CORRECTIONS positions as list columns
* A count of collections/settlements on the third card
* Sorting, searching or paging the points table (dataset is small)
* Cash limits or highlighting points above a threshold
* Any collection, settlement or shift action from the list itself (they start from the point
  detail — FR-03/FR-04/FR-05/FR-08)
* Point editing and status changes (moved to the Профиль tab — FR-02)
* Historical month selection for the "Deposited to bank" card
* Test files (MVP rule)
