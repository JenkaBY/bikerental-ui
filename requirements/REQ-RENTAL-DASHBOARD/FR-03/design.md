# System Design: FR-03 — Rental Dashboard — Today's History Tab Shell & Filter Bar

## 1. Architectural Overview

FR-03 introduces the `RentalHistoryTabComponent` as the body rendered inside `RentalDashboardComponent`
when the "Today's History" tab is active. This component owns the horizontally scrollable filter bar
and the subtitle row, while delegating the actual card list rendering to `RentalHistoryCardListComponent`
(FR-05). All filter state is stored in the URL query parameter `?filter=`, making it persistent across
tab switches and bookmarkable.

The load-once-per-session rule — only triggering `RentalListStore.loadHistory` when `historyRentals`
is empty — is enforced by checking the store signal before issuing the load call. Client-side
filtering is a pure derived computation over the already-loaded `historyRentals` list; no additional
API calls are made when the operator changes the active filter.

## 2. Impacted Components

* **`RentalHistoryTabComponent` (Operator SPA — new dumb/smart hybrid tab body):** *(New component)*
  Rendered by `RentalDashboardComponent` when `activeTab === 'history'`. Responsibilities:
  - On activation (or when `historyRentals` is empty), triggers
    `RentalListStore.loadHistory(today, today)` via the parent `RentalDashboardComponent` or
    directly via an injected `RentalListStore` instance.
  - Reads the `?filter=` URL query parameter to determine the active filter; defaults to `ALL`
    when absent or unknown.
  - Renders a horizontally scrollable filter bar with five toggle buttons: All, Completed, Debt,
    Cancelled, Drafts. Only one button is active at a time.
  - On filter button tap: updates `?filter=` in the URL using `replaceUrl: true`; no API call.
  - Derives the visible card list as a computed subset of `RentalListStore.historyRentals` filtered
    by the active `filter` value (when filter is `ALL`, all items are shown).
  - Renders the subtitle row with the current local date (formatted per operator locale) and the
    count of records visible after the active filter is applied.
  - Hosts `RentalHistoryCardListComponent`, passing the filtered list and `isLoadingHistory`.

* **`RentalDashboardComponent` (Operator SPA — updated from FR-02):** Updated to conditionally
  show `RentalHistoryTabComponent` when `activeTab === 'history'`, and to call
  `RentalListStore.loadHistory(today, today)` when switching to the history tab if
  `historyRentals` is empty. The refresh button in the top bar, when the history tab is active,
  calls `loadHistory(today, today)` regardless of current store state (always forces a reload).

## 3. Abstract Data Schema Changes

No new persistent schema changes. The `filter` query parameter (`ALL` | `COMPLETED` | `DEBT` |
`CANCELLED` | `DRAFT`) is transient URL state.

## 4. Component Contracts & Payloads

* **Interaction: `RentalHistoryTabComponent` -> `RentalListStore` (conditional load)**
  * **Protocol:** In-process method call
  * **Payload Changes:** Calls `RentalListStore.loadHistory(dateFrom, dateTo)` where `dateFrom`
    and `dateTo` are the ISO date strings for today's local calendar date. The method signature
    is unchanged from FR-01.

* **Interaction: `RentalHistoryTabComponent` -> Angular Router (filter change)**
  * **Protocol:** In-process navigation (URL update, no page reload)
  * **Payload Changes:** Writes `?filter=COMPLETED` (or other slug) to the URL query string using
    `replaceUrl: true`. The `?tab=history` parameter is preserved.

* **Interaction: `RentalHistoryTabComponent` -> `RentalHistoryCardListComponent`**
  * **Protocol:** In-process input binding
  * **Payload Changes:** Passes `filteredRentals: RentalListItem[]` (the client-side filtered
    subset) and `isLoadingHistory: boolean` as inputs.

## 5. Updated Interaction Sequence

### Scenario: Operator switches to History tab (first visit)

1. `RentalDashboardComponent` updates URL to `?tab=history`; `RentalHistoryTabComponent` is
   mounted.
2. `RentalHistoryTabComponent` reads `?filter=` — absent, so active filter = `ALL`.
3. Component checks `RentalListStore.historyRentals` — empty, so it calls
   `RentalListStore.loadHistory(today, today)`.
4. `isLoadingHistory` becomes `true`; the history tab body shows a loading state.
5. History data loads; `historyRentals` is populated; `isLoadingHistory` becomes `false`.
6. The filtered list (all items) is derived and passed to `RentalHistoryCardListComponent`.
7. The subtitle row shows today's date and the total count of loaded records.

### Scenario: Operator taps "Debt" filter

1. `RentalHistoryTabComponent` updates URL to `?tab=history&filter=DEBT` (replaceUrl).
2. The active filter signal changes to `DEBT`.
3. The computed filtered list is re-derived client-side — only items with `status === 'DEBT'`
   are included. No API call is made.
4. The subtitle row updates to show the count of debt records.
5. `RentalHistoryCardListComponent` re-renders with the filtered list.

### Scenario: Operator switches back to Active tab then returns to History

1. `RentalDashboardComponent` updates URL to `?tab=active`; `RentalHistoryTabComponent` is
   removed from the DOM.
2. Operator switches back to `?tab=history`; `RentalHistoryTabComponent` is re-mounted.
3. Component reads `?filter=DEBT` from the URL — filter is restored.
4. Component checks `RentalListStore.historyRentals` — non-empty, so `loadHistory` is NOT called.
5. Existing data is displayed with the preserved filter applied.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No authentication required. Filter values are sanitised against the known
  enum list; unknown values fall back to `ALL` to prevent UI breakage from hand-crafted URLs.
* **Scale & Performance:** Client-side filtering operates on an in-memory list already bounded
  to 200 records maximum (per FR-01). The filter derivation is a synchronous computed operation
  — no debouncing or async processing required.
