# System Design: FR-04 — Active Rental Card List

## 1. Architectural Overview

FR-04 introduces `RentalActiveCardListComponent`, a pure display component that receives a sorted,
pre-mapped list of `RentalListItem` records and renders them as tappable cards. All sorting logic
(overdue-first, then ascending by `expectedReturnAt`) is applied in this component or in a computed
signal within `RentalActiveTabComponent` before the list is passed down. The component has no store
dependencies; it receives everything it needs via inputs and communicates navigation intent by
routing to `/rentals/:id`.

Visual differentiation of overdue cards is driven entirely by the `isOverdue` flag on each
`RentalListItem` — no additional API calls or status lookups are needed. Status badge rendering
(color and label) is resolved via the existing `mapRentalStatus` helper from the shared domain
models layer.

## 2. Impacted Components

* **`RentalActiveTabComponent` (Operator SPA — updated from FR-02):** Updated to apply the
  sort order before passing data to `RentalActiveCardListComponent`. Sort rule: items with
  `isOverdue === true` are placed first, followed by non-overdue items sorted ascending by
  `expectedReturnAt`; items without `expectedReturnAt` appear at the end of the non-overdue group.

* **`RentalActiveCardListComponent` (Operator SPA — new dumb list):** *(New component)* Accepts
  `items: RentalListItem[]` and `isLoading: boolean` as inputs. Responsibilities:
  - While `isLoading` is `true`: shows a loading skeleton or spinner.
  - When `isLoading` is `false` and `items` is empty: shows an empty-state message
    ("No active rentals" or equivalent).
  - When `items` is non-empty: renders one `RentalCardComponent` per item.
  - Emits a card-tap event (or navigates directly) to `/rentals/:id` when a card is tapped.

* **`RentalCardComponent` (Operator SPA — new dumb card):** *(New component)* Shared between
  active and history tab lists (FR-05). Accepts a single `RentalListItem` as input and an optional
  `variant` hint (`active` | `history`) to control row-2 content. Renders three rows:
  - **Row 1:** Customer phone (bold) + optional customer name in parentheses (left); status badge
    (right). Badge color and label resolved via `mapRentalStatus(item.status)`.
  - **Row 2 (active variant):** Overdue treatment when `isOverdue === true` — displays overdue
    duration in warning color; otherwise shows remaining time and formatted expected return time in
    default text color.
  - **Row 3:** Equipment name pills (one per entry in `equipmentNames`); pills wrap.
  - When `isOverdue === true`: applies a distinct background color and a left border accent using
    the warning color token; the return time row text uses the warning color.
  - The entire card is a tappable surface; tap navigates to `/rentals/:id`.

## 3. Abstract Data Schema Changes

No new schema changes. All display data is derived from `RentalListItem` (defined in FR-01).

## 4. Component Contracts & Payloads

* **Interaction: `RentalActiveTabComponent` -> `RentalActiveCardListComponent`**
  * **Protocol:** In-process input binding
  * **Payload Changes:** Passes `items: RentalListItem[]` (sorted by overdue-first then
    `expectedReturnAt` ascending) and `isLoading: boolean`.

* **Interaction: `RentalActiveCardListComponent` -> Angular Router**
  * **Protocol:** In-process navigation
  * **Payload Changes:** On card tap, navigates to `/rentals/{item.id}`. No query parameters are
    added to the detail route.

* **Interaction: `RentalActiveTabComponent` -> `RentalDashboardComponent` (subtitle row)**
  * **Protocol:** In-process input binding
  * **Payload Changes:** The subtitle row is rendered inside `RentalActiveTabComponent` and reads
    the `items.length` directly to show the active rental count.

## 5. Updated Interaction Sequence

### Scenario: Active tab renders with mixed overdue and non-overdue rentals

1. `RentalListStore.activeRentals` is populated (3 items: 1 overdue, 2 non-overdue).
2. `RentalActiveTabComponent` computes the sorted list: overdue item first, then the two
   non-overdue items sorted ascending by `expectedReturnAt`.
3. The sorted list and `isLoading = false` are passed to `RentalActiveCardListComponent`.
4. The list component renders three `RentalCardComponent` instances in the computed order.
5. The overdue card receives `isOverdue = true`; it renders with a warning background, left
   border accent, and overdue duration in the return-time row.

### Scenario: Operator taps a rental card

1. Operator taps the card for rental with `id: 42`.
2. The router navigates to `/rentals/42`.
3. `RentalDashboardComponent` (and `RentalListStore`) remains mounted in the background
   while the detail route is active.

### Scenario: Active list is empty after load completes

1. `RentalListStore.loadActive()` completes; `activeRentals` is `[]`; `isLoadingActive = false`.
2. `RentalActiveCardListComponent` receives `items = []` and `isLoading = false`.
3. The empty-state message is displayed.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No authentication required. Card data is non-sensitive display information
  (no PII beyond what is already stored in `RentalListItem.customerPhone` — displayed but not
  logged).
* **Scale & Performance:** The list uses standard scroll (no virtual scrolling needed for the
  expected maximum of 100 active rentals). Card sort is a synchronous computed operation over an
  in-memory list. No debouncing required.
