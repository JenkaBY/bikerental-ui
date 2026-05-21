# Task 006: Mount `RentalActionButtonsComponent` in `RentalDetailComponent`

> **Applied Skill:** `angular-component` — Wires the new action buttons bar into the rental detail page template. The component is placed **outside** the scrollable `overflow-y-auto` container, as the last child of the `@else if` wrapper, so the button bar is always visible at the bottom of the screen.

## 1. Objective

`RentalActionButtonsComponent` must appear below the scrollable content area, pinned to the bottom of the full-height flex column. It is shown only when the rental has moved beyond DRAFT status.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Step A — Add import of `RentalActionButtonsComponent`

**Before:**

```typescript
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';
```

**After:**

```typescript
import { RentalActionButtonsComponent } from './rental-action-buttons.component';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';
```

### Step B — Add to `imports` array in `@Component` decorator

**Before:**

```typescript
    RentalEquipmentSectionComponent,
```

**After:**

```typescript
    RentalActionButtonsComponent,
    RentalEquipmentSectionComponent,
```

### Step C — Add action buttons block to the template

**Context:** The template's `@else if (store.id() !== null)` block contains a single `<div class="flex-1 overflow-y-auto">` scrollable container. The action buttons must be added **after the closing `</div>`** of that scrollable container, still inside the `@else if` block.

**Before (end of the `@else if` block):**

```html
      @if (!store.isDraft()) {
        <app-rental-equipment-section
          [equipmentItems]="store.rentalEquipmentItems()"
          [isDebt]="store.isDebt()"
        />
      }
    </div>
  }
```

**After:**

```html
      @if (!store.isDraft()) {
        <app-rental-equipment-section
          [equipmentItems]="store.rentalEquipmentItems()"
          [isDebt]="store.isDebt()"
        />
      }
    </div>

    @if (!store.isDraft()) {
      <app-rental-action-buttons />
    }
  }
```

> **Layout note:** The outer `<div class="flex flex-col h-full">` is a full-height flex column. The scrollable div has `flex-1` which absorbs the remaining space. The action buttons container uses `shrink-0` internally (see Task 005 template) so it never collapses and stays pinned at the bottom.

## 4. Validation Steps

skip
