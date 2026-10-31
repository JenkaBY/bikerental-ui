# User Story: FR-02 — Point Detail Shell, Профиль Tab and Операции Tab

> **Revised 2026-10-31** to match the backend contract (`../backend_contract.md`). The Operations
> tab now follows the backend's point-movements view: one point position at a time, a mandatory
> period of at most 366 days, always paged (page size ≤ 100), sorted by recording time only, and
> performers shown by resolving user ids to names. Header balances refresh after a collection, a
> terminal settlement or a shift closure (there is no cancellation).

## 1. Description

**As an** admin user
**I want to** open a dedicated page for a rental point with a header showing its identity, status
and money positions, and tabs for its profile, cash, collections & settlements, and operations
**So that** everything about one point — its details and its money — is managed in one place, the
same way customers are

## 2. Context & Business Rules

* **Trigger:** Admin clicks a row in the points list (FR-01), or navigates directly to
  `/points/:slug` or one of its tab routes
* **Rules Enforced:**
  * The page mirrors the customer detail page layout and uses the shared page header and
    segmented tabs used there
  * **Page header** shows:
    - Back button → returns to `/points`
    - Point name as the title
    - Status pill (Active / Temporarily closed / Permanently closed, existing wording and colours) —
      always the point's current status
    - Address and slug as secondary identity text
    - Two balance pills: **"Касса / Cash <amount>"** and **"Терминал / Terminal <amount>"** showing
      the point's current CASH and CARD_TERMINAL positions
  * **Tabs**, in order, each with its own deep-linkable URL:
    - **Профиль / Profile** — `/points/:slug/profile` (default; `/points/:slug` redirects here)
    - **Касса / Cash** — `/points/:slug/cash` (content: FR-03; shift closure: FR-08)
    - **Инкассации / Collections** — `/points/:slug/transfers` (content: FR-04 — cash collections
      and terminal settlements)
    - **Операции / Operations** — `/points/:slug/operations`
  * Switching tabs updates the URL without reloading the point or its positions
  * **Профиль tab** hosts the existing point edit form unchanged in behaviour: view/edit toggle,
    fields slug (read-only once created), name, address (street, city, country), contacts (primary
    phone, additional phone, email), the same validation, the same server-error binding
    (including the duplicate-slug error) and the same success message
  * The existing point **status actions** (activate, deactivate/temporarily close, permanently
    close) live on the Профиль tab with their current rules; after a status change the header
    status pill updates immediately, and the availability of collection and settlement actions on
    the other tabs follows the new status (FR-03/FR-04/FR-05)
  * After a successful profile save, the header (name, address) reflects the new values without a
    page reload
  * **Point creation:** the "New point" action from the list (FR-01) opens the same profile form in
    create mode; after a successful create the admin lands on the new point's detail page
  * **Операции tab** — the point's money movements, one position at a time:
    - **Position selector:** Касса / Cash (default), Терминал / Terminal, Банк / Bank
    - **Period (from / to, inclusive) is always required** and may span at most 366 days; it
      defaults to the current calendar month up to today (business clock). A longer or incomplete
      range is rejected with a localized message and no request is made
    - **Always paged**, page size at most 100; changing the position or the period resets to the
      first page
    - **Sorting** only by recording time — newest first (default) or oldest first; no other sort
      columns
    - **Columns:** date and time, movement type, customer (a link to the customer's page when the
      movement relates to a customer; em-dash otherwise), recorded by (staff member's name),
      signed amount, running balance of the selected position after that movement
    - **Movement types** (localized): Deposit, Withdrawal, Rental payment (capture), Penalty,
      Adjustment, Cash collection, Terminal settlement, Shift discrepancy. There is no "transfer
      cancelled" type
    - Signed amounts: inflows "+" with positive styling, outflows "−" with warn styling (same
      convention as the customer transactions tab)
  * **Staff names:** movements identify the recording staff member by an id only; the admin app
    resolves ids to names from the user directory. An id that cannot be resolved shows a localized
    "Unknown user" placeholder — never the raw id
  * Header balances refresh whenever a cash collection, a terminal settlement or a shift closure is
    recorded from any tab (FR-03, FR-04, FR-05, FR-08)
  * **Assumptions (pending backend confirmation):**
    - A8: The movements view requires a single position per request, so the tab shows one position
      at a time; a combined all-positions list is not assumed
    - A10: Movements carry only a customer reference, not a customer name, so the customer is shown
      as a link to the customer's page

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Point data and positions load once per visit; tab switching must not refetch
  them. The user directory is loaded at most once per visit, not once per row
* **Security/Compliance:** Admin-only (positions, movements and the user directory are
  administrator views); cached point data is discarded when leaving the page; the UI does not log
  personal data
* **Usability/Other:**
  * Unknown slug → navigate back to `/points` and show a localized "point not found" notification
  * Positions load failure → balance pills show an em-dash; the rest of the page stays usable
  * User directory load failure → the recorded-by column shows the "Unknown user" placeholder; the
    movement list still renders
  * All new labels (tab names, pill captions, position selector, movement types, period validation
    messages) localized en + ru
  * **Backend dependency:** point positions and point movements are announced but not yet
    published; field names are final only once they appear in the published API description

## 4. Acceptance Criteria (BDD)

**Scenario 1: Header shows identity, status and positions**

* **Given** point `center` "Центр", Active, address "ул. Ленина 1, Минск, Беларусь", CASH 1 250.00,
  CARD_TERMINAL 830.50
* **When** the admin opens `/points/center`
* **Then** the URL becomes `/points/center/profile`, the header shows "Центр", an "Active" pill,
  the address and `center`, and pills "Cash 1 250.00" and "Terminal 830.50"

**Scenario 2: Deep link to a tab**

* **Given** the admin opens `/points/center/transfers` directly
* **When** the page loads
* **Then** the "Collections" tab is active

**Scenario 3: Tab switch keeps data**

* **Given** the admin is on the Profile tab
* **When** they switch to the Cash tab
* **Then** the URL changes to `/points/center/cash` and the point and header positions are not
  reloaded

**Scenario 4: Back to list**

* **Given** the admin is on any `/points/:slug/**` route
* **When** they click Back
* **Then** they are taken to `/points`

**Scenario 5: Profile edit preserved**

* **Given** the Profile tab in view mode
* **When** the admin clicks Edit, changes the name to "Центр-2" and saves successfully
* **Then** a success message is shown, the form returns to view mode and the header title reads
  "Центр-2"

**Scenario 6: Status change reflected in header**

* **Given** an Active point
* **When** the admin temporarily closes it from the Profile tab
* **Then** the header status pill changes to "Temporarily closed"

**Scenario 7: Create a new point**

* **Given** the admin chose "New point" on the list
* **When** they fill in the form and save successfully
* **Then** they land on `/points/<new-slug>/profile` for the new point

**Scenario 8: Unknown point**

* **Given** no point has slug `nowhere`
* **When** the admin opens `/points/nowhere`
* **Then** they are returned to `/points` and a "point not found" notification is shown

**Scenario 9: Operations tab defaults**

* **Given** today is 28.10.2026 and the point's cash drawer had a rental payment recorded by
  operator "Олег" (user directory entry) on 27.10 and a cash collection on 28.10
* **When** the admin opens the Operations tab
* **Then** the Cash position is selected, the period is 01.10.2026–28.10.2026, and both movements
  are listed newest first with date/time, type ("Cash collection", "Rental payment"), customer,
  "Олег" as recorded by, signed amount and running balance

**Scenario 10: Switching position**

* **Given** the Operations tab on the Cash position, page 3
* **When** the admin selects the Terminal position
* **Then** the terminal movements for the same period are listed from page 1, each with the
  terminal's running balance

**Scenario 11: Period too long**

* **Given** the Operations tab
* **When** the admin sets the period 01.01.2025–31.10.2026
* **Then** a localized "The period may not exceed 366 days" message is shown and the list is not
  reloaded

**Scenario 12: Oldest first**

* **Given** the Operations tab lists movements newest first
* **When** the admin switches the order to oldest first
* **Then** the list restarts at page 1 with the earliest movement of the period at the top

**Scenario 13: Unresolvable staff member**

* **Given** a movement recorded by a user who is not in the user directory
* **When** the Operations tab renders it
* **Then** its recorded-by cell shows "Unknown user"

**Scenario 14: Shift discrepancy visible**

* **Given** a shift at the point was closed with a 20.00 shortage (FR-08)
* **When** the admin opens the Operations tab on the Cash position for that day
* **Then** a "Shift discrepancy −20.00" movement is listed with the person who closed the shift

## 5. Out of Scope

* Showing all positions in one combined list (see assumption A8)
* The REVENUE and CORRECTIONS positions in the position selector
* Filtering movements by type
* Customer names in the movement list (see assumption A10)
* Links to rentals from movement rows
* Unpaged / "show all" mode and sorting by any column other than recording time
* Changing the profile form's fields or validation rules
* Cash and collections tab content (FR-03, FR-04), the collection/settlement dialogs (FR-05) and
  shift closure (FR-08)
* Exporting operations
* Test files (MVP rule)
