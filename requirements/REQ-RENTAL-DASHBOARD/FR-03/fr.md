# User Story: FR-03 — Rental Dashboard — Today's History Tab Shell & Filter Bar

## 1. Description

**As an** operator
**I want to** switch to the "Today's History" tab and see a horizontally scrollable filter bar
with status filters and a subtitle showing today's date and record count
**So that** I can quickly narrow down today's completed, debt, cancelled, or draft rentals
without leaving the dashboard

## 2. Context & Business Rules

* **Trigger:** Operator taps the "Today's History" tab, or navigates directly to
  `/rentals?tab=history`
* **Rules Enforced:**
  * The filter bar is a horizontally scrollable row of toggle buttons immediately below
    the tab bar; buttons: "All", "Completed", "Debt", "Cancelled", "Drafts"
  * Only one filter button is active at a time; "All" is the default when `?filter=` is
    absent or equals `ALL`
  * Filter state is reflected in the URL as `?filter=ALL|COMPLETED|DEBT|CANCELLED|DRAFT`;
    the URL updates immediately when the operator taps a filter button
  * "All" shows rentals of all statuses returned by the history endpoint
  * The subtitle row shows the current local date and the count of records visible after
    the active filter is applied
  * On first load of this tab (or on date change at midnight), `RentalListStore.loadHistory`
    is called with today's local date boundaries (`T00:00` – `T23:59`)
  * Switching back to the "Active" tab and returning to "Today's History" preserves the
    last selected filter because it is stored in the URL
  * The tab switch from Active to History must trigger `loadHistory` if `historyRentals`
    is empty (i.e., the history has not been loaded yet in this session)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Filter buttons toggle the visible list client-side; no additional API
  call is made when the filter changes
* **Security/Compliance:** N/A
* **Usability/Other:** Filter buttons are visually distinct (filled/outlined) to indicate
  the active selection; the filter bar does not wrap — it scrolls horizontally on narrow
  screens

## 4. Acceptance Criteria (BDD)

**Scenario 1: "All" filter is selected by default**

* **Given** the operator navigates to `/rentals?tab=history` with no `?filter=` parameter
* **When** the history tab body renders
* **Then** the "All" filter button is in the selected state and all loaded history rentals
  are visible

**Scenario 2: Selecting a filter updates the URL**

* **Given** the operator is on `/rentals?tab=history&filter=ALL`
* **When** the operator taps the "Completed" filter button
* **Then** the URL becomes `?tab=history&filter=COMPLETED` and only completed rentals are
  shown in the list

**Scenario 3: Switching tabs preserves the selected filter**

* **Given** the operator has selected the "Debt" filter (`?filter=DEBT`)
* **When** the operator taps the "Active" tab and then taps "Today's History" again
* **Then** the URL contains `?tab=history&filter=DEBT` and the Debt filter is still selected

**Scenario 4: Subtitle shows today's date and filtered count**

* **Given** today is 2026-05-14 and there are 3 debt rentals loaded
* **When** the operator selects the "Debt" filter
* **Then** the subtitle row shows "14 May 2026" (or equivalent localised format) and
  "3 records" (or equivalent)

**Scenario 5: History loads only once per session visit**

* **Given** the history tab has already been loaded (`historyRentals` is non-empty)
* **When** the operator switches from the Active tab back to Today's History
* **Then** `loadHistory` is NOT called again; the existing data is displayed

## 5. Out of Scope

* Rental card list content (covered by FR-05)
* Date range picker or pagination (explicitly out of scope for this feature)
* Server-side filtering — all filters are client-side

## 6. Screen Specification

### Layout

```
┌────────────────────────────────────────────┐
│  Rentals                                   │  ← Top bar
├────────────────────────────────────────────┤
│  [ Active ]  [ Today's History ]           │  ← Tab bar
├────────────────────────────────────────────┤
│  ← [All] [Completed] [Debt] [Cancelled]… → │  ← Horizontally scrollable filter bar
├────────────────────────────────────────────┤
│  14 May 2026 · 3 records                   │  ← Subtitle row
│                                            │
│  (rental card list — FR-05)                │  ← Scrollable body
└────────────────────────────────────────────┘
```

### Elements

| Element            | Position                                           | Description                                        |
|--------------------|----------------------------------------------------|----------------------------------------------------|
| Filter bar         | Below tab bar, full width, horizontally scrollable | Row of toggle buttons; one active at a time        |
| "All" button       | Filter bar, first (leftmost)                       | Shows all status groups; default active state      |
| "Completed" button | Filter bar, second                                 | Filters to `status=COMPLETED` rentals only         |
| "Debt" button      | Filter bar, third                                  | Filters to `status=DEBT` rentals only              |
| "Cancelled" button | Filter bar, fourth                                 | Filters to `status=CANCELLED` rentals only         |
| "Drafts" button    | Filter bar, fifth                                  | Filters to `status=DRAFT` rentals only             |
| Subtitle row       | Below filter bar, full width                       | Current local date (left) and visible record count |

### Transitions

| Interaction                        | Outcome                                                              |
|------------------------------------|----------------------------------------------------------------------|
| Tap any filter button              | URL updates with `?filter=…`; list re-renders with filtered items    |
| Tap "All" filter                   | URL updates with `?filter=ALL`; all loaded history rentals are shown |
| First visit to history tab         | `loadHistory(today, today)` called; list populates                   |
| Return visit (data already loaded) | No API call; existing data displayed with preserved filter           |
