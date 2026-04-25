# System Design: FR-03 — Customer Detail Shell

## 1. Architectural Overview

This story introduces `CustomerDetailComponent` as the Master layer of a Hierarchical State architecture for the entire Customer section. Rather than passing data down via `input()` signals or relying on component-level signals, all state is encapsulated in **local stores provided at the shell level**. This creates a clean DI scope whose lifetime is identical to the shell component: stores are instantiated when the user enters `/customers/:id`, shared across all child tabs via Angular's DI tree, and automatically destroyed when the user navigates away.

The architecture follows a **Master–Feature pattern** with three layers:

1. **`CustomerLayoutStore` (Master)** — provided by `CustomerDetailComponent`; owns customer id, the `Customer` profile, and the `CustomerBalance`. It is the single source of truth for identity and financial data visible in the header and account tab.
2. **Tab-Specific Feature Stores** — `CustomerRentalsStore` and `CustomerTransactionsStore`, also provided by `CustomerDetailComponent` so their caches survive tab switches (cross-tab caching). Each store owns its own data, loading state, and pagination.
3. **Cross-Tab Cache Lifetime** — because all stores are provided at the shell level (not at the individual tab component level), switching from the Rentals tab to the Transactions tab and back does not re-fetch or destroy rental data. The cache is invalidated only when the shell is destroyed.

Tab components are **thin consumers**: they inject the relevant store(s) and bind signals to the template. They do not own HTTP calls or signals of their own.

The Admin SPA routing configuration must be extended to register `/customers/:id` as a parent route with four named child routes.

## 2. Impacted Components

* **`CustomerLayoutStore` (Admin SPA — new, `customers/customer-detail/customer-layout.store.ts`):** Provided by `CustomerDetailComponent`. Holds: `customerId`, `customer: Signal<Customer | null>`, `balance: Signal<CustomerBalance | null>`, `profileLoading: Signal<boolean>`, `balanceLoading: Signal<boolean>`, `balanceError: Signal<boolean>`. Exposes methods: `load(id)` (parallel fetch of profile and balances), `refreshBalance()` (re-fetch balances only), `updateCustomer(write: CustomerWrite)` (PUT + update customer signal on success).

* **`CustomerRentalsStore` (Admin SPA — new, `customers/customer-detail/customer-rentals.store.ts`):** Provided by `CustomerDetailComponent`. Holds rental summary list, expansion state, detail cache, and loading indicators. Full definition in FR-05.

* **`CustomerTransactionsStore` (Admin SPA — new, `customers/customer-detail/customer-transactions.store.ts`):** Provided by `CustomerDetailComponent`. Holds transaction page, pagination state, and loading indicators. Full definition in FR-07.

* **`CustomerDetailComponent` (Admin SPA — new, `customers/customer-detail/customer-detail.component.ts`):** Shell. Declares all three stores in its `providers` array. Injects `CustomerLayoutStore`; calls `store.load(id)` on init; reads `customer` and `balance` signals for header rendering; handles 404 by navigating to `/customers`; owns `mat-tab-group` and syncs active tab with child route URL; provides back navigation.

* **`CustomerListComponent` (Admin SPA):** No functional changes.

* **Admin App Routes (`app.routes.ts`):** Extended with a parent route for `/customers/:id` loading `CustomerDetailComponent` and four lazy child routes: `profile`, `rentals`, `account`, `transactions`, plus a redirect from `/customers/:id` to `/customers/:id/profile`.

## 3. Abstract Data Schema Changes

No new domain entities. Stores consume `Customer`, `CustomerBalance` (FR-01).

* **`CustomerLayoutStore` state shape:**
  - `customerId: string` — set from route param on `load(id)`
  - `customer: Signal<Customer | null>` — populated by `CustomersService.getById`
  - `balance: Signal<CustomerBalance | null>` — populated by `FinanceService.getBalances`
  - `profileLoading: Signal<boolean>`
  - `balanceLoading: Signal<boolean>`
  - `balanceError: Signal<boolean>` — true when balance fetch fails; triggers dash placeholder in header

## 4. Component Contracts & Payloads

* **Interaction: `CustomerDetailComponent` → `CustomerLayoutStore.load(id)`**
  * **Protocol:** In-process store method call
  * **Payload Changes:** Store fires `CustomersService.getById(id)` and `FinanceService.getBalances(id)` in parallel; maps responses and updates internal signals.

* **Interaction: `CustomerLayoutStore` → `CustomersService.getById`**
  * **Protocol:** HTTP GET — `/api/customers/{id}`
  * **Payload Changes:** Response mapped via `CustomerMapper.fromResponse()` → `customer` signal updated.

* **Interaction: `CustomerLayoutStore` → `FinanceService.getBalances`**
  * **Protocol:** HTTP GET — `/api/finance/customers/{customerId}/balances`
  * **Payload Changes:** Response mapped to `CustomerBalance` → `balance` signal updated. On error, `balanceError` set to `true`.

* **Interaction: `CustomerAccountComponent` → `CustomerLayoutStore.refreshBalance()`**
  * **Protocol:** In-process store method call (DI injection)
  * **Payload Changes:** Store re-calls `FinanceService.getBalances(customerId)` → `balance` signal updated → header and account tab re-render automatically via signal binding.

* **Interaction: `CustomerDetailComponent` → Angular Router**
  * **Protocol:** In-process navigation
  * **Payload Changes:** Tab index change triggers `Router.navigate` to the child route segment; active tab index derived from URL on init.

## 5. Updated Interaction Sequence

1. Angular Router activates `/customers/:id/**` → `CustomerDetailComponent` instantiated → all three stores instantiated (DI scope created).
2. Shell calls `CustomerLayoutStore.load(id)` → parallel HTTP calls fired.
3. Profile resolves → `customer` signal updated → header renders phone, full name.
4. Balance resolves → `balance` signal updated → header renders available and reserved balances.
5. Balance fails → `balanceError` set → header renders `—` placeholders; navigation not blocked.
6. Profile fails with 404 → store sets error state → shell navigates to `/customers` → `MatSnackBar` shown.
7. Shell reads current child route segment → maps to tab index → `mat-tab-group` activates tab.
8. User clicks a different tab → `Router.navigate(['./', segment])` → URL updates → tab activates; tab store data already cached if previously loaded.
9. User clicks Back → `Router.navigate(['/customers'])`.
10. `CustomerAccountComponent` calls `CustomerLayoutStore.refreshBalance()` → store re-fetches → `balance` signal updates → header and account tab re-render automatically.
11. User navigates away from `/customers/:id` → `CustomerDetailComponent` destroyed → DI scope torn down → all three stores destroyed → all cached data released; re-entry triggers fresh instantiation.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No auth guards (deferred per project constraints). All stores are component-scoped, not root-provided — no data leaks between different customer sessions.
* **Scale & Performance:** Two parallel HTTP calls on shell init. All subsequent inter-tab navigation produces zero HTTP calls (reads from store signals). Memory bounded to one customer's data at a time; fully released on navigation away.
