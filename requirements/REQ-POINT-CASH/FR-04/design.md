# System Design: FR-04 - Admin Инкассации Tab: Transfer History and Cancellation

## 1. Architectural Overview

The Bank transfers tab (`/points/:slug/transfers`) shows a server-paged, filterable history of one
point's transfers to the bank. It also adds the only **write action that returns money to a point**:
an immediate, irreversible, admin-only cancellation. This FR defines the persisted **`BankTransfer`**
entity, which FR-05 and FR-07 create. It also defines two admin-only backend contracts: a history query
and a cancel command.

Tab state lives in `BankTransferHistoryStore`, provided on the FR-02 host (`PointDetailPageComponent`),
so the active filters survive switching away and back. Loading is lazy and starts on the first entry
to the tab. Whenever point money changes, whether from a cancellation here or a transfer created
through the FR-05 dialog opened from this tab's header button, the tab calls
`PointMoneyRefreshFacade.notifyChanged()` (FR-02). That refreshes the header pills and the Cash tab
data, and the history store reloads its current page with filters kept. Errors from the cancel command
are handled locally (global toast suppressed) and mapped through the ProblemDetail toolkit. One new
error code is registered.

## 2. Impacted Components

* **`PointTransfersTabComponent` (Admin, new, smart):** Tab route `transfers`. It renders the status
  filter chips (All / Completed / Cancelled, single-select), the shared date-range filter, the history
  table with a paginator, and a header "Transfer to bank" button (source fixed to CASH). It evaluates
  the button with `BankTransferAvailability` (FR-03) from the point status and
  `PointCashStore.cashBalance`, and opens `BankTransferDialogComponent` (FR-05) with the same handling
  of the close result as FR-03. It reloads when `PointMoneyRefreshFacade.revision` changes.
* **`BankTransferTableComponent` (Admin, new, dumb):** Columns: Date (date-time with performer name
  beneath), Amount, Source ("Cash drawer" / "Terminal account"), Status pill (Completed / Cancelled;
  a cancelled row adds "canceller · cancelled-at" as secondary text) and a row actions menu. The
  "Cancel transfer" item is rendered only when `status = COMPLETED`, and is disabled for the row whose
  id equals `cancellingId`. Output: `cancel(transferId)`. Empty state: "No transfers match the
  filters".
* **`BankTransferStatusPillComponent` (Admin, new, dumb):** Localized status pill. Completed uses the
  positive styling and Cancelled uses the muted/warn styling.
* **`BankTransferHistoryStore` (Shared, new, feature-scoped on the FR-02 host):** State: `pointSlug`,
  `status: ALL | COMPLETED | CANCELLED`, `fromDate`, `toDate`, `pageIndex`, `pageSize`,
  `items: BankTransfer[]`, `total`, `loading`, `cancellingId: string | null`. API: `init(slug)`,
  `setStatus()` / `setRange()` (each resets `pageIndex` to 0 and reloads), `loadPage(i)`, `reload()`
  (keeps filters and page), and `cancel(transferId)`, which returns an observable that completes
  with the updated transfer and always clears `cancellingId`.
* **`BankTransferMapper` (Shared, new):** Converts generated transfer responses into `BankTransfer` and
  `BankTransferFilter` into query params. FR-05 extends it with `toRequest`.
* **`BankTransferErrorHandler` (Shared, new, root):** Classifies a parsed `ApiError` from any transfer
  command into `ALREADY_CANCELLED | INSUFFICIENT_BALANCE | POINT_NOT_ACTIVE | NOT_FOUND | OTHER` and
  resolves the localized copy. This FR uses `ALREADY_CANCELLED`, `NOT_FOUND` and `OTHER`, and FR-05 /
  FR-07 add their branches to the same handler.
* **`ErrorCode` / `ErrorMessages` catalogue (Shared):** Registers `finance.bank_transfer.already_cancelled`
  as "This transfer has already been cancelled." with a Russian translation.
* **`Labels` / i18n:** Chips, column headers, "Completed", "Cancelled", "Cancelled by {name} ·
  {date-time}", "Cancel transfer", "Transfer cancelled: {amount}" (success), and the empty state.

## 3. Abstract Data Schema Changes

* **Entity: `BankTransfer`** *(new persisted entity, owned by the backend)*
  * **Attributes:** `id`, `pointSlug`, `sourceAccount: PointAccountType` (CASH | CARD_TERMINAL),
    `amount: Money` (> 0, 2 decimals), `status: BankTransferStatus`, `transferredAt: DateTime`,
    `performedBy: { userId, displayName }`, `cancelledAt: DateTime | null`,
    `cancelledBy: { userId, displayName } | null`, and `sourceBalanceAfter: Money` (source account
    balance right after the transfer, set at creation and used by FR-07). There is no destination
    attribute, because the destination is always the single business bank ledger (`BANK_TRANSFER`).
* **Entity: `BankTransferStatus`** *(new enumeration)*
  * **Values:** `COMPLETED`, `CANCELLED`. There is no pending or in-transit state. The only allowed
    transition is `COMPLETED` to `CANCELLED`, it is terminal, and it happens at most once.
* **Entity: `BankTransferFilter`** *(UI query model)*
  * **Attributes:** `pointSlug`, `status | null` (null = All), `fromDate | null`, `toDate | null`
    (inclusive business dates), `page`, `size`, sort fixed to `transferredAt desc`.
* **Relations:** `Point (1) — (n) BankTransfer`. Each `BankTransfer` produces one `BANK_TRANSFER`
  `PointMovement` (FR-02) on its source account, and a cancellation adds one
  `BANK_TRANSFER_CANCELLED` movement that credits the same account. In the ledger, the cancellation
  is a compensating double-entry (bank ledger credit, point account debit). The original entry is
  never mutated.

## 4. Component Contracts & Payloads

* **Interaction: `BankTransferHistoryStore` -> `bikerental-backend` (history)**
  * **Protocol:** REST, `GET /api/finance/bank-transfers?pointSlug={slug}&status={COMPLETED|CANCELLED}&fromDate=&toDate=&page=&size=&sort=transferredAt,desc` *(proposed, admin-only)*
  * **Payload Changes:** Response `{ items: [ { id, pointSlug, sourceAccount, amount, status, transferredAt, performedBy: { userId, displayName }, cancelledAt, cancelledBy: { userId, displayName } | null, sourceBalanceAfter } ], totalItems, pageRequest }`.
    `status` is omitted for "All", and the date params are omitted when empty.
* **Interaction: `BankTransferHistoryStore` -> `bikerental-backend` (cancel)**
  * **Protocol:** REST, `POST /api/finance/bank-transfers/{transferId}/cancellation` *(proposed,
    admin-only)*, with no request body. Sent with `SUPPRESS_ERROR_NOTIFICATION`.
  * **Payload Changes:** Success 200 returns the updated `BankTransfer` (`status = CANCELLED`,
    `cancelledAt`, `cancelledBy` = calling admin). Errors (ProblemDetail): 409
    `finance.bank_transfer.already_cancelled`, 404 `shared.resource.not_found`, 403 for non-admins.
    Cancellation is **not** refused for non-active points.
* **Interaction: `PointTransfersTabComponent` -> `BankTransferDialogComponent` (FR-05)**
  * **Protocol:** In-process dialog
  * **Payload Changes:** Same open/close contract as in FR-03, with `source = CASH`.
* **Interaction: `PointTransfersTabComponent` -> `PointMoneyRefreshFacade`**
  * **Protocol:** In-process notification
  * **Payload Changes:** `notifyChanged()` after a successful cancel or transfer.

## 5. Updated Interaction Sequence

1. Admin opens the Bank transfers tab. `BankTransferHistoryStore.init(slug)` runs (no-op if already
   initialized for this slug) and loads page 0 with status All and no dates.
2. The table renders the rows newest first.
3. Admin selects "Cancelled" (or sets a date range). The store resets to page 0 and reloads with the
   new filter.
4. **Cancel, happy path:** the admin chooses "Cancel transfer" on a Completed row. The store sets
   `cancellingId`, which disables that row's item and guards against double clicks, and calls the
   cancel endpoint. On 200 the store reloads the current page with filters kept, the tab shows a
   localized success toast and calls `PointMoneyRefreshFacade.notifyChanged()`. The header Cash pill
   goes 100.00 → 500.00 and the Cash tab data refreshes. `cancellingId` is cleared.
5. **Cancel, already cancelled elsewhere:** 409 `finance.bank_transfer.already_cancelled`.
   `BankTransferErrorHandler` resolves the localized error, which is toasted via
   `NotificationService.error`. The store reloads and the row shows Cancelled with the other admin's
   name/time. A `notifyChanged()` is issued as well, because the balances changed due to the other
   admin's cancellation.
6. **Cancel, not found / other error:** localized error toast and the list reloads.
7. **Transfer from this tab:** the header button is enabled (active point, cash > 0). The FR-05
   dialog closes with `completed`, `notifyChanged()` runs, and the history reloads the current page
   with filters kept. The new Completed row appears on top if it matches the filters.
8. **Non-active point:** the header button is disabled with the "only from an active point" hint.
   History, filters and the cancel actions still work.
9. **Unhappy, history load fails:** global toast and an error/empty state in the table.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** History and cancel are admin-only on the backend (403 for operators), and the
  operator app never calls them. Cancellation is an audited state transition. The backend records
  `cancelledBy` and `cancelledAt` from the authenticated principal and server clock, never from the
  request. The UI logs only the transfer id and error code, never names.
* **Scale & Performance:** History is paged server-side and filtered by `pointSlug`, status and date.
  The backend should index on (point, transferredAt). Cancel is idempotency-safe because a repeat
  attempt yields 409 `already_cancelled` and never moves money twice. The backend must run the status
  check and the compensating ledger entry atomically, as one transaction with a row lock or optimistic
  version, so two concurrent cancels cannot both succeed. The UI blocks a second click on the same row
  through `cancellingId`.
