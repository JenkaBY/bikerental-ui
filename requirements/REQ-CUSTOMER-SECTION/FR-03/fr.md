# User Story: FR-03 — Customer Detail Shell

## 1. Description

**As an** admin user
**I want to** open a customer detail page with a persistent back button and tab navigation that reflects the current tab in the URL
**So that** I can deep-link to any tab and always return to the customer list without using the browser back button

## 2. Context & Business Rules

* **Trigger:** User navigates to `/customers/:id` or any of its child routes
* **Rules Enforced:**
  * The shell component at `customer-detail.component.ts` owns the tab group and back button; the four tab content areas are separate child components loaded via Angular Router child routes
  * Route mapping:
    - `/customers/:id` → redirect to `/customers/:id/profile`
    - `/customers/:id/profile` → Profile tab (index 0)
    - `/customers/:id/rentals` → Rentals tab (index 1)
    - `/customers/:id/account` → Account tab (index 2)
    - `/customers/:id/transactions` → Transactions tab (index 3)
  * The shell loads and caches customer data on init — it fetches two sources in parallel:
    - `CustomersService.getById(id)` → customer profile (`phone`, `firstName`, `lastName`, `email`, `birthDate`, `notes`)
    - `FinanceService.getBalances(customerId)` → `available` and `reserved` balances
  * Both results are held in shell-level signals; child tab components receive data via `input()` signals — they must not re-fetch data the shell already owns
  * The header area always displays: phone, first name + last name, available balance, reserved balance
  * All cached signals are destroyed when the user navigates away from the customer-detail route (shell component destroyed)
  * Switching tabs updates the URL via `router.navigate([...])` — no full page reload; cached data is NOT re-fetched on tab switch
  * The back button always navigates to `/customers`
  * On mobile: `mat-tab-group` uses `[mat-stretch-tabs]="false"` for a scrollable strip
  * On desktop: standard `mat-tab-group` (default stretch behaviour)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Customer profile and balances fetched once per detail page visit via parallel requests; tab switching never triggers additional HTTP calls for data already cached in the shell
* **Security/Compliance:** Cached data lives only in component memory; it is discarded when the shell is destroyed
* **Usability/Other:** If `customerId` does not resolve (404), navigate back to `/customers` and show a snackbar; if balance load fails, display a dash placeholder — do not block the page

## 4. Acceptance Criteria (BDD)

**Scenario 1: Back button navigates to list**

* **Given** the user is on any `/customers/:id/**` route
* **When** the user clicks the Back button
* **Then** the router navigates to `/customers`

**Scenario 2: Header shows customer identity and balances**

* **Given** `CustomerResponse` returns `phone: '+375291234567'`, `firstName: 'Ivan'`, `lastName: 'Petrov'` and `getBalances` returns `available: 150.00`, `reserved: 30.00`
* **When** the shell renders
* **Then** the header displays `+375291234567`, `Ivan Petrov`, available balance `150.00`, and reserved balance `30.00`

**Scenario 2a: Balance load failure shows placeholder**

* **Given** `getBalances` returns an HTTP error
* **When** the shell renders
* **Then** the header displays the customer name and phone normally, and balance fields show a dash (`—`) placeholder without blocking navigation

**Scenario 3: Deep-linking to a tab selects the correct tab**

* **Given** the user navigates directly to `/customers/abc-123/rentals`
* **When** the shell component initialises
* **Then** the Rentals tab (index 1) is active

**Scenario 4: Switching tabs updates the URL and does not re-fetch data**

* **Given** the user is on the Profile tab and customer data is already cached in the shell
* **When** the user clicks the Transactions tab
* **Then** the URL changes to `/customers/:id/transactions`, no HTTP calls are made, and the cached data is still available

**Scenario 4a: Cache destroyed on navigation away**

* **Given** the user is on `/customers/:id/account` and data is cached
* **When** the user navigates to `/customers` (back button or direct)
* **Then** the shell component is destroyed and all cached signals are discarded; navigating back to the same customer triggers fresh HTTP calls

**Scenario 5: Unknown customer id**

* **Given** `CustomersService.getById(id)` returns HTTP 404
* **When** the shell initialises
* **Then** the router navigates to `/customers` and a snackbar message is shown

## 5. Out of Scope

* Tab-specific data not owned by the shell (e.g. rental list, transaction history — those tabs fetch and manage their own data)
* Persistent cross-session caching (e.g. localStorage or a global store)
* Manual cache invalidation controls
* Breadcrumb navigation beyond the single Back button
* Customer avatar or photo
