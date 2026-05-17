# User Story: FR-08 — Rental Detail — Period Section

## 1. Description

**As an** operator
**I want to** see a compact period row on the Rental Detail screen that shows the rental's
start time, expected return time, and paid duration side by side
**So that** I can immediately assess how long the rental has been running and whether it
is within the paid window

## 2. Context & Business Rules

* **Trigger:** Rental detail data has loaded and the Period section is rendered
* **Rules Enforced:**
  * The section renders as a single compact row — no multi-line card with a header title
  * The row layout: start datetime → expected return datetime; paid duration as secondary
    text inline, appearing immediately after the arrow
  * Format: `{startDate} {startTime} → {expectedReturnDate} {expectedReturnTime}  ·  {paidDuration}`
  * If the rental is overdue (`isOverdue: true`), the expected return datetime is displayed
    in the warning color to signal it is past
  * If `expectedReturnAt` is absent (no expected return time set), the expected return
    position shows a dash or "—"
  * `paidDuration` is derived from `RentalDetail.paidDurationMinutes`; it is formatted
    as hours and minutes (e.g., "1 h 30 min") or minutes only when under one hour
  * Date formatting uses the operator's locale; time uses 24-hour format
  * The section is separated from adjacent sections by a divider

## 3. Non-Functional Requirements (NFRs)

* **Performance:** All values are derived from already-loaded `RentalDetail`; no
  additional API calls
* **Security/Compliance:** N/A
* **Usability/Other:** The row must be legible on a 360 dp wide mobile screen without
  truncation; consider abbreviating "h" and "min" to save space

## 4. Acceptance Criteria (BDD)

**Scenario 1: Non-overdue period row renders correctly**

* **Given** a `RentalDetail` with `startedAt: 2026-05-14T10:00`, `expectedReturnAt:
  2026-05-14T11:30`, `paidDurationMinutes: 90`, and `isOverdue: false`
* **When** the Period section renders
* **Then** the row shows "10:00 → 11:30 · 1 h 30 min" (dates omitted for same-day
  clarity or shown when different dates); expected return time is in default text color

**Scenario 2: Overdue rental — expected return shown in warning color**

* **Given** a `RentalDetail` with `isOverdue: true`
* **When** the Period section renders
* **Then** the expected return datetime is displayed in the warning color

**Scenario 3: Missing expected return time**

* **Given** a `RentalDetail` with `expectedReturnAt: undefined`
* **When** the Period section renders
* **Then** the row shows "{startDatetime} → — · {paidDuration}"

**Scenario 4: Sub-hour paid duration formatted as minutes only**

* **Given** `paidDurationMinutes: 45`
* **When** the Period section renders
* **Then** the paid duration shows "45 min"

## 5. Out of Scope

* Editing the rental duration or expected return time from this section
* Displaying actual return time (that is part of FR-09 cost summary for debt rentals)

## 6. Screen Specification

### Layout

```
┌──────────────────────────────────────────────────────┐
│  10:00  →  11:30  ·  1 h 30 min                     │  ← Non-overdue (default text color)
│                                                      │
│  10:00  →  ⚠ 11:30  ·  1 h 30 min                  │  ← Overdue (expected time in warning)
└──────────────────────────────────────────────────────┘
```

### Elements

| Element                  | Position                 | Description                                         |
|--------------------------|--------------------------|-----------------------------------------------------|
| Start datetime           | Row, leftmost            | Formatted date + time of rental start               |
| Arrow separator          | Row, center              | Static "→" separator                                |
| Expected return datetime | Row, right of arrow      | Warning color when overdue; "—" when absent         |
| Paid duration            | Row, after separator "·" | Secondary text; formatted as "X h Y min" or "Y min" |

### Transitions

No interactive elements in this section.
