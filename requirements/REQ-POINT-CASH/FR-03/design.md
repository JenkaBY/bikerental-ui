# System Design: FR-03 - Admin Касса Tab: Running Shift, Point Positions and Shift Cash Movements

> **Rewritten 2026-10-31** against `../backend_contract.md`. Conventions, endpoint tags and
> assumption markers: FR-01 §0. Shared stores from FR-02.

## 1. Architectural Overview

The Cash tab (`/points/:slug/cash`) is a thin smart tab over three sources. The two position
figures come from the host-scoped `PointPositionsStore` (FR-02, [B-FR08]) — no extra request on tab
entry. The **running shift** comes from a new shared `RunningShiftStore` over
`GET /api/finance/shifts/current` ([MAIN], admin access assumed — **A1**), which supplies the shift
number, opening time, opening amount, per-kind totals and expected cash. The **shift cash movement
list** is a tab-scoped `PointMovementsStore` (FR-02, [B-FR08]) on the CASH position, bounded by the
shift's opening time (**A7**).

This FR introduces three shared pieces that the operator screens (FR-06, FR-07) and shift closure
(FR-08) reuse: the `RunningShift` model + `RunningShiftStore` (admin names the point explicitly,
operator relies on the interceptor), the dumb `ShiftBreakdownComponent`, and the pure
`PointMoneyActionAvailability` rules (collection: active point only; settlement: refused only at a
permanently closed point; close shift: whenever a shift runs). Buttons open the FR-05 dialogs and
the FR-08 closure dialog; on success the tab calls `PointMoneyRefreshFacade.notifyChanged()` and
reloads the shift. The running-shift part is unblocked once the client is regenerated, so the
breakdown can ship before the positions and movements endpoints exist.

## 2. Impacted Components

* **`PointCashTabComponent` (Admin, new, smart):** Route `cash`. Reads `PointPositionsStore`,
  the point and its status from `PointAdminStore`, `PointMoneyRefreshFacade` and
  `StaffNameResolver`. Provides tab-scoped `RunningShiftStore` and `PointMovementsStore`. On entry:
  `RunningShiftStore.load(slug)`; once a shift is known, configures the movement store as
  `{ slug, CASH, period = [date(openedAt) … today], newest first, size 100, notBefore = openedAt }`.
  On revision change: reloads shift and list. Computes availability for the three buttons; opens
  `CashCollectionDialog` / `TerminalSettlementDialog` (FR-05) and `ShiftClosureDialogComponent`
  (FR-08). On a status-related refusal result also calls `PointAdminStore.loadOne(slug)`.
* **`PointCashCardComponent` (Admin, new, dumb):** CASH position (prominent), "Shift N · opened
  HH:mm" caption, `ShiftBreakdownComponent`, buttons "Collect cash" and "Close shift" with the
  disabled-reason hint; "No shift is running" state with no buttons (Scenario 12). Inputs:
  `cash: Money | null`, `shift: RunningShift | null`, `shiftState`, `collection` and `closeShift`
  availability. Outputs `collect`, `closeShift`.
* **`PointTerminalCardComponent` (Admin, new, dumb):** CARD_TERMINAL position and "Record
  settlement" with hint. Inputs `terminal: Money | null`, `settlement` availability. Output
  `settle`.
* **`ShiftBreakdownComponent` (Shared, new, dumb — also FR-06, FR-08):** Ordered lines: "Shift
  opening", one line per movement kind present (localized kind names, signed totals, backend order
  kept), "Expected cash". Input `shift: RunningShift`, flag `prominentExpected` (operator).
* **`RunningShiftStore` (Shared, new, feature-scoped — admin tab, operator screens):** State
  `pointSlug | null`, `shift: RunningShift | null`, `state: loading | running | none | failed`.
  API `load(pointSlug | null)` (null = operator, header from the interceptor), `refresh()`. Maps a
  recognisable "no running shift" answer to `none` (**A4**), every other failure to `failed`.
* **`PointMoneyActionAvailability` (Shared, new, pure — also FR-04, FR-06):**
  * `collection(pointStatus, cashAmount, shiftState)`: shift not running → `HIDDEN`; status ≠
    ACTIVE → `POINT_NOT_ACTIVE` (hint); amount unknown → `UNKNOWN`; amount ≤ 0 →
    `NOTHING_TO_MOVE`; else enabled.
  * `settlement(pointStatus, terminalAmount)`: `PERMANENTLY_CLOSED` → `POINT_PERMANENTLY_CLOSED`
    (hint); unknown → `UNKNOWN`; ≤ 0 → `NOTHING_TO_MOVE`; else enabled.
  * `closeShift(shiftState)`: running → enabled; otherwise `HIDDEN`.
  The rules are a convenience; the backend decides (FR-05, FR-08).
* **Cash amount for the collection rule and dialog (interim rule):** the CASH position from
  `PointPositionsStore`; while positions are unavailable ([B-FR08] not deployed or failed), the
  running shift's `expectedCash` is used instead (equal to the drawer position while a shift
  runs). This keeps admin collection unblocked; remove the fallback once positions are live if
  preferred.
* **`PointMovementTableComponent` (Admin, FR-02):** preset `shift`; empty state "No cash movements
  in this shift"; a "Show more" action instead of a numbered paginator (see §4, **A7**).
* **`PointFinanceService` / `PointFinanceMapper` (Shared, extended):** `getCurrentShift(pointSlug |
  null)`; shift mapping.
* **`Labels` / i18n:** "Cash drawer", "Terminal account", "Shift {n} · opened {time}", "Shift
  opening", "Expected cash", "No shift is running", "Collect cash", "Close shift", "Record
  settlement", "Cash can be collected only at an active point", "Settlements cannot be recorded at
  a permanently closed point", "No cash movements in this shift", "Show more".

## 3. Abstract Data Schema Changes

* **Entity: `RunningShift`** *(new domain model, read-only)*
  * **Attributes:** `shiftId`, `pointSlug`, `sequence` (shift number), `openedAt` (instant),
    `openingAmount` (count at the previous close), `kindTotals: [{ kind: PointMovementKind,
    signedAmount }]`, `expectedCash`.
  * **Mapping rule:** the contract field `movements[{type, amount}]` is grouped by `type` and summed
    in the mapper, so the model is correct whether the backend sends one entry per kind or one per
    movement **[GAP: confirm granularity and that `amount` is signed]**. The UI does not compute
    `expectedCash`; it renders the backend value (the breakdown reconciles by backend guarantee).
* **Entity: `RunningShiftState`** *(UI value)* — `loading | running | none | failed`.
* **Entity: `ActionAvailability`** *(UI value)* — `enabled`, `reason: POINT_NOT_ACTIVE |
  POINT_PERMANENTLY_CLOSED | NOTHING_TO_MOVE | UNKNOWN | HIDDEN | null`.
* **Relations:** `Point (1) — (0..1) running Shift`; `Shift (1) — (n) PointMovement` (CASH rows
  recorded since `openedAt`; rows may carry `shiftId`).

## 4. Component Contracts & Payloads

* **Interaction: `RunningShiftStore` -> `PointFinanceService` -> backend (running shift)**
  * **Protocol:** REST, `GET /api/finance/shifts/current` — **[MAIN]** (regenerate the client),
    header `X-Point-Slug: {slug}` set explicitly for admin (**A1**), notifications suppressed for
    the "no shift" answer only.
  * **Payload Changes:** Response `{ shiftId, pointSlug, sequence, openedAt, openingAmount,
    movements[{ type, amount }], expectedCash }`. "No running shift" (**A4**): assumed to be a
    distinguishable answer (e.g. a not-found status or a dedicated code); the mapper turns it into
    `none`. Other errors: standard notification → `failed`. If admins are refused (**A1** false),
    the tab shows the failure state for the shift only; positions and the terminal card stay usable.
* **Interaction: `PointMovementsStore` (shift list) -> backend**
  * **Protocol:** REST, `GET /api/finance/point-movements` — **[B-FR08]** (FR-02 contract).
  * **Payload Changes:** `position=CASH`, `from=date(openedAt)`, `to=today`, `sort=recordedAt,desc`,
    `size=100`. **A7:** the period is date-granular, so rows recorded before `openedAt` on the
    opening day are dropped client-side; because they sort last, the list uses "Show more" (next
    page) and stops as soon as a row older than `openedAt` is reached. **[GAP]** a `shiftId` or
    instant-precision `from` filter would make this exact and pageable.
* **Interaction: `PointCashTabComponent` -> FR-05 dialogs / FR-08 dialog**
  * **Protocol:** In-process dialog open/close.
  * **Payload Changes:** Open data `{ pointSlug, pointName, available }` (+ `shift` for closure).
    Close result `{ outcome: done, ... } | { outcome: statusChanged } | { outcome: shiftChanged } |
    undefined`.

## 5. Updated Interaction Sequence

1. Admin opens the Cash tab. Cards read the host's positions; `RunningShiftStore.load(slug)` runs.
2. Shift returned: the cash card shows "Shift 42 · opened 08:00" and the breakdown Shift opening
   500.00 / Rental payment +900.00 / Withdrawal −150.00 / Cash collection −400.00 / Expected 850.00
   (Scenario 1). Opening is the previous count, not midnight (Scenario 2).
3. The movement store loads the newest CASH rows from `date(openedAt)`, dropping rows before
   `openedAt`; names resolve via `StaffNameResolver`.
4. Availability: active point + cash > 0 → "Collect cash" enabled; temporarily closed → collection
   disabled with hint, settlement enabled (Scenario 6); permanently closed → both disabled with
   hints (Scenario 7); terminal 0.00 → settlement disabled (Scenario 5); shift running → "Close
   shift" shown.
5. Admin clicks a button → the matching dialog opens (Scenario 4).
6. Dialog `done` → `notifyChanged()` (positions, header pills) and `RunningShiftStore.refresh()` +
   list reload (Scenarios 9, 10). After a closure the new shift shows opening = counted, no kind
   lines, empty list.
7. Dialog `statusChanged` → `notifyChanged()` + `PointAdminStore.loadOne(slug)` → buttons follow
   the new status.
8. **No running shift (A4):** cash card shows the CASH position and "No shift is running"; no
   collect/close buttons; no movement list; terminal card unaffected (Scenario 12).
9. **Unhappy — shift load fails:** notification; cash card shows the position plus an error state;
   collect/close hidden; terminal card usable.
10. **Unhappy — positions unavailable:** pills/cards show em-dashes; the collection rule uses
    `expectedCash` (interim rule); settlement is `UNKNOWN` → disabled.
11. **Unhappy — movements fail:** notification and list error state; cards unaffected.
12. **Empty:** "No cash movements in this shift"; breakdown shows only opening and expected
    (Scenario 11).

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Admin route; the tab is read-only except for opening dialogs. The admin
  always names the point explicitly in the header; no implicit default point. Customer ids and
  staff names are displayed, never logged.
* **Scale & Performance:** Tab entry costs two requests (shift, first movement page); positions are
  reused from the host. The breakdown is backend-computed, never derived from the list, so the two
  cannot disagree. Refresh after a command is targeted (positions, shift, list).
* **Delivery split:** Shift card + breakdown + availability + dialogs' openers are unblocked after
  regeneration ([MAIN]); positions figures and the movement list wait for [B-FR08].
