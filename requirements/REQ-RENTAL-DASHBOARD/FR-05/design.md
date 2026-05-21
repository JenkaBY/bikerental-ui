# System Design: FR-05 — History Rental Card List

## 1. Architectural Overview

FR-05 introduces `RentalHistoryCardListComponent`, the display component for today's closed and
draft rentals in the "Today's History" tab. It reuses `RentalCardComponent` (introduced in FR-04)
with the `history` variant to render a context-appropriate row-2 (completion time for normal
rentals; debt amount + completion time for debt rentals). Client-side filtering is applied upstream
in `RentalHistoryTabComponent` (FR-03) before the list reaches this component, so
`RentalHistoryCardListComponent` receives only the subset matching the active filter.

Debt cards receive the same warning visual treatment as overdue active cards, driven by the
`isDebt` flag on `RentalListItem`. Since `debtAmount` is listed as a detail-only field in FR-01
and is not present on `RentalListItem`, the history card's row-2 debt display must instead rely on
contextual status information or a future amendment to expose a lightweight debt indicator on the
list item. This design notes that constraint and scopes the debt row-2 content to a placeholder
or status-based label if `debtAmount` is not available on the list model.

## 2. Impacted Components

* **`RentalHistoryTabComponent` (Operator SPA — updated from FR-03):** Applies the active filter
  to `RentalListStore.historyRentals` as a computed subset and passes it to
  `RentalHistoryCardListComponent`. Also passes `isLoadingHistory`.

* **`RentalHistoryCardListComponent` (Operator SPA — new dumb list):** *(New component)* Accepts
  `items: RentalListItem[]` and `isLoading: boolean` as inputs. Responsibilities:
  - While `isLoading` is `true`: shows a loading skeleton or spinner.
  - When `isLoading` is `false` and `items` is empty: shows an empty-state message
    ("No rentals" or equivalent).
  - When `items` is non-empty: renders one `RentalCardComponent` per item in `history` variant.
  - History list is sorted `startedAt` descending (most recent first); sorting is applied in this
    component or upstream in `RentalHistoryTabComponent`.
  - **DRAFT card navigation exception:** tapping a card with `status === 'DRAFT'` does NOT
    navigate to `/rentals/:id`; instead it navigates to the Create Rental stepper at step 2
    (resuming the existing rental creation flow for the given rental ID). All other statuses
    navigate to `/rentals/:id` as normal.

* **`RentalCardComponent` (Operator SPA — updated from FR-04):** The `history` variant changes
  row-2 rendering:
  - For `status === 'DEBT'`: displays a debt indicator and the formatted completion/end time in
    warning color; applies the warning background and left border accent.
  - For all other statuses (COMPLETED, CANCELLED, DRAFT): displays the formatted completion time
    in default text color; no warning treatment.
  - Status badge color and label are resolved via `mapRentalStatus(item.status)`.

## 3. Abstract Data Schema Changes

No new persistent schema changes beyond FR-01. History rental data is loaded via the same
`RentalListItem` domain model; no new fields are introduced for this FR.

**Constraint noted:** `debtAmount` is a detail-only field on `RentalDetailState` (FR-01) and is
absent from `RentalListItem`. History card row-2 for debt rentals can display a status-based label
(e.g., "Debt") and the completion time, but cannot display the monetary debt amount from the list
view. If the requirement to show the debt amount on the list card is prioritised, `RentalListItem`
must be extended with an optional `debtAmount: Money` field and the backend `RentalSummaryResponse`
must be extended accordingly. This is deferred.

## 4. Component Contracts & Payloads

* **Interaction: `RentalHistoryTabComponent` -> `RentalHistoryCardListComponent`**
  * **Protocol:** In-process input binding
  * **Payload Changes:** Passes `items: RentalListItem[]` (client-side filtered and sorted
    `startedAt` descending) and `isLoading: boolean`.

* **Interaction: `RentalHistoryCardListComponent` -> Angular Router**
  * **Protocol:** In-process navigation
  * **Payload Changes:** On card tap, navigates to `/rentals/{item.id}`.

* **Interaction: `RentalListStore` -> `RentalsService` (history load)**
  * **Protocol:** REST (GET)
  * **Payload Changes:** `GET /api/rentals?from={today}T00:00&to={today}T23:59` — no status filter
    is applied; the backend returns all statuses for the given date range. The frontend applies
    status filtering client-side.

## 5. Updated Interaction Sequence

### Scenario: "Debt" filter applied — only debt cards visible

1. `RentalHistoryTabComponent` has `filter = 'DEBT'` from the URL.
2. It derives `filteredRentals = historyRentals.filter(r => r.status === 'DEBT')`.
3. The filtered list is passed to `RentalHistoryCardListComponent`.
4. The list component renders only debt-status `RentalCardComponent` instances in `history`
   variant.
5. Each debt card renders row-2 with warning color treatment; row-1 shows the Debt badge.

### Scenario: Empty filtered result

1. `filter = 'CANCELLED'`; `historyRentals` contains no cancelled items.
2. `filteredRentals = []`.
3. `RentalHistoryCardListComponent` receives `items = []` and `isLoading = false`.
4. Empty-state message is displayed.

### Scenario: Refresh while History tab is active

1. Operator taps the refresh button in the top bar.
2. `RentalDashboardComponent` calls `RentalListStore.loadHistory(today, today)`.
3. `isLoadingHistory` becomes `true`; the list component shows a loading state.
4. Load completes; `historyRentals` is replaced with fresh data.
5. The currently active filter is re-applied client-side to the new data; the list re-renders.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No authentication required. Debt card visual treatment does not expose
  any additional sensitive data beyond what is already in the status slug.
* **Scale & Performance:** History list is bounded to 200 records (per FR-01). Client-side sort
  by `startedAt` descending is a synchronous O(n log n) operation well within acceptable bounds.
  Filter derivation is O(n) per render cycle.
