# System Design: FR-05 — Customer Rentals Tab

## 1. Architectural Overview

This story introduces `CustomerRentalsStore` as a Feature-layer store and `CustomerRentalsComponent` as its thin consumer tab within the Hierarchical State architecture defined in FR-03. The store is provided at the `CustomerDetailComponent` shell level — its state (rental list, expansion state, equipment detail cache) survives tab switches and is destroyed only when the shell is destroyed. The component injects the store via Angular DI and binds signals directly to the template; it owns no HTTP calls or state of its own.

## 2. Impacted Components

* **`CustomerRentalsStore` (Admin SPA — new, `customers/customer-detail/customer-rentals.store.ts`):** Provided at `CustomerDetailComponent` level. Injects `RentalsService`. State: `customerId` (from `CustomerLayoutStore`), `rentals: Signal<CustomerRentalSummary[]>`, `expandedIds: Signal<Set<number>>`, `detailCache: Signal<Map<number, RentalResponse>>`, `loadingDetailIds: Signal<Set<number>>`, `listLoading: Signal<boolean>`. Methods: `load()` (fetch summary list), `toggleExpand(id)` (expand/collapse; lazy-loads detail on first expand), `isExpanded(id): boolean`.

* **`CustomerRentalsComponent` (Admin SPA — new, `customers/customer-detail/tabs/customer-rentals/customer-rentals.component.ts`):** Thin consumer. Injects `CustomerRentalsStore`; calls `store.load()` on init if list not yet loaded; binds all template signals from the store; shows "Coming soon" snackbar on New Rental click.

* **`CustomerDetailComponent` (Admin SPA — Shell, FR-03):** Must include `CustomerRentalsStore` in its `providers` array.

## 3. Abstract Data Schema Changes

No new persistent entities. The store uses:

* **`CustomerRentalSummary`** (from FR-01) — display model for collapsed rows.
* **`RentalResponse`** (generated API type, used directly in the detail cache) — contains `equipmentItems: EquipmentItemResponse[]` where each item's `status` is one of: `ASSIGNED` (primary — reserved), `ACTIVE` (warn — in use), `RETURNED` (default — done).
* **`CustomerRentalsStore` state shape (store-scoped, provided at shell level):**
  - `rentals: Signal<CustomerRentalSummary[]>`
  - `expandedIds: Signal<Set<number>>`
  - `detailCache: Signal<Map<number, RentalResponse>>`
  - `loadingDetailIds: Signal<Set<number>>`
  - `listLoading: Signal<boolean>`

## 4. Component Contracts & Payloads

* **Interaction: `CustomerRentalsComponent` → `CustomerRentalsStore` (DI)**
  * **Protocol:** Angular DI injection
  * **Payload Changes:** Component calls `store.load()` on init (idempotent — no-op if already loaded); calls `store.toggleExpand(id)` on row click; reads all display signals from store.

* **Interaction: `CustomerRentalsStore` → `RentalsService.getRentals`**
  * **Protocol:** HTTP GET — `/api/rentals?customerId={id}` with `Pageable` params (default page 0, size 20)
  * **Payload Changes:** Response items mapped from `RentalSummaryResponse` to `CustomerRentalSummary`. `status` field kept as raw string slug. `listLoading` toggled around the call.

* **Interaction: `CustomerRentalsStore` → `RentalsService.getRentalById`**
  * **Protocol:** HTTP GET — `/api/rentals/{id}`
  * **Payload Changes:** Full `RentalResponse` stored in `detailCache` keyed by rental id. Called only when id not already present in cache.

* **Interaction: `CustomerRentalsComponent` → `mapRentalStatus` / `mapEquipmentItemStatus`**
  * **Protocol:** In-process function call (from FR-01)
  * **Payload Changes:** Input slug → output `{ colour, labelKey }`; used to set chip `color` attribute and display label.

* **Interaction: `CustomerRentalsComponent` → `MatSnackBar`**
  * **Protocol:** In-process service call
  * **Payload Changes:** "Coming soon" message on New Rental click; error message on API failures.

## 5. Updated Interaction Sequence

1. `CustomerRentalsComponent` activates → injects `CustomerRentalsStore` → calls `store.load()` (no-op if already loaded from a previous tab visit).
2. Store not yet loaded → `RentalsService.getRentals({ customerId, page: 0, size: 20 })` called → response mapped → `rentals` signal updated → rows rendered.
3. API error → `MatSnackBar` error shown → `rentals` set to empty array.
4. User switches to another tab and returns → `store.load()` called again → no-op; store already populated → list renders instantly from cached signals.
5. User clicks a collapsed row → `store.toggleExpand(id)` called → id added to `expandedIds`.
6. If id not in `detailCache` → store adds id to `loadingDetailIds` → `RentalsService.getRentalById(id)` called → stored in `detailCache` → id removed from `loadingDetailIds` → equipment items rendered.
7. If id already in `detailCache` → detail rendered immediately; no HTTP call.
8. User collapses row → id removed from `expandedIds`; `detailCache` entry retained.
9. User clicks "New Rental" → `MatSnackBar` "Coming soon" shown; no navigation or API call.
10. Shell destroyed → `CustomerRentalsStore` destroyed → all state released; re-entry triggers fresh load.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No auth guards (deferred).
* **Scale & Performance:** Rental list loads once on tab activate (default size 20). Equipment detail fetched lazily, one request per unique expansion, bounded by the number of visible rentals. No global store used; cache is component-scoped and released on shell destruction.
