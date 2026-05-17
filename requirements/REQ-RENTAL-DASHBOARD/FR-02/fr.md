# User Story: FR-02 — Rental Dashboard Page Shell & Active Tab

## 1. Description

**As an** operator
**I want to** open the Rental Dashboard at `/rentals` and immediately see the Active Rentals
tab selected, with a top bar title and a two-tab navigation bar
**So that** I always land on the most operationally relevant view (active rentals) by default

## 2. Context & Business Rules

* **Trigger:** Operator navigates to `/rentals` (e.g., from the bottom navigation bar)
* **Rules Enforced:**
  * Route: `/rentals` in the Operator SPA
  * Default tab is "Active" when no `?tab=` query parameter is present
  * Tab state is reflected in the URL: `?tab=active` (Active) and `?tab=history` (Today's
    History); the URL updates immediately on tab switch without a full navigation
  * The top bar shows the page title "Rentals" on the left and a refresh icon button
    on the right
  * Tapping the refresh icon button reloads the data for the currently active tab:
    - Active tab: calls `RentalListStore.loadActive()`
    - Today's History tab: calls `RentalListStore.loadHistory(today, today)`
  * The refresh button shows a spinner / disabled state while the corresponding
    `isLoadingActive` or `isLoadingHistory` signal is `true`
  * The tab bar sits directly below the top bar; two tabs: "Active" and "Today's History"
  * Below the Active tab bar, a subtitle row displays the total count of active rentals
    and the text "sorted by return time" as secondary information
  * Switching to "Today's History" tab updates `?tab=history` and renders the history tab
    body (see FR-03); the Active tab body is removed from the DOM when not selected
  * `RentalListStore` is provided at this component level so the store lifetime is tied
    to the route

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Tab switching must not trigger a full page reload; only the tab body
  re-renders
* **Security/Compliance:** N/A
* **Usability/Other:** The active tab indicator follows Material Design tab conventions;
  the selected tab is visually distinct; the page title is visible on all screen sizes

## 4. Acceptance Criteria (BDD)

**Scenario 1: Default tab is Active on first visit**

* **Given** the operator navigates to `/rentals` with no query parameters
* **When** the page loads
* **Then** the "Active" tab is selected and `?tab=active` is present (or absent and implied);
  the Active tab body is visible

**Scenario 2: Tab switch updates the URL**

* **Given** the operator is on `/rentals?tab=active`
* **When** the operator taps the "Today's History" tab
* **Then** the URL changes to `/rentals?tab=history` and the History tab body is displayed

**Scenario 3: Subtitle row reflects active rental count**

* **Given** `RentalListStore.activeRentals` contains 5 items
* **When** the Active tab body is displayed
* **Then** the subtitle row shows "5 active rentals" (or equivalent localised text) and
  "sorted by return time"

**Scenario 4: Direct URL navigation to history tab**

* **Given** the operator navigates directly to `/rentals?tab=history`
* **When** the page loads
* **Then** the "Today's History" tab is selected and its body is rendered

## 5. Out of Scope

* Rental card list content (covered by FR-04)
* History tab content (covered by FR-03 and FR-05)* Auto-refresh or polling — refresh is always operator-initiated via the refresh button* "+ New Rental" button or any other toolbar action

## 6. Screen Specification

### Layout

```
┌────────────────────────────────────────┐
│  Rentals                      [↻]      │  ← Top bar (title left, refresh icon right)
├────────────────────────────────────────┤
│  [ Active ]  [ Today's History ]       │  ← Tab bar (below top bar)
├────────────────────────────────────────┤
│  5 active rentals · sorted by return   │  ← Subtitle row (secondary text)
│                                        │
│  (rental card list — FR-04)            │  ← Scrollable body
└────────────────────────────────────────┘
```

### Elements

| Element               | Position                  | Description                                                  |
|-----------------------|---------------------------|--------------------------------------------------------------|
| Page title "Rentals"  | Top bar, left             | Static label; identifies the current feature area            |
| Refresh icon button   | Top bar, right            | Reloads data for the active tab; shows spinner while loading |
| "Active" tab          | Tab bar, first (left)     | Selects the active rentals view; default selected state      |
| "Today's History" tab | Tab bar, second (right)   | Selects the history view; triggers FR-03 body                |
| Subtitle row          | Below tab bar, full width | Shows total active count + sort description in muted text    |

### Transitions

| Interaction                        | Outcome                                                                       |
|------------------------------------|-------------------------------------------------------------------------------|
| Tap "Today's History" tab          | URL becomes `?tab=history`; History tab body replaces Active body             |
| Navigate to `/rentals` (no param)  | "Active" tab selected; `loadActive()` called on store                         |
| Navigate to `/rentals?tab=history` | "Today's History" tab selected; history load triggered                        |
| Tap refresh icon (Active tab)      | `loadActive()` called; button shows spinner until load completes              |
| Tap refresh icon (History tab)     | `loadHistory(today, today)` called; button shows spinner until load completes |
