# System Design: FR-11 — Rental Detail — Equipment Section

## 1. Architectural Overview

FR-11 introduces `RentalEquipmentSectionComponent`, which renders the list of `RentalEquipmentItem`
records from `RentalDetailState` and allows the operator to select which active items to include
in the return operation. Checkbox state is held as a `Set<number>` of selected equipment item IDs
in `RentalDetailStore`. A computed signal (`selectedEquipmentCount`) derived from this set drives
the label on the return button (FR-12) and the `isSelectedAnyEquipment()` method required by the
`RENTAL_STORE_TOKEN` interface (FR-10).

Returned items (`isReturned === true`) are rendered as pre-checked, disabled rows with dimmed
visual treatment. For DEBT rentals, all items are treated as returned (all disabled). "Select all"
and "Deselect" shortcuts act only on active (non-returned) items.

## 2. Impacted Components

* **`RentalEquipmentSectionComponent` (Operator SPA — new component):** *(New component)*
  Receives `equipmentItems: RentalEquipmentItem[]` and `isDebt: boolean` as inputs. Responsibilities:
  - Renders a section header row: "Equipment" label (left); "Select all" and "Deselect" text
    buttons (right) — hidden or disabled when `isDebt === true`.
  - Renders one row per `RentalEquipmentItem`:
    - **Active item** (`isReturned === false`): interactive checkbox, normal opacity; equipment
      name (bold), category + UID (secondary text), status badge.
    - **Returned item** (`isReturned === true`): pre-checked disabled checkbox, dimmed row;
      "Returned" status badge.
  - On "Select all" tap: adds all active item IDs to the selected set in `RentalDetailStore`.
  - On "Deselect" tap: clears all active item IDs from the selected set.
  - On individual checkbox toggle: adds or removes the item ID from the set.
  - Is separated from adjacent sections by a divider.
  - Status badge label and color for each item are resolved via `mapEquipmentItemStatus(item.statusSlug)`
    from the shared domain models layer.

* **`RentalDetailStore` (Operator SPA — updated from FR-06/FR-07/FR-09/FR-10):** Gains equipment
  selection state:
  - `selectedEquipmentItemIds: WritableSignal<Set<number>>` — initialised as an empty set.
  - `selectedEquipmentCount: computed(() => selectedEquipmentItemIds().size)` — exposed as a
    read signal for FR-12 (button label) and for `isSelectedAnyEquipment()` (FR-10 token).
  - `selectEquipmentItem(id: number): void` — adds ID to the set (immutable update).
  - `deselectEquipmentItem(id: number): void` — removes ID from the set.
  - `selectAllActiveItems(ids: number[]): void` — replaces set with all provided active IDs.
  - `clearSelection(): void` — resets set to empty.
  - `isSelectedAnyEquipment(): boolean` — `computed(() => selectedEquipmentCount() > 0)`.

## 3. Abstract Data Schema Changes

No new backend schema changes. `RentalEquipmentItem` was defined in FR-01. Equipment selection
state is transient local state in `RentalDetailStore`.

## 4. Component Contracts & Payloads

* **Interaction: `RentalDetailComponent` -> `RentalEquipmentSectionComponent`**
  * **Protocol:** In-process input binding
  * **Payload Changes:** Passes `equipmentItems: RentalEquipmentItem[]` sourced from
    `RentalDetailStore.equipmentItems()` and `isDebt: boolean` from `RentalDetailStore.isDebt()`.

* **Interaction: `RentalEquipmentSectionComponent` -> `RentalDetailStore` (selection mutations)**
  * **Protocol:** In-process method calls
  * **Payload Changes:** Calls `selectEquipmentItem(id)`, `deselectEquipmentItem(id)`,
    `selectAllActiveItems(ids)`, or `clearSelection()` based on user interaction.

## 5. Updated Interaction Sequence

### Scenario: Equipment section renders for an active rental

1. `RentalDetailComponent` passes `equipmentItems` (2 active, 1 returned) and `isDebt = false`
   to `RentalEquipmentSectionComponent`.
2. Section renders: "Equipment" header with "Select all" and "Deselect" buttons.
3. Two active rows with interactive unchecked checkboxes.
4. One returned row with pre-checked disabled checkbox and dimmed opacity.
5. `selectedEquipmentCount` is `0`; FR-12 "Return equipment" button shows "(0)" and is disabled.

### Scenario: Operator taps "Select all"

1. The component collects IDs of all active items (those with `isReturned === false`): `[id1, id2]`.
2. Calls `RentalDetailStore.selectAllActiveItems([id1, id2])`.
3. `selectedEquipmentItemIds` becomes `Set { id1, id2 }`.
4. `selectedEquipmentCount` becomes `2`.
5. Both active checkboxes render as checked.
6. FR-12 "Return equipment" button label updates to "(2)"; button is enabled.

### Scenario: Operator unchecks one item

1. Operator taps the checkbox for `id1`.
2. Component calls `RentalDetailStore.deselectEquipmentItem(id1)`.
3. `selectedEquipmentItemIds` becomes `Set { id2 }`.
4. `selectedEquipmentCount` becomes `1`.
5. FR-12 button label updates to "(1)".

### Scenario: DEBT rental — all items disabled

1. `isDebt = true`; all equipment items have `isReturned = true` in the DEBT context.
2. Section renders: all rows with pre-checked disabled checkboxes; "Select all" and "Deselect"
   buttons are absent.
3. `selectedEquipmentCount` is `0`; FR-12 shows only the "Broken" button.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Equipment UIDs and names are operational data; no PII involved.
* **Scale & Performance:** Set-based selection state ensures O(1) add/remove operations.
  The `selectedEquipmentCount` derived signal is recomputed only when the set changes.
  Checkbox touch targets must meet minimum mobile touch-target size (44 × 44 dp) for safe
  one-thumb operation.
