# System Design: FR-08 — Rental Detail — Period Section

## 1. Architectural Overview

FR-08 introduces `RentalPeriodSectionComponent`, a purely presentational component that renders
a compact single-row summary of the rental's time dimensions. It derives all display values from
fields already present in `RentalDetailState` (FR-01): `startedAt`, `expectedReturnAt`,
`paidDurationMinutes`, and `isOverdue`. No API calls and no store interactions are needed beyond
reading these values as inputs from `RentalDetailComponent`.

The component applies a conditional warning color to the expected-return datetime when
`isOverdue === true`, using the shared design-token vocabulary for the warning palette. Date and
time formatting uses the operator's locale and a 24-hour clock, consistent with the rest of the
Operator SPA.

## 2. Impacted Components

* **`RentalPeriodSectionComponent` (Operator SPA — new dumb component):** *(New component)*
  Accepts read-only inputs sourced from `RentalDetailState`:
  - `startedAt: Date | null`
  - `expectedReturnAt: Date | undefined`
  - `paidDurationMinutes: number | undefined`
  - `isOverdue: boolean`
    Responsibilities:
  - Formats `startedAt` as date + time (24 h); omits date portion if same calendar day as
    today (or always shows it — implementation choice; must be consistent across the app).
  - Formats `expectedReturnAt` as date + time (24 h); renders "—" when absent.
  - Applies warning color to the `expectedReturnAt` display string when `isOverdue === true`.
  - Formats `paidDurationMinutes` as "X h Y min" when ≥ 60 minutes, or "Y min" when < 60.
  - Renders the row: `{startDatetime} → {expectedReturnDatetime}  ·  {paidDuration}`.
  - Is separated from adjacent sections by a divider.

* **`RentalDetailComponent` (Operator SPA — updated from FR-06):** Passes the relevant
  `RentalDetailState` fields to `RentalPeriodSectionComponent` as inputs after data loads.

## 3. Abstract Data Schema Changes

No new schema changes. All display values are derived from existing `RentalDetailState` fields
(defined in FR-01).

## 4. Component Contracts & Payloads

* **Interaction: `RentalDetailComponent` -> `RentalPeriodSectionComponent`**
  * **Protocol:** In-process input binding
  * **Payload Changes:** Passes `startedAt`, `expectedReturnAt`, `paidDurationMinutes`, and
    `isOverdue` as read-only inputs. All values originate from `RentalDetailStore`'s state signals
    which are populated during the load sequence (FR-06).

## 5. Updated Interaction Sequence

### Scenario: Non-overdue rental period row renders

1. `RentalDetailComponent` loads rental data; `RentalDetailState` is populated.
2. Component passes `startedAt = 2026-05-14T10:00`, `expectedReturnAt = 2026-05-14T11:30`,
   `paidDurationMinutes = 90`, `isOverdue = false` to `RentalPeriodSectionComponent`.
3. Section renders: `10:00 → 11:30 · 1 h 30 min` — expected return time in default text color.

### Scenario: Overdue rental — expected return shown in warning color

1. `RentalDetailState` has `isOverdue = true`, `expectedReturnAt = 2026-05-14T11:00`.
2. Section renders: `10:00 → 11:00 · 1 h 30 min` — the `11:00` portion is rendered in the
   warning color token.

### Scenario: Missing expected return time

1. `RentalDetailState` has `expectedReturnAt = undefined`.
2. Section renders: `{startDatetime} → — · {paidDuration}` — a dash is shown in place of the
   expected return datetime.

### Scenario: Sub-hour paid duration

1. `paidDurationMinutes = 45`.
2. Section renders: `{startDatetime} → {expectedReturnDatetime} · 45 min`.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII is displayed in this section. Timestamps are operational data.
* **Scale & Performance:** All values are derived synchronously from already-loaded state. No
  async operations, no subscriptions, no timers. The component is a pure display primitive.
