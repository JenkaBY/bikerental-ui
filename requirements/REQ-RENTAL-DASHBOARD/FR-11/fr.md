# User Story: FR-11 — Rental Detail — Equipment Section

## 1. Description

**As an** operator
**I want to** see a list of all equipment items for the rental with checkboxes to select
which ones to return, with "Select all" and "Deselect" shortcuts, and already-returned
items clearly disabled
**So that** I can efficiently select the equipment being handed back and submit a partial
or full return

## 2. Context & Business Rules

* **Trigger:** Rental detail data has loaded and the Equipment section is rendered
* **Rules Enforced:**
  * Section header row: "Equipment" label on the left; "Select all" and "Deselect" text
    buttons on the right, inline with the label
  * One row per `RentalEquipmentItem` in `RentalDetail.equipmentItems`
  * Each row layout: checkbox (left) · equipment name bold + category and ID below
    (center) · status badge (right)
  * **Active item** (`isReturned === false`):
    - Checkbox is interactive and unchecked by default
    - Status badge shows "Active" (or the item's actual status)
    - Row is fully visible with normal opacity
  * **Returned item** (`isReturned === true`):
    - Checkbox is pre-checked and disabled (cannot be unchecked)
    - Row is visually dimmed (reduced opacity or muted colors)
    - Status badge shows "Returned"
  * "Select all" selects only active (non-returned) items; it has no effect on returned
    items
  * "Deselect" unchecks all active items; it has no effect on returned items
  * The count of currently selected checkboxes is tracked in the detail store as
    `selectedEquipmentCount` (a `computed()` signal); this count drives the label on
    the "Return equipment" button in FR-12
  * **Debt variant** (`isDebt === true`): all items show "Returned" badge; all
    checkboxes are pre-checked and disabled; "Select all" and "Deselect" buttons are
    hidden or disabled
  * The section is separated from adjacent sections by a divider

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Checkbox state is managed by a local signal (`Set<number>` of
  selected equipment item IDs); no API call on checkbox change
* **Security/Compliance:** N/A
* **Usability/Other:** Checkboxes must have a large enough touch target on mobile;
  returned items must be visually distinguishable at a glance (dimmed opacity)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Active items render with interactive checkboxes**

* **Given** a `RentalEquipmentItem` with `isReturned: false`
* **When** the Equipment section renders
* **Then** the row shows an unchecked, interactive checkbox; the row has normal opacity;
  the badge shows "Active"

**Scenario 2: Returned items render as disabled**

* **Given** a `RentalEquipmentItem` with `isReturned: true`
* **When** the Equipment section renders
* **Then** the row shows a pre-checked, disabled checkbox; the row is visually dimmed;
  the badge shows "Returned"

**Scenario 3: "Select all" checks only active items**

* **Given** the list has 2 active items and 1 returned item, all active items are
  unchecked
* **When** the operator taps "Select all"
* **Then** both active item checkboxes become checked; the returned item remains
  unchanged; `selectedEquipmentCount` is `2`

**Scenario 4: "Deselect" unchecks only active items**

* **Given** the list has 2 active items both checked
* **When** the operator taps "Deselect"
* **Then** both active item checkboxes become unchecked; `selectedEquipmentCount` is `0`

**Scenario 5: Row content shows name, category, and UID**

* **Given** a `RentalEquipmentItem` with `name: 'Trek FX3'`, `categorySlug: 'bike'`,
  `uid: 'B-0042'`
* **When** the Equipment section renders
* **Then** the row center shows "Trek FX3" (bold) and "bike · B-0042" (secondary text)
  below it

**Scenario 6: Debt rental — all items disabled**

* **Given** a rental with `isDebt: true`
* **When** the Equipment section renders
* **Then** all checkboxes are pre-checked and disabled; "Select all" and "Deselect"
  buttons are not visible

**Scenario 7: selectedEquipmentCount updates on checkbox change**

* **Given** 2 active items, neither checked
* **When** the operator checks one item
* **Then** `selectedEquipmentCount` becomes `1`

## 5. Out of Scope

* Reordering equipment items
* Adding or removing equipment items from a started rental

## 6. Screen Specification

### Layout

```
┌────────────────────────────────────────────────┐
│  Equipment              [Select all] [Deselect]│  ← Section header
│                                                │
│  ☑  Trek FX3                    [ Returned ]  │  ← Returned item (dimmed, disabled)
│     bike · B-0042                              │
│                                                │
│  ☐  City Bike                     [ Active ]  │  ← Active item (normal opacity)
│     bike · B-0055                              │
└────────────────────────────────────────────────┘
```

### Elements

| Element             | Position                                 | Description                                                        |
|---------------------|------------------------------------------|--------------------------------------------------------------------|
| "Equipment" label   | Section header, left                     | Static section title                                               |
| "Select all" button | Section header, right                    | Text button; selects all active items                              |
| "Deselect" button   | Section header, right of "Select all"    | Text button; deselects all active items                            |
| Checkbox            | Row, left                                | Interactive for active items; pre-checked + disabled for returned  |
| Equipment name      | Row, center, top line, bold              | The equipment's display name                                       |
| Category + UID      | Row, center, second line, secondary text | `{categorySlug} · {uid}`                                           |
| Status badge        | Row, right                               | "Active" or "Returned"; colored per `EquipmentItemStatus` metadata |

### Transitions

| Interaction              | Outcome                                                                         |
|--------------------------|---------------------------------------------------------------------------------|
| Tap active item checkbox | Checkbox toggles; `selectedEquipmentCount` signal updates                       |
| Tap "Select all"         | All active checkboxes checked; `selectedEquipmentCount` = count of active items |
| Tap "Deselect"           | All active checkboxes unchecked; `selectedEquipmentCount` = 0                   |
