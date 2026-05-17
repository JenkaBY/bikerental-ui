# User Story: FR-12 — Rental Detail — Action Buttons

## 1. Description

**As an** operator
**I want to** see action buttons at the bottom of the Rental Detail screen that let me
return selected equipment, mark equipment as broken, or cancel the rental
**So that** I can complete the full rental lifecycle from a single screen without navigating
elsewhere

## 2. Context & Business Rules

* **Trigger:** Rental detail data has loaded and the action button area is rendered at the
  bottom of the scrollable page
* **Rules Enforced:**

  ### Active rental (status = ACTIVE)

  * Three button area occupying the full screen width at the bottom, stacked:
    1. **"Return equipment (N)"** — primary filled blue button, full width
      - N = `selectedEquipmentCount` signal from the Equipment section (FR-11)
      - Disabled and visually dimmed when N = 0
      - Also disabled when `specialPriceEnabled === true` AND `specialPrice === null`
      - On tap: sends return request to the API (see below) then navigates back to the
        dashboard
    2. Two side-by-side buttons (equal width), below the Return button:
      - **"🔧 Broken"** — red outline button; opens the Broken Equipment dialog (FR-13)
      - **"Cancel rental"** — yellow filled button; opens a confirmation dialog

  * **Return request payload** (`ReturnEquipmentWrite`):
    - `rentalId`: current rental ID
    - `equipmentItemIds`: IDs of the currently checked active items
    - `discountPercent`: from the Return Pricing section (if special price is inactive)
    - `specialPrice`: from the Return Pricing section (if special price is active)
    - `BrokenEquipmentEntry[]`: broken equipment data collected by FR-13 (passed as a
      co-parameter, not embedded in `ReturnEquipmentWrite`)
  * After a successful return API call: show a success snackbar and navigate to
    `/rentals` (Active tab)
  * **Reuse**: `rentalStore.cancelRental()` in the detail store mirrors `RentalStore.cancelRental()` — it calls `RentalsService.updateLifecycle(id, { status: 'CANCELLED', operatorId })` using the generated `RentalsService` from `core/api/generated/services/`
  * **Reuse**: The return API call uses `RentalsService.returnEquipment(request: ReturnEquipmentRequest)` from `core/api/generated/services/`; the payload is constructed via `RentalDashboardMapper.toReturnRequest(write)` (defined in FR-01)
  * **Cancel confirmation dialog**:
    - Shows a simple confirmation message: "Are you sure you want to cancel this rental?"
    - Two buttons: "Keep rental" (cancel/dismiss) and "Yes, cancel" (confirm)
    - On confirmation: invoke `rentalStore.cancelRental()`, which sends the cancellation
      request to `PATCH /api/rentals/{id}/lifecycles`; on success show snackbar and
      navigate to `/rentals`

  ### Debt rental (status = DEBT)

  * Only one button:
    - **"🔧 Broken"** — standalone, full width, red outline button
    - No "Return equipment" button
    - No "Cancel rental" button

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The Return button must show a loading state (spinner / disabled) while
  the API call is in flight to prevent double-submission
* **Security/Compliance:** The cancellation action is destructive and requires explicit
  confirmation to prevent accidental taps
* **Usability/Other:** Buttons must be large enough for one-thumb operation on a phone;
  the Return button is always the topmost and most prominent action for active rentals

## 4. Acceptance Criteria (BDD)

**Scenario 1: Return button disabled when no items selected**

* **Given** `selectedEquipmentCount === 0`
* **When** the button area renders for an active rental
* **Then** the "Return equipment (0)" button is disabled and visually dimmed

**Scenario 2: Return button label reflects selected count**

* **Given** `selectedEquipmentCount === 2`
* **When** the button area renders
* **Then** the button label reads "Return equipment (2)"

**Scenario 3: Return button disabled when special price is empty**

* **Given** `specialPriceEnabled === true` AND `specialPrice === null`
* **When** the button area renders for an active rental
* **Then** the "Return equipment (N)" button is disabled regardless of selected count

**Scenario 4: Tapping Return sends correct payload**

* **Given** 2 active items are checked, `discountPercent: 10`, `specialPriceEnabled: false`
* **When** the operator taps "Return equipment (2)"
* **Then** the API is called with `equipmentItemIds: [id1, id2]`, `discountPercent: 10`,
  no `specialPrice` field; loading indicator is shown during the call

**Scenario 5: Successful return navigates to dashboard**

* **Given** the return API call succeeds
* **When** the response is received
* **Then** a success snackbar is shown and the router navigates to `/rentals`

**Scenario 6: Cancel button opens confirmation dialog**

* **Given** an active rental
* **When** the operator taps "Cancel rental"
* **Then** a confirmation dialog opens with "Keep rental" and "Yes, cancel" buttons

**Scenario 7: Cancel confirmation sends API request**

* **Given** the confirmation dialog is open
* **When** the operator taps "Yes, cancel"
* **Then** `rentalStore.cancelRental()` is called (`PATCH /api/rentals/{id}/lifecycles`);
  on success a snackbar is shown and the router navigates to `/rentals`

**Scenario 8: Debt rental shows only Broken button**

* **Given** a rental with `status: 'DEBT'`
* **When** the action area renders
* **Then** only the "🔧 Broken" full-width button is visible; no Return or Cancel buttons
  are present

**Scenario 9: Tapping Broken opens the dialog**

* **Given** the operator is on any rental detail (active or debt)
* **When** the operator taps "🔧 Broken"
* **Then** the Broken Equipment dialog (FR-13) opens as a bottom sheet

## 5. Out of Scope

* Inline broken-equipment API submission (the Broken Equipment dialog saves locally;
  the data is submitted together with Return)
* Editing rental parameters from the action area

## 6. Screen Specification

### Layout — Active Rental

```
┌────────────────────────────────────────────────┐
│                                                │  ← Scrollable content above
│                                                │
├────────────────────────────────────────────────┤
│  [ Return equipment (2) ]                      │  ← Full width, primary blue
├──────────────────────────┬─────────────────────┤
│  🔧 Broken               │  Cancel rental      │  ← Half width each
│  (red outline)           │  (yellow filled)    │
└──────────────────────────┴─────────────────────┘
```

### Layout — Debt Rental

```
├────────────────────────────────────────────────┤
│  🔧 Broken                                     │  ← Full width, red outline
└────────────────────────────────────────────────┘
```

### Elements

| Element                | Position                                                        | Description                                                                         |
|------------------------|-----------------------------------------------------------------|-------------------------------------------------------------------------------------|
| "Return equipment (N)" | Bottom area, top row, full width                                | Primary filled button; N = selected count; disabled when N=0 or special price empty |
| "🔧 Broken"            | Bottom area, second row, left half (active) / full width (debt) | Red outline; opens Broken Equipment dialog                                          |
| "Cancel rental"        | Bottom area, second row, right half (active only)               | Yellow filled; opens confirmation dialog                                            |

### Transitions

| Interaction                          | Outcome                                                              |
|--------------------------------------|----------------------------------------------------------------------|
| Tap "Return equipment (N)" (enabled) | API call sent; loading state shown; success → navigate to `/rentals` |
| Tap "🔧 Broken"                      | Broken Equipment bottom sheet opens (FR-13)                          |
| Tap "Cancel rental"                  | Confirmation dialog opens                                            |
| Tap "Yes, cancel" in dialog          | Cancellation API call sent; success → navigate to `/rentals`         |
| Tap "Keep rental" in dialog          | Dialog closes; no changes                                            |
