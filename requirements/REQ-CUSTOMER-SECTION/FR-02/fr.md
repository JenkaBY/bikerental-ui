# User Story: FR-02 — Customer List Screen

## 1. Description

**As an** admin user
**I want to** see a searchable list of customers at `/customers`
**So that** I can quickly find and navigate to a specific customer's detail page

## 2. Context & Business Rules

* **Trigger:** User navigates to `/customers` in the admin application
* **Rules Enforced:**
  * The existing stub at `projects/admin/src/app/customers/customer-list.component.ts` must be replaced with the full implementation
  * Search calls `CustomersService.searchByPhone()` — the `GET /api/customers?phone=` endpoint; when the search field is empty the component fetches the full list (empty phone param)
  * Search input is debounced 300 ms before triggering an API call
  * Minimum search length is 4 character; clearing the field reloads(retruns from a cache) the full list
  * On mobile (viewport `< md` breakpoint): display as `mat-card` list
  * On desktop (viewport `≥ md` breakpoint): display as `mat-table`
  * Clicking any card or table row navigates to `/customers/:id`
  * No inline editing on this screen

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Search API call debounced 300 ms; loading spinner shown during HTTP request
* **Security/Compliance:** N/A
* **Usability/Other:** Empty state message displayed when search returns zero results; error state displayed on HTTP failure

## 4. Acceptance Criteria (BDD)

**Scenario 1: Initial load shows full customer list**

* **Given** the user navigates to `/customers`
* **When** the component initialises
* **Then** the component calls the API with an empty phone query and renders all returned customers

**Scenario 2: Typing in the search field filters results**

* **Given** the customer list is loaded
* **When** the user types a phone fragment into the search input
* **Then** after 300 ms debounce a new API call is made and the list re-renders with matching results

**Scenario 3: Card layout on mobile**

* **Given** the viewport width is below the `md` breakpoint
* **When** the list renders
* **Then** each customer is shown as a `mat-card` showing phone, first name, and last name

**Scenario 4: Table layout on desktop**

* **Given** the viewport width is at or above the `md` breakpoint
* **When** the list renders
* **Then** customers are shown in a `mat-table` with columns: phone, first name, last name

**Scenario 5: Navigate to customer detail**

* **Given** the customer list is visible
* **When** the user clicks a card or table row
* **Then** the router navigates to `/customers/:id` for that customer

**Scenario 6: Empty search result**

* **Given** a search query returns zero customers
* **When** the list renders
* **Then** an empty-state message is shown (no cards or rows)

**Scenario 7: API error**

* **Given** the API call fails
* **When** the component is loading
* **Then** an error message is shown via `MatSnackBar` and the list is left empty

## 5. Out of Scope

* Creating customers from this screen
* Bulk selection or deletion
* Server-side pagination on this screen (all results from search endpoint are displayed)
* Sorting columns
