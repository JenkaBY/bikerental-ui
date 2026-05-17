# User Story: FR-05 — History Rental Card List

## 1. Description

**As an** operator
**I want to** see today's closed and draft rentals in the "Today's History" tab as a filterable
card list, with debt rentals visually highlighted
**So that** I can review what happened today and identify any unresolved debt situations

## 2. Context & Business Rules

* **Trigger:** The "Today's History" tab is active and `RentalListStore.historyRentals` is
  populated (loaded via `loadHistory` with today's local date boundaries)
* **Rules Enforced:**
  * The list renders the same card structure as the Active tab (FR-04) with the following
    differences:
    - Return time row for completed/cancelled/draft rentals shows the actual completion
      time (or last-updated time for drafts) instead of remaining/overdue time
    - Return time row for a DEBT rental shows the debt amount and the completion time
  * The visible subset of cards is determined by the selected filter from FR-03;
    "All" shows all history rentals regardless of status
  * A debt card has:
    - A distinct warning background color
    - A left border accent in the warning color
    - The return time row shows the debt amount and completion time in the warning color
  * Status badge color and label are resolved via `mapRentalStatus(item.status)` from `core/models/rental.model.ts`
  * Cards are sorted by `startedAt` descending (most recent first) within the history list
  * A loading state is shown while `isLoadingHistory` is `true`
  * An empty-state message is shown when the filtered list is empty
  * Tapping any card navigates to `/rentals/:id`
  * The data is fetched via `GET /api/rentals?from={today}&to={today}`

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Filtering is purely client-side; no API call is made on filter change
* **Security/Compliance:** N/A
* **Usability/Other:** Debt card visual treatment must be clearly distinct from normal
  completed cards to draw operator attention

## 4. Acceptance Criteria (BDD)

**Scenario 1: "All" filter shows all history rentals**

* **Given** `historyRentals` contains 2 completed, 1 debt, and 1 cancelled rental
* **When** the "All" filter is selected
* **Then** all 4 cards are visible

**Scenario 2: "Debt" filter shows only debt rentals**

* **Given** `historyRentals` contains 2 completed and 1 debt rental
* **When** the "Debt" filter is selected
* **Then** only the 1 debt card is visible

**Scenario 3: Debt card has warning visual treatment**

* **Given** a `RentalListItem` with `status: 'DEBT'` and `debtAmount: { amount: 500, currency: 'BYN' }`
* **When** the card renders
* **Then** the card has a warning background and left border accent; the return time row
  shows the debt amount and completion time in the warning color

**Scenario 4: Completed card shows completion time**

* **Given** a `RentalListItem` with `status: 'COMPLETED'`
* **When** the card renders
* **Then** the return time row shows the completion time (no overdue or debt treatment)

**Scenario 5: Empty state for filtered result**

* **Given** the "Cancelled" filter is selected but no cancelled rentals exist in
  `historyRentals`
* **When** the list renders
* **Then** an empty-state message is displayed ("No rentals" or equivalent)

**Scenario 6: API call uses today's local date boundaries**

* **Given** the local date is 2026-05-14
* **When** `loadHistory` is triggered
* **Then** the API call includes `from=2026-05-14` and `to=2026-05-14`

**Scenario 8: Refresh button reloads the history list**

* **Given** the Today's History tab is displayed
* **When** the operator taps the refresh icon button
* **Then** `RentalListStore.loadHistory(today, today)` is called; the list re-renders
  with the updated data from the API; the active filter is preserved

**Scenario 7: Tapping a history card navigates to detail**

* **Given** a history card for rental with `id: 99`
* **When** the operator taps the card
* **Then** the router navigates to `/rentals/99`

## 5. Out of Scope

* Date range filtering beyond today (explicitly out of scope)
* Pagination
* Inline actions on the card

## 6. Screen Specification

### Debt Card Layout

```
┌──────────────────────────────────────────────┐
│  +375291234567 (Ivan Petrov)    [ Debt ]     │  ← Row 1: phone + name + badge
│  ⚠ Debt: 500 BYN · Ended 14:30              │  ← Row 2: debt amount + end time (warning color)
│  [Trek FX3]                                  │  ← Row 3: equipment pills
└──────────────────────────────────────────────┘
```

### Normal History Card Layout

```
┌──────────────────────────────────────────────┐
│  +375291234567               [ Completed ]   │  ← Row 1
│  Ended 13:15                                 │  ← Row 2: completion time
│  [City Bike] [Helmet S]                      │  ← Row 3
└──────────────────────────────────────────────┘
```

### Debt Card Visual Treatment

- Background: `--mat-sys-error-container` (or equivalent warning surface token)
- Left border: 4px solid `--mat-sys-error`
- Return time row text color: `--mat-sys-error`

### Elements

| Element         | Position                               | Description                                           |
|-----------------|----------------------------------------|-------------------------------------------------------|
| Customer phone  | Row 1, left, bold                      | Primary identifier                                    |
| Customer name   | Row 1, inline after phone, parentheses | Optional                                              |
| Status badge    | Row 1, right                           | Colored per `RentalStatus` metadata                   |
| Return time row | Row 2, full width                      | Completion time (normal) or debt amount + time (debt) |
| Equipment pills | Row 3, full width, wrapping            | One pill per equipment item                           |

### Transitions

| Interaction         | Outcome                                  |
|---------------------|------------------------------------------|
| Tap any card        | Router navigates to `/rentals/:id`       |
| Tap a filter button | Client-side list re-filters; no API call |
