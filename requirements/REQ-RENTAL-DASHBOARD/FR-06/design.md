# System Design: FR-06 — Rental Detail Page Shell

## 1. Architectural Overview

FR-06 introduces `RentalDetailComponent` at the `/rentals/:id` route in the Operator SPA. This
smart component acts as the shell for all rental detail sections (FR-07 through FR-12): it fetches
rental detail data on activation, provides a feature-scoped `RentalDetailStore` at its own level,
and conditionally renders an overdue or debt banner below the top bar. All sections receive their
data and interaction interface from `RentalDetailStore` via the shared `RENTAL_STORE_TOKEN`
injection token (introduced in FR-07).

The top bar shows the rental ID as a title and the status badge on the right. Back-navigation
preserves the dashboard's `?tab=` and `?filter=` parameters by reading them from the navigation
state or by using the browser history. The route handles ACTIVE, DEBT, COMPLETED, and CANCELLED
rentals; **DRAFT rentals are explicitly out of scope for this route** — tapping a DRAFT card in
the history tab redirects to the Create Rental stepper (step 2) rather than opening this detail
page. The component adapts its rendering based on `RentalDetailState.status`.

**Immutability constraint:** Once a rental has started, its parameters (planned duration,
equipment list, customer, tariff) are immutable. The detail page exposes **no edit or update
functionality**. The only permitted backend mutations are the two lifecycle transitions:
returning the equipment (FR-12) and cancelling the rental (FR-12). All other sections on this
page are strictly read-only displays of persisted rental state.

## 2. Impacted Components

* **`RentalDetailComponent` (Operator SPA — new smart page):** *(New component)* Mapped to the
  `/rentals/:id` route. Responsibilities:
  - Provides `RentalDetailStore` in its own `providers` array (feature-scoped).
  - On activation, reads the `:id` route parameter and calls `RentalDetailStore.load(id)`.
  - Renders the top bar: back button (left), "Rental #N" title (center), status badge (right).
  - Back button navigates to `/rentals` restoring the previous `?tab=` and `?filter=` parameters
    (read from router navigation extras or stored in `RentalDetailStore` on entry).
  - Conditionally renders the overdue banner when `isActive && isOverdue` — full-width warning
    strip with overdue duration and expected return time.
  - Conditionally renders the debt banner when `isDebt` — full-width warning strip with debt
    amount and auto-charge message.
  - Overdue and debt banners are mutually exclusive.
  - While `isLoading` is `true`: renders a loading spinner; section body is not rendered.
  - On API failure: renders an error message with a retry button that re-calls `load(id)`.
  - When data is loaded: renders the scrollable section body containing FR-07 through FR-12
    sections.

* **`RentalDetailStore` (Operator SPA — new feature-scoped store):** *(New component)* Provided at
  `RentalDetailComponent` level. Internal state type is `RentalDetailState` (FR-01). Responsibilities:
  - Exposes `load(id): void` — fetches rental detail via `RentalsService.getRentalById(id)`,
    fetches the associated customer via `CustomersService.getById(customerId)`, maps the response
    via `RentalDashboardMapper.toDetailState()`, and merges the result into the state signal.
  - Exposes all `RentalDetailState` signals needed by child section components.
  - Exposes `isLoading: boolean` and `loadError: boolean` signals.
  - Implements the `RENTAL_STORE_TOKEN` interface (introduced in FR-07/FR-10) to allow
    `RentalCustomerPanelComponent` and `RentalPricingSectionComponent` to inject it.
  - Exposes **no rental-parameter mutation methods**. The only write operations are lifecycle
    actions added in FR-12 (`returnEquipment()` and `cancelRental()`), local UI state
    mutations (equipment selection, broken entries, pricing adjustments), and the balance
    refresh triggered by the top-up dialog (FR-07).

* **Operator SPA Router Configuration:** A `/rentals/:id` route is added as a sibling to
  `/rentals` (or as a child if the dashboard is the parent route). The route maps to
  `RentalDetailComponent` and is lazy-loaded with the dashboard feature module.

## 3. Abstract Data Schema Changes

No new persistent backend schema changes beyond FR-01. The `RentalDetailState` state shape was
defined in FR-01; this FR activates its use.

## 4. Component Contracts & Payloads

* **Interaction: `RentalDetailComponent` -> `RentalDetailStore` (initial load)**
  * **Protocol:** In-process method call
  * **Payload Changes:** Calls `RentalDetailStore.load(id)` where `id` is the numeric rental ID
    extracted from the route parameters.

* **Interaction: `RentalDetailStore` -> `RentalsService` (get rental detail)**
  * **Protocol:** REST (GET)
  * **Payload Changes:** `GET /api/rentals/{id}` — returns `RentalResponse`; no new fields
    required on the request side.

* **Interaction: `RentalDetailStore` -> `CustomersService` (get customer)**
  * **Protocol:** REST (GET)
  * **Payload Changes:** `GET /api/customers/{customerId}` — returns `CustomerResponse`.

* **Interaction: `RentalDetailComponent` -> Angular Router (back navigation)**
  * **Protocol:** In-process navigation
  * **Payload Changes:** Navigates to `/rentals` with the previously captured `?tab=` and
    `?filter=` parameters restored as query params.

## 5. Updated Interaction Sequence

### Scenario: Operator navigates to /rentals/42 (Active rental)

1. Angular Router activates `RentalDetailComponent` for `/rentals/42`.
2. Component provides `RentalDetailStore`, creating a fresh instance.
3. Component reads route param `id = 42`; calls `RentalDetailStore.load(42)`.
4. `RentalDetailStore` sets `isLoading = true`.
5. Store calls `RentalsService.getRentalById(42)` in parallel with
   `CustomersService.getById(customerId)` (customerId extracted from rental response).
6. Both responses arrive; store applies `RentalDashboardMapper.toDetailState()` to populate
   `RentalDetailState`.
7. `isLoading` becomes `false`; `isActive = true`, `isOverdue = false` (example).
8. `RentalDetailComponent` renders: top bar with "Rental #42" and "Active" badge; no banner;
   scrollable section body with FR-07–FR-12 sections.

### Scenario: API fails to load rental

1. `RentalDetailStore.load(42)` is called; the API call fails.
2. `isLoading = false`; `loadError = true`.
3. `RentalDetailComponent` renders an error message and a retry button.
4. Operator taps retry; `load(42)` is called again.

### Scenario: Back navigation preserves dashboard state

1. Operator arrived at `/rentals/42` from `/rentals?tab=history&filter=DEBT`.
2. `RentalDetailComponent` stores the previous URL parameters in `RentalDetailStore` or reads
   them from the router navigation extras on entry.
3. Operator taps the back button.
4. Router navigates to `/rentals?tab=history&filter=DEBT`.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No authentication required at this stage. Route is open.
* **Scale & Performance:** The top bar and back button are interactive immediately (rendered
  synchronously); the section body appears only after the data load resolves. The two API calls
  (`getRentalById` and `getById`) are made concurrently to minimize total load time. No polling
  is implemented; the detail page is a snapshot of rental state at load time.
