# System Design: FR-13 — Broken Equipment Dialog

## 1. Architectural Overview

FR-13 introduces `BrokenEquipmentSheetComponent`, a bottom sheet overlay that allows the operator
to mark active equipment items as broken and optionally enter a penalty amount for each. The sheet
operates entirely in local state: it reads the current `brokenEquipmentEntries` from
`RentalDetailStore` on open (to restore previous state), collects operator input, and writes the
updated `BrokenEquipmentEntry[]` list back to `RentalDetailStore` when "Apply" is tapped. No API
calls are made. The data is submitted to the backend as part of the return request (FR-12).

Returned items (those with `statusSlug === 'RETURNED'`) are excluded from the interactive list and
shown only as a collapsed count note. An informational banner explicitly states that penalty API
submission is under development, managing operator expectations about the current behavior.

## 2. Impacted Components

* **`BrokenEquipmentSheetComponent` (Operator SPA — new component):** *(New component)* Opened as
  a bottom sheet by `RentalActionButtonsComponent`. Receives via sheet data:
  - `equipmentItems: RentalEquipmentItem[]` — the full list from `RentalDetailState`.
  - `existingEntries: BrokenEquipmentEntry[]` — the previously saved broken equipment state from
    `RentalDetailStore` (used to pre-populate the form on re-open).
    Responsibilities:
  - On open: splits `equipmentItems` into active items (`isReturned === false`) and returned items.
  - Pre-populates checkboxes and penalty inputs from `existingEntries`.
  - Renders one interactive row per active item: checkbox (left), name + category + UID (center),
    currency symbol + numeric penalty input (right; disabled until checkbox is checked).
  - Renders a single note line below the active items: "N items already returned" where N is the
    count of returned items; shown only when N > 0.
  - Renders an informational banner below the note: "Penalty submission is under development."
  - Renders two bottom buttons: "Cancel" (ghost, left) and "Apply" (outlined warning, right).
  - On checkbox check: enables the corresponding penalty input.
  - On checkbox uncheck: disables and clears the corresponding penalty input.
  - On "Apply" tap: collects the `BrokenEquipmentEntry[]` from checked items (only checked items
    are included; penalty is `undefined` when input is empty) and returns the list as the sheet
    close result.
  - On "Cancel" tap or background dismiss: closes the sheet without returning a result.

* **`RentalDetailStore` (Operator SPA — updated from FR-12):** Gains broken equipment state:
  - `brokenEquipmentEntries: WritableSignal<BrokenEquipmentEntry[]>` — initialised as `[]`.
  - `setBrokenEquipmentEntries(entries: BrokenEquipmentEntry[]): void` — replaces the list.

* **`RentalActionButtonsComponent` (Operator SPA — updated from FR-12):** After the sheet closes
  with a non-null result (i.e., "Apply" was tapped), calls
  `RentalDetailStore.setBrokenEquipmentEntries(result)`. When the sheet closes with no result
  (cancel or background dismiss), `brokenEquipmentEntries` is unchanged.

## 3. Abstract Data Schema Changes

No new backend schema changes. `BrokenEquipmentEntry` is the existing domain model defined in
FR-01. Broken equipment entries are submitted to the backend as part of the return request
(FR-12) — no standalone broken-equipment API endpoint is required at this stage.

## 4. Component Contracts & Payloads

* **Interaction: `RentalActionButtonsComponent` -> `BrokenEquipmentSheetComponent` (open)**
  * **Protocol:** In-process bottom sheet open
  * **Payload Changes:** Sheet input data:
    `{ equipmentItems: RentalEquipmentItem[], existingEntries: BrokenEquipmentEntry[] }`.
    `existingEntries` is read from `RentalDetailStore.brokenEquipmentEntries()` at the moment
    of opening.

* **Interaction: `BrokenEquipmentSheetComponent` -> `RentalActionButtonsComponent` (close result)**
  * **Protocol:** In-process sheet close with result
  * **Payload Changes:** On "Apply": closes with `BrokenEquipmentEntry[]` (may be empty array).
    On "Cancel" or background dismiss: closes with `undefined` (no result).

* **Interaction: `RentalActionButtonsComponent` -> `RentalDetailStore` (store broken entries)**
  * **Protocol:** In-process method call
  * **Payload Changes:** Calls `setBrokenEquipmentEntries(entries)` only when the sheet closes
    with a defined result (i.e., only on "Apply", not on cancel).

## 5. Updated Interaction Sequence

### Scenario: Operator opens the sheet for the first time (no prior state)

1. Operator taps "🔧 Broken".
2. `RentalActionButtonsComponent` reads `RentalDetailStore.brokenEquipmentEntries()` — empty.
3. `BrokenEquipmentSheetComponent` opens with `existingEntries = []`.
4. Sheet renders 2 active item rows (all checkboxes unchecked, all penalty inputs disabled) and
   a note "1 item already returned" below.
5. Informational banner is displayed.

### Scenario: Operator marks one item as broken with a penalty

1. Operator checks the checkbox for "Trek FX3" (id = 5).
2. The penalty input for "Trek FX3" becomes enabled.
3. Operator enters "200" in the penalty input.
4. Operator taps "Apply".
5. Sheet collects result: `[{ equipmentItemId: 5, penaltyAmount: 200 }]`.
6. Sheet closes with this result.
7. `RentalActionButtonsComponent` calls `RentalDetailStore.setBrokenEquipmentEntries([{ equipmentItemId: 5, penaltyAmount: 200 }])`.

### Scenario: Operator re-opens the dialog after a previous apply

1. Operator taps "🔧 Broken" again.
2. `RentalDetailStore.brokenEquipmentEntries()` returns `[{ equipmentItemId: 5, penaltyAmount: 200 }]`.
3. Sheet opens with `existingEntries = [{ equipmentItemId: 5, penaltyAmount: 200 }]`.
4. The checkbox for item id = 5 is pre-checked; the penalty input shows "200".

### Scenario: Operator taps "Cancel" after making changes

1. Operator checks a checkbox and enters a penalty.
2. Operator taps "Cancel".
3. Sheet closes with `undefined` result.
4. `RentalActionButtonsComponent` receives no result; `brokenEquipmentEntries` in the store
   is unchanged from before the sheet opened.

### Scenario: Operator taps background to dismiss

1. Operator taps outside the sheet on the dimmed overlay.
2. Sheet closes with `undefined` result (equivalent to "Cancel").
3. `brokenEquipmentEntries` is unchanged.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII in the broken equipment entries (equipment IDs and penalty amounts
  are operational data). The informational banner must clearly communicate the
  under-development status to avoid operator confusion about whether penalty data is being
  persisted to the backend.
* **Scale & Performance:** No API calls in this dialog. All state operations are synchronous.
  The penalty input must trigger the numeric keyboard on mobile devices (input type = number
  or appropriate equivalent). The bottom sheet must be dismissible via the background overlay
  tap to support natural mobile interaction patterns.
