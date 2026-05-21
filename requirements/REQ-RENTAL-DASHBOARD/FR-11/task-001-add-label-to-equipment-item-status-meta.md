# Task 001: Add `label` Field to `EquipmentItemStatusMeta` and Populate `EquipmentItemStatus` Record

> **Applied Skill:** `angular-component` — Domain model fix required before `RentalEquipmentSectionComponent` can resolve a human-readable status badge label from `mapEquipmentItemStatus()`. Follows the same pattern already used by `RentalStatusMeta.label`.

## 1. Objective

`EquipmentItemStatusMeta` has a `labelKey` field but no `label` string. The new `RentalEquipmentSectionComponent` will call `mapEquipmentItemStatus(item.statusSlug).label` to display the badge text. Add `label: string` to the interface and populate it in all three existing `EquipmentItemStatus` entries using already-existing `Labels` constants.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/rental.model.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — `Labels` is already imported at the top of this file.

### Step A — Add `label` to the `EquipmentItemStatusMeta` interface

**Before:**

```typescript
export interface EquipmentItemStatusMeta {
  readonly slug: string;
  readonly color: 'primary' | 'accent' | 'warn' | 'default';
  readonly labelKey: string;
}
```

**After:**

```typescript
export interface EquipmentItemStatusMeta {
  readonly slug: string;
  readonly color: 'primary' | 'accent' | 'warn' | 'default';
  readonly labelKey: string;
  readonly label: string;
}
```

### Step B — Populate `label` in the `EquipmentItemStatus` record

**Before:**

```typescript
export const EquipmentItemStatus: Record<string, EquipmentItemStatusMeta> = {
  ASSIGNED: { slug: 'ASSIGNED', color: 'primary', labelKey: 'equipmentItemStatus.assigned' },
  ACTIVE: { slug: 'ACTIVE', color: 'warn', labelKey: 'equipmentItemStatus.active' },
  RETURNED: { slug: 'RETURNED', color: 'default', labelKey: 'equipmentItemStatus.returned' },
};
```

**After:**

```typescript
export const EquipmentItemStatus: Record<string, EquipmentItemStatusMeta> = {
  ASSIGNED: {
    slug: 'ASSIGNED',
    color: 'primary',
    labelKey: 'equipmentItemStatus.assigned',
    label: Labels.EquipmentItemStatusAssigned,
  },
  ACTIVE: {
    slug: 'ACTIVE',
    color: 'warn',
    labelKey: 'equipmentItemStatus.active',
    label: Labels.EquipmentItemStatusActive,
  },
  RETURNED: {
    slug: 'RETURNED',
    color: 'default',
    labelKey: 'equipmentItemStatus.returned',
    label: Labels.Returned,
  },
};
```

> **Note on `DEFAULT_EQUIPMENT_ITEM_STATUS`:** This constant also uses `EquipmentItemStatusMeta`. Add `label: ''` to it to satisfy the updated interface:
>
> **Before:**
> ```typescript
> const DEFAULT_EQUIPMENT_ITEM_STATUS: EquipmentItemStatusMeta = {
>   slug: '',
>   color: 'default',
>   labelKey: '',
> };
> ```
>
> **After:**
> ```typescript
> const DEFAULT_EQUIPMENT_ITEM_STATUS: EquipmentItemStatusMeta = {
>   slug: '',
>   color: 'default',
>   labelKey: '',
>   label: '',
> };
> ```

## 4. Validation Steps

skip
