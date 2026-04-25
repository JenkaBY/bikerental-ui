# User Story: FR-05 — Customer Rentals Tab

## 1. Description

**As an** admin user
**I want to** see a collapsible list of a customer's rentals with equipment detail on demand
**So that** I can review rental history and the individual return status of each piece of equipment

## 2. Context & Business Rules

* **Trigger:** User activates the Rentals tab at `/customers/:id/rentals`
* **Rules Enforced:**
  * Initial load calls `RentalsService.getRentals({ customerId })` (paginated, default page size 20)
  * Each rental row shows: start date, rental status chip, estimated cost
  * Each row is expandable — clicking it toggles an inline detail panel
  * Expanded panel loads `RentalsService.getRentalById(rentalId)` (single GET) and displays `equipmentItems` list with equipment UID and per-item status chip
  * Once loaded, equipment details are cached locally (do not re-fetch on collapse/re-expand)
  * Rental status chips resolve colour and label via `mapRentalStatus(slug)` (defined in FR-01); the chip `color` attribute is set from `RentalStatusMeta.colour`
  * Equipment item status chips resolve colour and label via `mapEquipmentItemStatus(slug)` (defined in FR-01); the chip `color` attribute is set from `EquipmentItemStatusMeta.colour`
  * "New Rental" button styled as a `mat-raised-button color="primary"` is always visible
  * Clicking "New Rental" shows a `MatSnackBar` message "Coming soon" — no navigation

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Equipment detail is fetched lazily on first expand only; subsequent expands use cached data
* **Security/Compliance:** N/A
* **Usability/Other:** Loading indicator shown while the rental list loads; per-rental loading indicator shown while equipment detail loads

## 4. Acceptance Criteria (BDD)

**Scenario 1: Rental list loads on tab activate**

* **Given** the user activates the Rentals tab
* **When** the component initialises
* **Then** `getRentals` is called with the customer's id and the rental summary rows are rendered

**Scenario 2: Collapsed row shows summary fields with status chip**

* **Given** the rental list is loaded and a rental has status `ACTIVE`
* **When** a row is in its default collapsed state
* **Then** it shows: rental start date, a status chip coloured using `mapRentalStatus('ACTIVE').colour`, and estimated cost

**Scenario 2a: DEBT status renders with warn colour**

* **Given** a rental with status `DEBT`
* **When** the row renders
* **Then** the status chip has `color="warn"` resolved via `mapRentalStatus('DEBT')`

**Scenario 3: Expanding a row loads and shows equipment items with status chips**

* **Given** the user clicks a collapsed rental row
* **When** the detail panel opens
* **Then** `getRentalById` is called and each equipment item is shown with its UID and a status chip coloured via `mapEquipmentItemStatus(slug)`

**Scenario 4: Detail cached after first expand**

* **Given** the user has expanded a rental row and its detail loaded
* **When** the user collapses and re-expands the same row
* **Then** no additional HTTP call is made

**Scenario 5: New Rental button shows snackbar**

* **Given** the Rentals tab is active
* **When** the user clicks the "New Rental" button
* **Then** a `MatSnackBar` with the message "Coming soon" is shown and no navigation occurs

**Scenario 6: Rental list API error**

* **Given** `getRentals` returns an HTTP error
* **When** the tab initialises
* **Then** an error snackbar is shown and an empty list is displayed

## 5. Out of Scope

* Creating, editing, or cancelling rentals
* Returning equipment from this tab
* Pagination controls beyond default page size (may be added in a future story)
