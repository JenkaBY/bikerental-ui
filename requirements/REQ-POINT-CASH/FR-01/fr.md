# User Story: FR-01 — Points List with Money Overview

## 1. Description

**As an** admin user
**I want to** see all rental points in one table showing each point's status, cash-drawer
balance, terminal-account balance and last bank transfer, with business-wide totals above it
**So that** I can tell at a glance where money is building up and which points need a bank
transfer, without opening each point

## 2. Context & Business Rules

* **Trigger:** Admin navigates to `/points` (existing "Points" item in the admin sidebar)
* **Rules Enforced:**
  * The current side-by-side list + edit form layout of the Points page is replaced by a
    full-width table, visually consistent with the Customers list page
  * Columns, in order:
    - **Точка / Point** — point name with the slug shown beneath it as secondary text
    - **Статус / Status** — status pill using the existing point-status wording and colours
      (Active, Temporarily closed, Permanently closed)
    - **Наличные в кассе / Cash in drawer** — the point's CASH account balance
    - **Терминал / Terminal** — the point's CARD_TERMINAL account balance
    - **Последняя инкассация / Last bank transfer** — date of the most recent *completed*
      transfer from either account of the point, followed by "·" and the name of the person who
      made it; an em-dash when the point has never transferred
  * Money is shown in the business currency (BYN) with two decimals, right-aligned
  * Clicking anywhere on a row opens the point detail page `/points/:slug` (default tab — see FR-02)
  * Three summary cards sit above the table:
    - **Наличные во всех кассах / Cash across all drawers** — sum of CASH balances
    - **На счетах терминалов / On terminal accounts** — sum of CARD_TERMINAL balances
    - **Зачислено в банк за <месяц> / Deposited to bank in <month>** — sum and count of completed
      (not cancelled) transfers to the bank in the current calendar month, across all points;
      the month name is localized
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
    same clock the app uses for other "today/this month" figures)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The list and summary cards should render within 2 seconds for up to ~50 points;
  balances must not be fetched one request per point if the backend can supply them in bulk
* **Security/Compliance:** Admin-only screen (existing admin authentication); balances are
  read-only here
* **Usability/Other:**
  * All labels, column headers, card titles, the checkbox and the counter are localized (en + ru)
  * If balances fail to load while the point list loads, rows still render with an em-dash in the
    money columns and an error is surfaced through the standard error-handling toolkit
  * Empty state message when there are no points at all
  * **Backend dependency:** the UI needs, per point, the CASH and CARD_TERMINAL balances and
    the most recent completed transfer (date + performer name), plus the month-to-date
    completed-transfer sum and count. None of this is exposed by the current API.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Table renders with money columns**

* **Given** point "Центр" (slug `center`, Active) has cash 1 250.00 BYN, terminal 830.50 BYN and a
  last transfer on 28.10.2026 by "Анна К."
* **When** the admin opens `/points`
* **Then** the row shows "Центр" with `center` beneath, an "Active" pill, `1 250.00`, `830.50` and
  `28.10.2026 · Анна К.`

**Scenario 2: Point without transfers**

* **Given** a point that has never transferred money to the bank
* **When** the table renders
* **Then** its "Last bank transfer" cell shows an em-dash

**Scenario 3: Summary cards**

* **Given** three points with cash balances 100, 200, 300 and terminal balances 10, 20, 30, and
  this month there are 4 completed transfers totalling 900.00 and 1 cancelled transfer of 50.00
* **When** the admin opens `/points`
* **Then** the cards show "Cash across all drawers 600.00", "On terminal accounts 60.00" and
  "Deposited to bank in October 900.00 · 4 transfers"

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

**Scenario 8: Balance load failure**

* **Given** the point registry loads but balances fail to load
* **When** the page renders
* **Then** all point rows are shown with em-dashes in the money and last-transfer columns, the
  summary cards show em-dashes, and an error notification is displayed

## 5. Out of Scope

* Sorting, searching or paging the points table (dataset is small)
* Cash limits or highlighting points above a threshold
* Any transfer action from the list itself (transfers start from the point detail — FR-03/FR-04/FR-05)
* Point editing and status changes (moved to the Профиль tab — FR-02)
* Historical month selection for the "Deposited to bank" card
* Test files (MVP rule)
