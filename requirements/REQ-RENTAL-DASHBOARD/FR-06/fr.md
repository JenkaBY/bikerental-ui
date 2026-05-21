# User Story: FR-06 — Rental Detail Page Shell

## 1. Description

**As an** operator
**I want to** open a rental detail screen at `/rentals/:id` that shows the rental ID, its
status badge in the top bar, a back button, and—when relevant—a prominent warning or debt
banner, before any content sections are visible
**So that** I can immediately orient myself to the rental's context and urgency before
scrolling through its details

## 2. Context & Business Rules

* **Trigger:** Operator taps a rental card on the Dashboard, or navigates directly to
  `/rentals/:id`
* **Rules Enforced:**
  * Route: `/rentals/:id` in the Operator SPA; the `:id` is the numeric rental ID
  * The same component handles all rental statuses; rendering adapts based on
    `RentalDetail.status`
  * Top bar contains, from left to right: back button, rental ID as center title
    (e.g., "Rental #42"), status badge on the right
  * Back button navigates back to the dashboard, preserving the previously active tab
    and filter via the URL (i.e., `Router.back()` or a configured back-navigation route
    with `?tab=` and `?filter=` query params)
  * Overdue banner is shown only when `isActive === true` AND `isOverdue === true`:
    - Full-width strip directly below the top bar
    - Displays the overdue duration and the expected return time
    - Uses warning color scheme (background, text, icon)
  * Debt banner is shown only when `isDebt === true`:
    - Full-width strip directly below the top bar
    - Displays the debt amount and an explanatory message: "Balance will be charged
      automatically once topped up"
    - Uses warning color scheme
  * Overdue banner and Debt banner are mutually exclusive
  * Below the banner (or below the top bar when neither banner applies), the page body
    contains scrollable section areas (populated by FR-07 through FR-12)
  * A loading spinner is shown while the rental detail is being fetched; section areas
    are not rendered until data is available
  * If the API call fails, an error message is shown with a retry button

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Detail load must not block the top bar from rendering; the back button
  is interactive immediately
* **Security/Compliance:** N/A
* **Usability/Other:** The rental ID in the top bar title must be clearly readable on
  mobile; banner strips must be full-width and impossible to miss

## 4. Acceptance Criteria (BDD)

**Scenario 1: Active + overdue rental shows overdue banner**

* **Given** a rental with `status: 'ACTIVE'` and `isOverdue: true`, `overdueMinutes: 25`
* **When** the detail page renders
* **Then** an overdue banner is visible below the top bar, showing the overdue duration
  and expected return time in warning styling; no debt banner is present

**Scenario 2: Active non-overdue rental shows no banner**

* **Given** a rental with `status: 'ACTIVE'` and `isOverdue: false`
* **When** the detail page renders
* **Then** neither the overdue banner nor the debt banner is visible

**Scenario 3: Debt rental shows debt banner**

* **Given** a rental with `status: 'DEBT'` and `debtAmount: { amount: 300, currency: 'BYN' }`
* **When** the detail page renders
* **Then** the debt banner is visible below the top bar, showing "300 BYN" and the
  auto-charge message; no overdue banner is present

**Scenario 4: Status badge matches rental status**

* **Given** a rental with `status: 'DEBT'`
* **When** the detail page renders
* **Then** the status badge in the top bar reads "Debt" with the warn color

**Scenario 5: Back button navigates to dashboard preserving state**

* **Given** the operator arrived from `/rentals?tab=history&filter=DEBT`
* **When** the operator taps the back button
* **Then** the router navigates back to `/rentals?tab=history&filter=DEBT`

**Scenario 6: Loading state shown during fetch**

* **Given** the detail page is loading rental data
* **When** the API call is in flight
* **Then** a loading indicator is visible and the section body is not rendered

## 5. Out of Scope

* Content of individual sections (covered by FR-07 through FR-12)
* Broken Equipment dialog (covered by FR-13)
* Real-time polling of rental status

## 6. Screen Specification

### Layout — Active + Overdue

```
┌────────────────────────────────────────────┐
│  ← Rental #42                  [ Active ] │  ← Top bar
├────────────────────────────────────────────┤
│  ⚠ Overdue by 25 min · Expected 13:00     │  ← Overdue banner (warning background)
├────────────────────────────────────────────┤
│  [Customer section — FR-07]                │
│  [Period section — FR-08]                  │
│  [Current Cost section — FR-09]            │
│  [Return Pricing section — FR-10]          │  ← Only when ACTIVE
│  [Equipment section — FR-11]               │
│  [Action buttons — FR-12]                  │
└────────────────────────────────────────────┘
```

### Layout — Debt

```
┌────────────────────────────────────────────┐
│  ← Rental #99                    [ Debt ] │  ← Top bar
├────────────────────────────────────────────┤
│  ⚠ Debt: 500 BYN · Will be charged auto   │  ← Debt banner (warning background)
├────────────────────────────────────────────┤
│  [Customer section — FR-07]                │
│  [Period section — FR-08]                  │
│  [Current Cost section — FR-09 (read-only)]│
│  [Equipment section — FR-11 (all disabled)]│
│  [Action buttons — FR-12 (Broken only)]    │
└────────────────────────────────────────────┘
```

### Elements

| Element         | Position                              | Description                                                         |
|-----------------|---------------------------------------|---------------------------------------------------------------------|
| Back button     | Top bar, left                         | Navigates back to dashboard; preserves tab and filter state         |
| Rental ID title | Top bar, center                       | "Rental #N" where N is the numeric ID                               |
| Status badge    | Top bar, right                        | Reflects `RentalDetail.status`; colored per `RentalStatus` metadata |
| Overdue banner  | Below top bar, full width             | Warning strip; shown only for ACTIVE + overdue                      |
| Debt banner     | Below top bar, full width             | Warning strip; shown only for DEBT status                           |
| Section body    | Below banner (or top bar), scrollable | Contains FR-07 through FR-12 sections                               |

### Transitions

| Interaction                | Outcome                                                                        |
|----------------------------|--------------------------------------------------------------------------------|
| Tap back button            | Router navigates back to `/rentals` preserving `?tab=` and `?filter=`          |
| Page load with valid `:id` | API fetches rental detail; loading indicator shown; sections render on success |
| API fetch failure          | Error message shown with a retry button                                        |
