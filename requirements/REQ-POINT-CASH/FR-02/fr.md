# User Story: FR-02 — Point Detail Shell and Профиль Tab

## 1. Description

**As an** admin user
**I want to** open a dedicated page for a rental point with a header showing its identity, status
and money balances, and tabs for its profile, cash, bank transfers and operations
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
    - Status pill (Active / Temporarily closed / Permanently closed, existing wording and colours)
    - Address and slug as secondary identity text
    - Two balance pills: **"Касса / Cash <amount>"** and **"Терминал / Terminal <amount>"** showing
      the point's current CASH and CARD_TERMINAL balances
  * **Tabs**, in order, each with its own deep-linkable URL:
    - **Профиль / Profile** — `/points/:slug/profile` (default; `/points/:slug` redirects here)
    - **Касса / Cash** — `/points/:slug/cash` (content: FR-03)
    - **Инкассации / Bank transfers** — `/points/:slug/transfers` (content: FR-04)
    - **Операции / Operations** — `/points/:slug/operations`
  * Switching tabs updates the URL without reloading the point or its balances
  * **Профиль tab** hosts the existing point edit form unchanged in behaviour: view/edit toggle,
    fields slug (read-only once created), name, address (street, city, country), contacts (primary
    phone, additional phone, email), the same validation, the same server-error binding
    (including the duplicate-slug error) and the same success message
  * The existing point **status actions** (activate, deactivate/temporarily close, permanently
    close) live on the Профиль tab with their current rules; after a status change the header
    status pill updates immediately, and transfer availability on the other tabs follows the new
    status (transfers are allowed only for active points — FR-03/FR-04/FR-05)
  * After a successful profile save, the header (name, address) reflects the new values without a
    page reload
  * **Point creation:** the "New point" action from the list (FR-01) opens the same profile form in
    create mode; after a successful create the admin lands on the new point's detail page
  * **Операции tab:** a paged list of all money movements on both point accounts (CASH and
    CARD_TERMINAL), newest first, with a date-range filter; each row shows time, type,
    customer · operator, account, signed amount
  * Header balances refresh whenever a transfer is made or cancelled from any tab (FR-04, FR-05)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Point data and balances load once per visit; tab switching must not refetch them
* **Security/Compliance:** Admin-only; cached point data is discarded when leaving the page
* **Usability/Other:**
  * Unknown slug → navigate back to `/points` and show a localized "point not found" notification
  * Balance load failure → balance pills show an em-dash; the rest of the page stays usable
  * All new labels (tab names, pill captions) localized en + ru
  * **Backend dependency:** per-point CASH and CARD_TERMINAL balances, and a paged per-point
    operations feed covering both accounts with a date-range filter (not available today)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Header shows identity, status and balances**

* **Given** point `center` "Центр", Active, address "ул. Ленина 1, Минск, Беларусь", cash 1 250.00,
  terminal 830.50
* **When** the admin opens `/points/center`
* **Then** the URL becomes `/points/center/profile`, the header shows "Центр", an "Active" pill,
  the address and `center`, and pills "Cash 1 250.00" and "Terminal 830.50"

**Scenario 2: Deep link to a tab**

* **Given** the admin opens `/points/center/transfers` directly
* **When** the page loads
* **Then** the "Bank transfers" tab is active

**Scenario 3: Tab switch keeps data**

* **Given** the admin is on the Profile tab
* **When** they switch to the Cash tab
* **Then** the URL changes to `/points/center/cash` and the point and header balances are not
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

**Scenario 9: Operations tab**

* **Given** the point had a cash rental payment yesterday and a terminal transfer to bank today
* **When** the admin opens the Operations tab
* **Then** both movements are listed newest first with time, type, customer · operator, account
  and signed amount

**Scenario 10: Operations date filter**

* **Given** the point has movements on 01.10 and 28.10
* **When** the admin sets the date range 20.10–31.10 on the Operations tab
* **Then** only the 28.10 movements are listed, starting from page 1

## 5. Out of Scope

* Changing the profile form's fields or validation rules
* Cash and transfer tab content (FR-03, FR-04) and the transfer dialog (FR-05)
* Exporting operations
* Test files (MVP rule)
