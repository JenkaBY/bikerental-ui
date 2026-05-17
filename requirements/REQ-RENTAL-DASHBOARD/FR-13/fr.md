# User Story: FR-13 — Broken Equipment Dialog

## 1. Description

**As an** operator
**I want to** open a bottom sheet from the Rental Detail screen that lets me mark equipment
items as broken and optionally specify a penalty amount for each
**So that** I can record damage before completing the return without submitting an incomplete
or inaccurate report

## 2. Context & Business Rules

* **Trigger:** Operator taps the "🔧 Broken" button on the Rental Detail screen (FR-12)
* **Rules Enforced:**
  * The dialog is displayed as a **bottom sheet** (not a centered modal) overlaying the
    Rental Detail screen; the background is dimmed
  * The sheet shows a bold title "Broken equipment" and an instructional subtitle below it
    (e.g., "Select items to mark as broken and enter the penalty amount if applicable")
  * The sheet lists **active equipment items** (those with `statusSlug !== 'RETURNED'`)
    from `RentalDetail.equipmentItems`, one row per item:
    - Checkbox on the left
    - Equipment name (bold) and category + UID in the center
    - Currency symbol + numeric penalty input on the right; the input is **disabled** until
      the item's checkbox is checked; the input is optional (no penalty is valid)
  * After the active items, **returned equipment items** (`statusSlug === 'RETURNED'`) are
    listed as a single non-interactive note line (e.g., "N items already returned") —
    not as individual rows
  * An informational banner is displayed below the item list with the text:
    "Penalty submission is under development. Broken item tracking will be available in a
    future update." (or equivalent localised text)
  * Two buttons at the bottom of the sheet, side by side (equal width):
    - **"Cancel"** — ghost (outline) button; closes the sheet without saving any changes
    - **"Apply"** — red outline button; saves the broken equipment selection and penalty
      amounts to the **detail store's local state** as a `BrokenEquipmentEntry[]`; does
      NOT send any API request; closes the sheet
  * After Apply, the collected `BrokenEquipmentEntry[]` data is available in the detail
    store and will be submitted together with the "Return equipment" action (FR-12)
  * If the operator opens the dialog a second time (e.g., to amend the selection), the
    previously saved state is restored (checkboxes and amounts pre-filled from the store)
  * The dialog does not prevent the Return action if no items are marked as broken
    (the broken list is optional)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** No API calls in this dialog; all interactions are synchronous state
  updates
* **Security/Compliance:** N/A
* **Usability/Other:** The penalty input must have a numeric keyboard on mobile; the
  informational banner must be clearly styled as informational (not an error); the bottom
  sheet must be dismissible by tapping the dimmed background (equivalent to "Cancel")

## 4. Acceptance Criteria (BDD)

**Scenario 1: Active items listed with disabled penalty input**

* **Given** the rental has 2 active items and 1 returned item
* **When** the dialog opens
* **Then** 2 rows are shown for active items (each with a checkbox and a disabled penalty
  input); a note below says "1 item already returned"; the penalty inputs are disabled

**Scenario 2: Checking an item enables its penalty input**

* **Given** item "Trek FX3" row is unchecked
* **When** the operator taps the checkbox for "Trek FX3"
* **Then** the penalty input for "Trek FX3" becomes enabled

**Scenario 3: Unchecking an item disables and clears its penalty input**

* **Given** item "Trek FX3" is checked with penalty "200"
* **When** the operator unchecks "Trek FX3"
* **Then** the penalty input is disabled and its value is cleared

**Scenario 4: Apply saves state locally without API call**

* **Given** "Trek FX3" is checked with penalty "200" and "City Bike" is unchecked
* **When** the operator taps "Apply"
* **Then** the detail store's broken equipment state is
  `[{ equipmentItemId: trekFX3Id, penaltyAmount: 200 }]`; no API call is made; the sheet
  closes

**Scenario 5: Apply with no items marked closes without error**

* **Given** no items are checked
* **When** the operator taps "Apply"
* **Then** the detail store's broken equipment state is `[]`; the sheet closes without
  error

**Scenario 6: Cancel closes without saving**

* **Given** an item is checked with a penalty amount
* **When** the operator taps "Cancel"
* **Then** the sheet closes; the detail store's broken equipment state is unchanged from
  what it was before the dialog opened

**Scenario 7: Re-opening the dialog restores previous state**

* **Given** the operator previously applied `[{ equipmentItemId: 5, penaltyAmount: 100 }]`
* **When** the operator opens the dialog again
* **Then** item with `id: 5` is pre-checked and its penalty input shows "100"

**Scenario 8: Tapping dimmed background closes the sheet (Cancel behavior)**

* **Given** the bottom sheet is open
* **When** the operator taps outside the sheet on the dimmed background
* **Then** the sheet closes without saving (equivalent to tapping "Cancel")

## 5. Out of Scope

* Sending broken equipment data to the API (the banner explicitly states this is under
  development; the data is submitted only as part of the Return request in FR-12)
* Creating repair work orders or service tickets
* Penalty amount validation rules (any positive number or zero is accepted; an empty
  penalty is treated as no penalty)

## 6. Screen Specification

### Layout (bottom sheet, slides up from bottom)

```
┌────────────────────────────────────────────┐
│  Broken equipment                          │  ← Title (bold)
│  Select items and enter penalty amounts    │  ← Subtitle (muted)
│  ─────────────────────────────────────     │
│  ☐  Trek FX3             BYN [______]     │  ← Active item row (input disabled)
│     bike · B-0042                          │
│  ☑  City Bike            BYN [200   ]     │  ← Checked item (input enabled)
│     bike · B-0055                          │
│  ─────────────────────────────────────     │
│  1 item already returned (read-only note)  │  ← Returned items note
│  ─────────────────────────────────────     │
│  ℹ Penalty submission under development    │  ← Informational banner
│  ─────────────────────────────────────     │
├──────────────────┬─────────────────────────┤
│  Cancel (ghost)  │  Apply (red outline)    │  ← Action buttons
└──────────────────┴─────────────────────────┘
```

### Elements

| Element                  | Position                            | Description                                                               |
|--------------------------|-------------------------------------|---------------------------------------------------------------------------|
| Title "Broken equipment" | Sheet top, bold                     | Identifies the dialog purpose                                             |
| Instructional subtitle   | Below title, muted                  | Guides operator on how to use the dialog                                  |
| Active item row          | List area, one per active item      | Checkbox (left) + name/category/UID (center) + penalty input (right)      |
| Penalty input            | Row right side                      | Numeric input; disabled until checkbox checked; currency symbol as prefix |
| Returned items note      | Below active items, non-interactive | Single line: "N items already returned"                                   |
| Informational banner     | Below returned items note           | States that penalty API submission is under development                   |
| "Cancel" button          | Bottom, left half                   | Ghost button; closes sheet; discards changes                              |
| "Apply" button           | Bottom, right half                  | Red outline button; saves to local store; closes sheet                    |

### Transitions

| Interaction                             | Outcome                                                      |
|-----------------------------------------|--------------------------------------------------------------|
| Tap item checkbox (unchecked → checked) | Item checked; penalty input enabled                          |
| Tap item checkbox (checked → unchecked) | Item unchecked; penalty input disabled and cleared           |
| Tap "Apply"                             | `BrokenEquipmentEntry[]` saved to detail store; sheet closes |
| Tap "Cancel"                            | Sheet closes; no state change                                |
| Tap dimmed background                   | Sheet closes (Cancel behavior)                               |
