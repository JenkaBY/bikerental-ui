# System Design: FR-07 — Customer Transactions Tab

## 1. Architectural Overview

This story introduces `CustomerTransactionsStore` as a Feature-layer store and `CustomerTransactionsComponent` as its thin consumer tab within the Hierarchical State architecture defined in FR-03. The store is provided at the `CustomerDetailComponent` shell level — its state (transaction page, pagination) survives tab switches and is destroyed only when the shell is destroyed. The component injects the store via Angular DI and binds signals to the template; it owns no HTTP calls or signals of its own. The component is read-only; no write operations are performed.

## 2. Impacted Components

* **`CustomerTransactionsStore` (Admin SPA — new, `customers/customer-detail/customer-transactions.store.ts`):** Provided at `CustomerDetailComponent` level. Injects `FinanceService`. State: `customerId`, `transactions: Signal<CustomerTransaction[]>`, `totalItems: Signal<number>`, `pageIndex: Signal<number>`, `pageSize: Signal<number>` (fixed 20), `loading: Signal<boolean>`. Methods: `load()` (idempotent — loads page 0 if not yet loaded), `loadPage(index)` (fetch a specific page), `invalidate()` (reset the loaded flag; next `load()` call will re-fetch from page 0).

* **`CustomerTransactionsComponent` (Admin SPA — new, `customers/customer-detail/tabs/customer-transactions/customer-transactions.component.ts`):** Thin consumer. Injects `CustomerTransactionsStore`; calls `store.load()` on init; binds template signals from store; calls `store.loadPage(index)` on paginator events; applies colour classes to amount based on sign.

* **`CustomerDetailComponent` (Admin SPA — Shell, FR-03):** Must include `CustomerTransactionsStore` in its `providers` array.

## 3. Abstract Data Schema Changes

No new persistent domain entities. The store uses `CustomerTransaction` (from FR-01).

* **`CustomerTransactionsStore` state shape (store-scoped, provided at shell level):**
  - `transactions: Signal<CustomerTransaction[]>` — current page of transaction items.
  - `totalItems: Signal<number>` — total count for paginator.
  - `pageIndex: Signal<number>` — current zero-based page index.
  - `pageSize: Signal<number>` — fixed at 20.

## 4. Component Contracts & Payloads

* **Interaction: `CustomerTransactionsComponent` → `CustomerTransactionsStore` (DI)**
  * **Protocol:** Angular DI injection
  * **Payload Changes:** Component calls `store.load()` on init (no-op if already loaded); calls `store.loadPage(index)` on paginator events; reads all display signals from store.

* **Interaction: `CustomerTransactionsStore` → `FinanceService.getTransactionHistory`**
  * **Protocol:** HTTP GET — `/api/finance/customers/{customerId}/transactions`
  * **Payload Changes:** Query params: empty `TransactionHistoryFilterParams`, `Pageable` (`{ page: pageIndex, size: 20 }`). Response `Page.items` mapped to `CustomerTransaction[]`; `totalItems` updated. `loading` toggled around the call.

* **Interaction: `CustomerAccountComponent` → `CustomerTransactionsStore.invalidate()` (cross-tab)**
  * **Protocol:** Angular DI injection
  * **Payload Changes:** Called by the Account tab after any successful Top Up or Withdraw; resets the loaded flag. No immediate HTTP call — re-fetch is deferred until the user next activates the Transactions tab.

* **Interaction: `CustomerTransactionsComponent` → `MatSnackBar`**
  * **Protocol:** In-process service call
  * **Payload Changes:** Error message on HTTP failure.

## 5. Updated Interaction Sequence

1. `CustomerTransactionsComponent` activates → injects `CustomerTransactionsStore` → calls `store.load()` (no-op if already loaded from a previous tab visit).
2. Store not yet loaded → `FinanceService.getTransactionHistory(customerId, {}, { page: 0, size: 20 })` called → response mapped → `transactions` and `totalItems` signals updated → list and `mat-paginator` rendered.
3. Store already loaded (user returns to tab) → no HTTP call; list renders from cached store signals.
4. HTTP error → `MatSnackBar` error shown → `transactions` set to empty array.
5. Response returns zero items → empty-state message rendered.
6. User interacts with `mat-paginator` → `store.loadPage(index)` called → store fires HTTP call with new page → `transactions` and `pageIndex` updated.
7. For each transaction row: template binds `transaction.amountColor` CSS class directly — no conditional logic in the component.
8. Shell destroyed → `CustomerTransactionsStore` destroyed → all state released; re-entry fetches page 0 again.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No auth guards (deferred). Financial transaction data is sensitive PII — transport-layer security (HTTPS) is the primary control.
* **Scale & Performance:** Default page size 20; explicit pagination only (no infinite scroll). Each page change triggers exactly one HTTP call. No caching across pages; memory footprint bounded to one page of records at a time.
