# System Design: FR-02 — Rental Dashboard Page Shell & Active Tab

## 1. Architectural Overview

FR-02 replaces the existing `DashboardComponent` placeholder in the Operator SPA with a fully
functional `RentalDashboardComponent` that serves as the root of the `/rentals` route. This
component acts as the smart container for the entire dashboard feature: it provides `RentalListStore`
at its own level (binding the store's lifetime to the route), reads the `?tab=` URL query parameter
to control which tab body is rendered, and exposes a refresh action that delegates to the appropriate
store load method based on the active tab.

The two-tab layout (Active / Today's History) is driven entirely by URL state. Tab switching is
implemented as a URL parameter update — no in-memory navigation or separate route segments — ensuring
the browser back button and deep-linking both work correctly. The store provision at this level means
a fresh store instance is created on each visit to `/rentals`, preventing stale data across route
navigations.

## 2. Impacted Components

* **`DashboardComponent` (Operator SPA — existing placeholder):** Replaced entirely by
  `RentalDashboardComponent`. The route binding at the operator route `''` (or `'rentals'`) is
  updated to point to the new component. The placeholder source file is removed.

* **`RentalDashboardComponent` (Operator SPA — new smart page):** *(New component)* Serves as the
  root container for the `/rentals` route. Responsibilities:
  - Provides `RentalListStore` in its own `providers` array so the store lifetime is tied to this
    route visit.
  - Reads the `tab` URL query parameter to determine the active tab; defaults to `active` when
    absent.
  - Renders the top bar with a page title and a refresh icon button.
  - Renders the two-tab navigation bar (Active / Today's History).
  - Conditionally renders either `RentalActiveTabComponent` or `RentalHistoryTabComponent` based
    on the active tab signal, removing the inactive tab from the DOM.
  - On refresh tap: calls `RentalListStore.loadActive()` when the Active tab is selected, or
    `RentalListStore.loadHistory(today, today)` when the History tab is selected.
  - Disables and shows a loading indicator on the refresh button while `isLoadingActive` or
    `isLoadingHistory` (respectively) is `true`.
  - Initiates the initial data load for the Active tab on component initialisation.

* **`RentalActiveTabComponent` (Operator SPA — new dumb tab body):** *(New component)* Renders
  the subtitle row (active rental count + sort description) and hosts the active rental card list
  (FR-04). Receives `activeRentals` and `isLoadingActive` from its parent via inputs.

* **Operator SPA Router Configuration:** The `/rentals` route definition is updated to map to
  `RentalDashboardComponent`. The `:id` child route (`/rentals/:id`) remains as a sibling or child
  for the detail page (FR-06).

## 3. Abstract Data Schema Changes

No new persistent schema changes. The `tab` query parameter (`active` | `history`) is transient URL
state and does not require backend storage.

## 4. Component Contracts & Payloads

* **Interaction: `RentalDashboardComponent` -> `RentalListStore` (initial load)**
  * **Protocol:** In-process method call
  * **Payload Changes:** On init, calls `RentalListStore.loadActive()` unconditionally.
    If the initial URL has `?tab=history`, also triggers `RentalListStore.loadHistory(today, today)`.

* **Interaction: `RentalDashboardComponent` -> Angular Router (tab switch)**
  * **Protocol:** In-process navigation (URL update, no page reload)
  * **Payload Changes:** Tab switch writes `?tab=active` or `?tab=history` to the URL query string
    using `replaceUrl: true` semantics to avoid polluting the browser history stack.

* **Interaction: `RentalDashboardComponent` -> `RentalActiveTabComponent`**
  * **Protocol:** In-process input binding
  * **Payload Changes:** Passes `activeRentals: RentalListItem[]` and `isLoadingActive: boolean`
    as read-only inputs.

## 5. Updated Interaction Sequence

### Scenario: Operator opens /rentals (first visit, no query params)

1. Angular Router activates `RentalDashboardComponent` for the `/rentals` route.
2. `RentalDashboardComponent` provides `RentalListStore`, creating a fresh instance.
3. Component reads `?tab=` query parameter — absent, so `activeTab = 'active'`.
4. Component calls `RentalListStore.loadActive()` on initialisation.
5. `RentalListStore` sets `isLoadingActive = true` and begins the batch load (see FR-01 sequence).
6. `RentalDashboardComponent` renders: top bar (title + disabled refresh button with spinner),
   tab bar with "Active" selected, and `RentalActiveTabComponent` in the body.
7. `RentalActiveTabComponent` shows a loading skeleton while `isLoadingActive` is `true`.
8. `RentalListStore` completes the load; `isLoadingActive` becomes `false`; `activeRentals`
   is populated.
9. The refresh button becomes enabled; `RentalActiveTabComponent` renders the card list.

### Scenario: Operator taps "Today's History" tab

1. `RentalDashboardComponent` updates the URL to `?tab=history` (replaceUrl).
2. `activeTab` signal changes to `'history'`; `RentalActiveTabComponent` is removed from the DOM.
3. `RentalHistoryTabComponent` is inserted; it signals the parent to load history data (or the
   parent detects tab change and calls `RentalListStore.loadHistory(today, today)` if
   `historyRentals` is empty).
4. History load proceeds; the tab body shows a loading state until complete.

### Scenario: Operator taps the refresh button (Active tab)

1. `RentalDashboardComponent` calls `RentalListStore.loadActive()`.
2. `isLoadingActive` becomes `true`; the refresh button is disabled with a spinner.
3. Load completes; `isLoadingActive` becomes `false`; button re-enables.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No authentication required at this stage (per project constraints). The
  route is open.
* **Scale & Performance:** Tab switching must not cause a full route reload or re-provision the
  store. Only the tab body subtree re-renders on tab change. The `RentalListStore` instance
  survives tab switches within the same dashboard visit.
