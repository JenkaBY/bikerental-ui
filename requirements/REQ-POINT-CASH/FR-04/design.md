# System Design: FR-04 - Admin Инкассации Tab: Collection and Settlement History

> **Rewritten 2026-10-31** against `../backend_contract.md`. Cancellation is withdrawn; the tab is
> a **read-only** history. The previous `BankTransfer` entity, `BankTransferHistoryStore`, status
> filter, row menu and cancellation endpoint are removed. Conventions: FR-01 §0.

## 1. Architectural Overview

There is no transfer resource in the backend: cash collections and terminal settlements are ledger
movements of kinds `COLLECTION` and `TERMINAL_SETTLEMENT`. The tab (`/points/:slug/transfers`) is
therefore a **preset of the FR-02 building blocks**: a tab-scoped `PointMovementsStore` on the
point's **BANK** position (**A9**, **A13** — the movements view has no kind filter, and both
operations credit the point's bank position), with the shared period filter and newest/oldest
order, rendered by `PointMovementTableComponent` in its `history` preset. Any other kind found on
that position (e.g. an adjustment correcting a collection) is shown with its own type name.

Above the list, a new shared `PointPeriodResultsStore` shows the period totals from
`GET /api/finance/point-results?pointSlug` (**A11**). Both reads are [B-FR08]. The header actions
reuse `PointMoneyActionAvailability` (FR-03) and open the FR-05 dialogs; success triggers
`PointMoneyRefreshFacade.notifyChanged()`, which reloads list, totals and header pills, and the
Cash tab picks up fresh data when it is next mounted.

## 2. Impacted Components

* **`PointTransfersTabComponent` (Admin, new, smart):** Route `transfers`. Provides tab-scoped
  `PointMovementsStore` (`{ slug, BANK, current month to date, newest, size 50 }`) and
  `PointPeriodResultsStore`. Renders the header actions "Collect cash" / "Record settlement" with
  availability from `PointMoneyActionAvailability` (collection: point active and cash > 0, using
  the FR-03 interim cash rule; settlement: not permanently closed and terminal > 0), the period
  filter (shared with the totals — one period drives both), the order toggle, the totals strip, the
  "mistakes are corrected by an adjustment" note, the table and the paginator. Reloads both stores
  on period change (page 0) and on the facade revision (period and order kept).
* **`PointPeriodResultsStore` (Shared, new, feature-scoped):** State `pointSlug`, `period`,
  `results: PointPeriodResults | null`, `loading`, `failed`. API `load(pointSlug, period)`,
  `reload()`. Uses `PointFinanceService.getResults(period, pointSlug)` (FR-01).
* **`PointResultsStripComponent` (Admin, new, dumb):** "Collected X" and "Terminal settlements Y";
  em-dash on failure.
* **`PointMovementTableComponent` (Admin, FR-02):** preset `history` — date-time with recorded-by
  name beneath (`StaffNameResolver`), localized type ("Cash collection" / "Terminal settlement" /
  any other kind name), amount as magnitude; no actions column; empty state "No collections or
  settlements in this period".
* **`PointPeriodFilterComponent` / `PointPeriodRule` (FR-02):** reused unchanged; invalid period →
  message, no request (Scenario 4).
* **`PointMoneyActionAvailability` (FR-03):** reused unchanged.
* **Removed from the previous design:** `BankTransfer`, `BankTransferStatus`,
  `BankTransferHistoryStore`, the status chips, the row actions menu, the cancellation command and
  its error branch.
* **`Labels` / i18n:** Tab content labels, "Collected", "Terminal settlements", the adjustment note,
  empty state. Kind names are shared with FR-02.

## 3. Abstract Data Schema Changes

* **No new persisted entities.** History rows are `PointMovement` (FR-02) on the BANK position;
  totals are `PointPeriodResults` (FR-01) with `pointSlug` set.
* **Entity: `PointMovement` usage:** `kind` ∈ {`COLLECTION`, `TERMINAL_SETTLEMENT`} expected, any
  other kind displayed as-is; `signedAmount` shown as magnitude; `recordedAt` is the only date
  shown — the bank-statement settlement date is not in the movement row (**A14**).
* **Relations:** `Point (1) — (n) PointMovement[BANK]`. A correction is a separate `ADJUSTMENT`
  movement; nothing is ever edited or removed.

## 4. Component Contracts & Payloads

* **Interaction: `PointMovementsStore` (history) -> backend**
  * **Protocol:** REST, `GET /api/finance/point-movements?pointSlug={slug}&position=BANK&from&to&page&size&sort=recordedAt,{desc|asc}`
    — **[B-FR08]** (FR-02 contract).
  * **Payload Changes:** None beyond FR-02. **A9/A13:** if collections turn out not to credit the
    point's BANK position, or BANK carries other kinds in volume, this preset must change to a kind
    filter **[GAP: a `kind` filter on point-movements would remove the assumption]**.
* **Interaction: `PointPeriodResultsStore` -> backend (period totals)**
  * **Protocol:** REST, `GET /api/finance/point-results?from={date}&to={date}&pointSlug={slug}` —
    **[B-FR08]**, admin only.
  * **Payload Changes:** Expected: collected cash and terminal settlements as separate totals for
    the point and period (**A11**). Failure → standard notification, `failed`, list unaffected.
* **Interaction: `PointTransfersTabComponent` -> FR-05 dialogs**
  * **Protocol:** In-process dialog; open/close contract as in FR-03 §4.

## 5. Updated Interaction Sequence

1. Admin opens the Collections tab on 28.10. Period 01.10–28.10 is preselected; list and totals
   load in parallel; names resolve once per visit.
2. Three rows render newest first with date + recorded-by, type and amount, no actions (Scenario 1);
   totals show "Collected 700.00" and "Terminal settlements 830.50" (Scenario 2).
3. Admin sets 10.10–20.10 → `PointPeriodRule` passes → both stores reload; list on page 1
   (Scenario 3). A span over 366 days → localized message, nothing sent (Scenario 4).
4. No cancel action exists; the note explains corrections by adjustment (Scenario 5).
5. "Collect cash" (active point) → FR-05 dialog → `done` → `notifyChanged()` → header pill
   decreases, list reloads with the new row on top, "Collected" increases (Scenario 6).
6. Temporarily closed point → collection disabled with hint, settlement enabled; history and totals
   still load (Scenario 7). Permanently closed → both disabled with hints (Scenario 8).
7. **Unhappy — list fails / endpoint not deployed:** notification and list error state; totals and
   actions stay usable.
8. **Unhappy — totals fail:** em-dashes in the strip; list unaffected.
9. **Empty period:** empty state; totals as reported (0.00).

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Admin-only views server-side; read-only tab apart from opening the FR-05
  dialogs. Names displayed, never logged.
* **Scale & Performance:** Server-side paging (≤ 100, default 50), one list + one totals request
  per period change; totals come from the backend, never summed from the visible page.
* **Delivery split:** Entirely dependent on [B-FR08] for data; header actions depend on FR-05
  (collection [MAIN], settlement [B-FR06]). The tab shell, period filter wiring and availability
  can be built now and show failure states until the backend lands.
