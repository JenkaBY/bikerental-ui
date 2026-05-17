# User Story: FR-04 — Active Rental Card List

## 1. Description

**As an** operator
**I want to** see a scrollable list of all currently active rentals sorted by expected return
time, with overdue rentals visually highlighted, so that I can immediately identify which
rentals require urgent attention and tap any card to open its detail
**So that** I can manage active rentals efficiently and respond to overdue situations quickly

## 2. Context & Business Rules

* **Trigger:** The "Active" tab is displayed and `RentalListStore.activeRentals` is populated
* **Rules Enforced:**
  * The list is sorted ascending by `expectedReturnAt`; rentals without an `expectedReturnAt`
    appear at the end
  * Overdue rentals (`isOverdue: true`) are sorted first, then non-overdue rentals sorted
    ascending by `expectedReturnAt`
  * Status badge color and label are resolved via `mapRentalStatus(item.status)` from `core/models/rental.model.ts`; `RentalStatusMeta.color` drives the Material badge variant
  * `expectedReturnAt` for sort is sourced directly from `RentalListItem.expectedReturnAt` (mapped from `RentalSummaryResponse.expectedReturnAt` per FR-01)
  * Each card occupies the full width of the scrollable area
  * A loading spinner or skeleton is shown while `isLoadingActive` is `true`
  * If `activeRentals` is empty after loading, an empty-state message is displayed
  * A rental card consists of three rows (see Screen Specification)
  * The status badge on each card always reads "Active" — there is no "Overdue" status
    in the data model; overdue is a visual treatment only
  * An overdue card has:
    - A distinct background color (different from the normal card surface)
    - A left border accent in the warning color
    - The return time row shows the overdue duration in the warning color
  * Equipment pills in the third row each display one equipment name; pills wrap if there
    are many items
  * Tapping anywhere on a card navigates to `/rentals/:id`

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The list renders using virtual scrolling or standard scroll; no pagination
  needed for typical shop sizes (< 50 active rentals expected)
* **Security/Compliance:** N/A
* **Usability/Other:** Cards must have sufficient touch target size for mobile use;
  phone number is always the primary identifier and is always displayed bold

## 4. Acceptance Criteria (BDD)

**Scenario 1: Overdue rentals appear first**

* **Given** `activeRentals` contains one overdue rental (overdue by 15 min) and two
  non-overdue rentals (due in 30 min and 60 min respectively)
* **When** the Active tab renders the list
* **Then** the overdue rental card appears first; the 30-min rental appears second;
  the 60-min rental appears third

**Scenario 2: Overdue card has distinct visual treatment**

* **Given** a `RentalListItem` with `isOverdue: true` and `overdueMinutes: 20`
* **When** the card renders
* **Then** the card has a warning background and left border accent; the return time row
  displays "Overdue by 20 min" (or equivalent) in the warning color

**Scenario 3: Non-overdue card shows remaining time**

* **Given** a `RentalListItem` with `isOverdue: false`, `startedAt` 30 minutes in the
  past, and `plannedDurationMinutes: 75`
* **When** the card renders
* **Then** the return time row shows remaining duration ("45 min remaining" or equivalent)
  and the formatted expected return time

**Scenario 4: Card first row shows phone and optional name**

* **Given** a `RentalListItem` with `customerPhone: '+375291234567'` and
  `customerName: 'Ivan Petrov'`
* **When** the card renders
* **Then** the first row shows "+375291234567 (Ivan Petrov)" with the phone bold; the
  status badge shows "Active"

**Scenario 5: Card first row omits name when absent**

* **Given** a `RentalListItem` with `customerPhone: '+375291234567'` and no `customerName`
* **When** the card renders
* **Then** the first row shows only "+375291234567" (bold) and the status badge

**Scenario 6: Equipment pills display item names**

* **Given** a `RentalListItem` with `equipmentNames: ['Trek FX3', 'Helmet S']`
* **When** the card renders
* **Then** the third row shows two pills: "Trek FX3" and "Helmet S"

**Scenario 7: Tapping a card navigates to detail**

* **Given** a card for rental with `id: 42`
* **When** the operator taps the card
* **Then** the router navigates to `/rentals/42`

**Scenario 8: Empty state shown when no active rentals**

* **Given** `isLoadingActive` becomes `false` and `activeRentals` is empty
* **When** the Active tab body renders
* **Then** an empty-state message is displayed ("No active rentals" or equivalent)

**Scenario 9: Refresh button reloads the active list**

* **Given** the Active tab is displayed and `activeRentals` contains 3 items
* **When** the operator taps the refresh icon button
* **Then** `RentalListStore.loadActive()` is called; the list re-renders with the
  updated data from the API

## 5. Out of Scope

* Inline actions on the card (e.g., quick-return from the list)
* "+ New Rental" button or any top-bar action button
* Auto-refresh or polling (operator refreshes manually via the refresh button in the
  top bar, described in FR-02)

## 6. Screen Specification

### Card Layout (top to bottom within each card)

```
┌──────────────────────────────────────────────┐
│  +375291234567 (Ivan Petrov)    [ Active ]   │  ← Row 1: phone (bold) + name + badge
│  ⚠ Overdue by 20 min                         │  ← Row 2: return time (overdue variant)
│  [Trek FX3] [Helmet S]                       │  ← Row 3: equipment pills
└──────────────────────────────────────────────┘

Normal card:
┌──────────────────────────────────────────────┐
│  +375291234567                  [ Active ]   │  ← Row 1
│  45 min remaining · 14:30                    │  ← Row 2: remaining time + expected time
│  [City Bike]                                 │  ← Row 3
└──────────────────────────────────────────────┘
```

### Overdue Card Visual Treatment

- Background: `--mat-sys-error-container` or equivalent warning surface token
- Left border: 4px solid `--mat-sys-error`
- Return time text color: `--mat-sys-error`

### Elements

| Element         | Position                               | Description                                                   |
|-----------------|----------------------------------------|---------------------------------------------------------------|
| Customer phone  | Row 1, left, bold                      | Primary identifier; always shown                              |
| Customer name   | Row 1, inline after phone, parentheses | Optional; hidden when absent                                  |
| Status badge    | Row 1, right                           | Always "Active"; colored per `RentalStatus.ACTIVE`            |
| Return time row | Row 2, full width                      | Shows overdue duration (warning) or remaining + expected time |
| Equipment pills | Row 3, full width, wrapping            | One pill per equipment item name                              |

### Transitions

| Interaction  | Outcome                            |
|--------------|------------------------------------|
| Tap any card | Router navigates to `/rentals/:id` |
