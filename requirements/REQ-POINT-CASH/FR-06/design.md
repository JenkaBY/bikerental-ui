# System Design: FR-06 - Operator Касса Screen: Running Shift and Bottom-Nav Entry

> **Rewritten 2026-10-31** against `../backend_contract.md`. Operators see **only the running
> shift of their working point**: the terminal card, the per-movement list and every customer or
> staff name are removed; the old point-account snapshot and movements feed are not used.
> Conventions: FR-01 §0.

## 1. Architectural Overview

The operator SPA gains a fourth top-level destination, `cash`, reached from a new bottom-nav item.
The screen is a mobile composition of shared pieces defined for the admin: `RunningShiftStore` and
`RunningShift` (FR-03) over `GET /api/finance/shifts/current` ([MAIN]), the dumb
`ShiftBreakdownComponent` (FR-03) and `PointMoneyActionAvailability` (FR-03). It is the only data
the screen loads — no positions, movements, results or user directory (all admin-only).

The operator never names the point: the existing point interceptor adds `X-Point-Slug` from
`CurrentPointStore`, and the backend scopes the shift to that working point. The existing
point-switch mechanism (`PointSwitchRefreshService` re-creating the layout outlet) rebuilds the
screen and its component-scoped store for the new point. Because the shift response carries no
point status, the screen refreshes the working point's status from the registry on entry, so a
point closed by an admin during the day disables "Hand in cash" on the next visit; the backend
refusal in FR-07 remains the authority. The two buttons navigate to the operator collection flow
(FR-07) and the operator shift-closure flow (FR-08). The whole FR is unblocked once the client is
regenerated.

## 2. Impacted Components

* **`OperatorLayoutComponent` (Operator, modified):** Nav items gain `{ label: Cash, route: 'cash',
  icon: 'point_of_sale' }` as the 4th item after Rentals / New / Return; highlighted through the
  existing active-route matching. (Hiding the nav on full-screen sub-routes is added in FR-07.)
* **Operator routing (modified):** Child route `cash` → `OperatorCashComponent` (lazy). FR-07 and
  FR-08 add `cash/collect[/done]` and `cash/close-shift[/done]`.
* **`OperatorCashComponent` (Operator, new, smart):** Provides a component-scoped
  `RunningShiftStore`. On init:
  * No working point (`OperatingScopeStore.notEstablished()` or `CurrentPointStore.currentSlug()`
    null) → the existing "No working point" guidance; no requests, no buttons (Scenario 8).
  * Otherwise, in parallel: `RunningShiftStore.load(null)` and `CurrentPointStore.refreshCurrent()`.
  Renders `OperatorShiftCardComponent` for `running`, a "No shift is running" state for `none`
  (**A4**; no buttons, Scenario 9), and a retry-able error state for `failed`. Navigates to
  `cash/collect` and `cash/close-shift`.
* **`OperatorShiftCardComponent` (Operator, new, dumb):** "Shift N · opened HH:mm",
  `ShiftBreakdownComponent` with prominent expected cash, primary "Hand in cash" (availability +
  "only at an active point" hint), secondary "Close shift". Inputs `shift`, `collection`,
  `closeShift` availability. Outputs `handIn`, `closeShift`. Touch targets ≥ 48 px.
* **`ShiftBreakdownComponent`, `RunningShiftStore`, `PointMoneyActionAvailability` (Shared,
  FR-03):** Reused unchanged. Operator inputs to the collection rule: status =
  `CurrentPointStore.current().status`, amount = `shift.expectedCash` (operators cannot read
  positions), shift state from the store.
* **`CurrentPointStore` (Shared, modified):** Adds `refreshCurrent()` — re-reads the working
  point via `GET /api/points/{slug}` ([GEN]) and replaces it in the list, so `current().status` is
  fresh. Failure is silent (the startup copy is kept).
* **`PointSwitchRefreshService` (Operator):** No change for this screen; outlet re-creation
  rebuilds it. (FR-07/FR-08 extend it for the `cash/**` sub-routes.)
* **Error handling:** `scope.not_established` from the shift request is already handled by the
  global interceptor (marks `OperatingScopeStore`, warns once, regardless of suppression); the
  screen switches to the guidance reactively. `finance.point.*` codes reuse the existing operator
  point-error copy.
* **Removed from the previous design:** `CashMovementListComponent`, the terminal card, the
  per-source transfer buttons, the snapshot/movements calls and the `?source=` navigation.
* **`Labels` / i18n:** nav label "Cash", "Shift {n} · opened {time}", "Hand in cash", "Close shift",
  "No shift is running", "Retry"; breakdown and kind names shared with FR-02/FR-03.

## 3. Abstract Data Schema Changes

* **No new persisted entities.** The screen reads `RunningShift` (FR-03): `sequence`, `openedAt`,
  `openingAmount`, `kindTotals`, `expectedCash`. It never receives individual movements, customer
  ids or user ids.
* **Relations:** Unchanged.

## 4. Component Contracts & Payloads

* **Interaction: `RunningShiftStore` (operator) -> `PointFinanceService` -> backend**
  * **Protocol:** REST, `GET /api/finance/shifts/current` — **[MAIN]**; `X-Point-Slug` added by
    the point interceptor, not by the store.
  * **Payload Changes:** FR-03 contract. "No running shift" → `none` (**A4**). Errors: 409
    `scope.not_established` (global handling), others → standard notification + `failed`.
* **Interaction: `CurrentPointStore.refreshCurrent` -> `RentalPointsService`**
  * **Protocol:** REST, `GET /api/points/{slug}` — **[GEN]**, notifications suppressed.
  * **Payload Changes:** None.
* **Interaction: `OperatorCashComponent` -> Router**
  * **Protocol:** In-app navigation to `cash/collect` (FR-07) and `cash/close-shift` (FR-08); no
    query payload.

## 5. Updated Interaction Sequence

1. Operator taps "Cash"; the route activates and the item is highlighted (Scenario 1).
2. No working point → guidance only (Scenario 8).
3. Otherwise the shift and the point status load in parallel; the interceptor adds the working
   point header.
4. Running shift → "Shift 42 · opened 08:00", Shift opening 500.00, Rental payment +400.00,
   Withdrawal −50.00, Expected cash 850.00, "Hand in cash" enabled, "Close shift" shown
   (Scenario 2). No terminal figure, no rows, no names (Scenario 4).
5. Expected cash 0.00 → "Hand in cash" disabled, "Close shift" available (Scenario 6).
6. Point temporarily closed → summary shown, "Hand in cash" disabled with the active-point hint
   (Scenario 7).
7. Taps navigate to FR-07 / FR-08 (Scenario 5).
8. Point switch in the toolbar → outlet re-created → new component and store load the new point's
   shift (Scenario 3).
9. Return from a successful collection or closure → navigation back to `cash` re-creates the
   component → fresh summary.
10. **No running shift (A4):** "No shift is running", no buttons (Scenario 9).
11. **Unhappy — load failure:** notification and a retry-able error state; Retry re-runs the load.
12. **Unhappy — `scope.not_established` mid-session:** global handling marks the scope store; the
    screen switches to the guidance.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Data limited to the running shift of the working point, scoped server-side
  by `X-Point-Slug`; the UI never passes a point in path, query or body and shows no other point,
  no customer and no staff data. No extra role check — every operator may view, hand in cash and
  close the shift. No settlement or cancellation exists in operator code.
* **Scale & Performance:** Two light requests per visit (shift, point). Component-scoped store, so
  every visit and every point switch reloads (no pull-to-refresh). Finance GETs stay outside the
  service-worker data groups — money data must be live.
* **Delivery split:** Fully unblocked after regeneration ([MAIN]); only **A4** (the "no running
  shift" answer) needs confirmation to finalize the `none` mapping.
