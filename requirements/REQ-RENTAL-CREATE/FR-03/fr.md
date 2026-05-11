# User Story: FR-03 — Route & Navigation Update

## 1. Description

**As an** operator
**I want to** reach the Create Rental flow via the URL `/rentals/new` and navigate back to it from the bottom navigation bar
**So that** the URL is consistent with the plural route naming convention used elsewhere in the operator app, and a rental can be resumed by navigating to `/rentals/new?id=:id`

## 2. Context & Business Rules

* **Trigger:** Operator taps the "New Rental" item in the bottom navigation bar or the dashboard surfaces a "Resume Draft" card
* **Rules Enforced:**
  * The existing route `rental/new` (singular) must be replaced with `rentals/new` (plural) in `projects/operator/src/app/app.routes.ts`
  * An optional `id` query parameter must be declared on the route; the `RentalCreateComponent` reads it via `input()` signal bound to the query param through `withComponentInputBinding()`
  * The bottom navigation link must be updated from `rental/new` to `rentals/new`
  * Any existing deep link or `routerLink` pointing to `rental/new` must also be updated
  * If `id` is present in the URL when the component initialises, the store's `loadRental(id)` method is called before the stepper renders
  * If `id` refers to a rental that no longer exists or is not in DRAFT status, the error is caught, the store is reset, and the operator is shown a snackbar notification; the stepper starts fresh on Step 1

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Route change is a refactor with no runtime overhead; `id` resolution is a single GET call that happens once on component init
* **Security/Compliance:** N/A — auth is intentionally unimplemented
* **Usability/Other:** The bottom nav "New Rental" icon and label remain unchanged; only the `routerLink` value changes

## 4. Acceptance Criteria (BDD)

**Scenario 1: Navigating to the new route loads the component**

* **Given** the operator app is running
* **When** the browser navigates to `/rentals/new`
* **Then** `RentalCreateComponent` is loaded and the stepper starts on Step 1

**Scenario 2: Old singular route does not exist**

* **Given** the operator app is running
* **When** the browser navigates to `/rental/new`
* **Then** the wildcard route redirects to the root (dashboard)

**Scenario 3: Bottom nav "New Rental" link navigates to updated route**

* **Given** the operator is on any screen
* **When** the "New Rental" bottom nav item is tapped
* **Then** the browser navigates to `/rentals/new`

**Scenario 4: id query parameter triggers rental load**

* **Given** a DRAFT rental with id `42` exists in the backend
* **When** the browser navigates to `/rentals/new?id=42`
* **Then** `RentalCreateComponent` calls `RentalStore.loadRental(42)` and the stepper advances to Step 2 with the rental data pre-populated

**Scenario 5: Invalid id shows error and resets flow**

* **Given** no rental with id `999` exists in DRAFT status
* **When** the browser navigates to `/rentals/new?id=999`
* **Then** a snackbar error message is displayed, the store is reset, and the stepper starts on Step 1

## 5. Out of Scope

* Creating a redirect from the old `rental/new` path to the new `rentals/new` path
* Deep-linking to a specific step within the flow
* Protecting the route with an auth guard (deferred to TASK002)
