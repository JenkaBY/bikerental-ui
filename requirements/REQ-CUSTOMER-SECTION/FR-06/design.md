# System Design: FR-06 — Customer Account Tab

## 1. Architectural Overview

This story introduces `CustomerAccountComponent` as a thin consumer tab within the Hierarchical State architecture defined in FR-03. Balance data is owned by `CustomerLayoutStore` (the Master store) — the component injects the store via DI and reads its `balance` signal directly. No `input()` or `output()` bindings are used. After a successful Top Up or Withdraw, the component calls `CustomerLayoutStore.refreshBalance()` directly, which re-fetches and updates the shared balance signal, causing the header and this tab to re-render automatically.

## 2. Impacted Components

* **`CustomerAccountComponent` (Admin SPA — new, `customers/customer-detail/tabs/customer-account/customer-account.component.ts`):** Thin consumer. Injects `CustomerLayoutStore`; reads `store.balance` signal to display available and reserved balances; conditionally enables the Withdraw button when `store.balance()?.available.amount > 0`; opens `TopUpDialogComponent` and `WithdrawDialogComponent` via `MatDialog`; calls `store.refreshBalance()` then `CustomerTransactionsStore.invalidate()` on dialog result `true`; shows success `MatSnackBar`.

* **`CustomerLayoutStore` (Admin SPA — FR-03):** Must expose `refreshBalance()` method consumed by this tab.

* **`TopUpDialogComponent` (Admin SPA — FR-08):** Opened with `MAT_DIALOG_DATA: { customerId }`.

* **`WithdrawDialogComponent` (Admin SPA — FR-09):** Opened with `MAT_DIALOG_DATA: { customerId, availableBalance }`.

## 3. Abstract Data Schema Changes

No new domain entities. Component consumes `CustomerBalance` (from FR-01).

* **Dialog data shapes (component-scoped, not persisted):**
  - Top Up dialog data: `{ customerId: string }`
  - Withdraw dialog data: `{ customerId: string, availableBalance: Money }`

## 4. Component Contracts & Payloads

* **Interaction: `CustomerAccountComponent` → `CustomerLayoutStore` (DI read)**
  * **Protocol:** Angular DI injection
  * **Payload Changes:** Component reads `store.balance` signal; no HTTP call on tab activate.

* **Interaction: `CustomerAccountComponent` → `MatDialog` → `TopUpDialogComponent`**
  * **Protocol:** `MatDialog.open()` with dialog data
  * **Payload Changes:** Passes `{ customerId: store.customerId }`; receives `true | undefined` on close.

* **Interaction: `CustomerAccountComponent` → `MatDialog` → `WithdrawDialogComponent`**
  * **Protocol:** `MatDialog.open()` with dialog data
  * **Payload Changes:** Passes `{ customerId: store.customerId, availableBalance: store.balance()?.available }` (`Money`); receives `true | undefined` on close.

* **Interaction: `CustomerAccountComponent` → `CustomerLayoutStore.refreshBalance()`**
  * **Protocol:** In-process store method call (DI injection)
  * **Payload Changes:** Called when either dialog closes with `true`; store re-fetches balances and updates `balance` signal → header and this tab re-render automatically.

* **Interaction: `CustomerAccountComponent` → `CustomerTransactionsStore.invalidate()`**
  * **Protocol:** In-process store method call (DI injection — cross-tab)
  * **Payload Changes:** Called immediately after `refreshBalance()` on dialog `true` result; resets the transaction store's loaded flag so the next visit to the Transactions tab triggers a fresh HTTP fetch.

* **Interaction: `CustomerAccountComponent` → `MatSnackBar`**
  * **Protocol:** In-process service call
  * **Payload Changes:** Success snackbar shown after `refreshBalance()` resolves successfully.

## 5. Updated Interaction Sequence

1. `CustomerAccountComponent` activates → injects `CustomerLayoutStore` → reads `store.balance` signal → renders balances immediately (pre-loaded by shell on init).
2. `store.balance` is `null` (fetch failed) → dash placeholders rendered; Withdraw button disabled.
3. `store.balance()?.available.amount === 0` → Withdraw button disabled; Top Up button enabled.
4. User clicks "Top Up" → `MatDialog.open(TopUpDialogComponent, { data: { customerId } })` → dialog opens (FR-08 sequence).
5. Top Up dialog closes with `true` → `store.refreshBalance()` called → store re-fetches → `balance` signal updated → header and account tab re-render → `CustomerTransactionsStore.invalidate()` called → success `MatSnackBar` shown.
6. Top Up dialog closes with `undefined` (cancel) → no store call; no refresh; no snackbar.
7. User clicks "Withdraw" (enabled) → `MatDialog.open(WithdrawDialogComponent, { data: { customerId, availableBalance } })` → dialog opens (FR-09 sequence).
8. Withdraw dialog closes with `true` → same refresh and invalidate flow as step 5.
9. Withdraw dialog closes with `undefined` → same no-op as step 6.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No auth guards (deferred). `availableBalance` passed to withdraw dialog to enforce client-side ceiling validation; server-side validation on the backend is the authoritative guard.
* **Scale & Performance:** Zero HTTP calls on tab activate; balance data pre-loaded by shell. Refresh triggered only on confirmed financial transactions.
