# Task 005: Write Unit Tests for `BrokenEquipmentSheetComponent`

> **Applied Skill:** `angular-testing` — Uses Vitest + Angular TestBed; injects `MAT_BOTTOM_SHEET_DATA` and `MatBottomSheetRef` as value providers; verifies signal-driven UI behaviour, checkbox/penalty interactions, Apply result construction, and Cancel dismissal.

## 1. Objective

Cover all acceptance criteria from `fr.md`:

- **AC-1:** Active items listed with disabled penalty inputs; returned items shown as count note
- **AC-2:** Checking an item enables its penalty input
- **AC-3:** Unchecking an item disables and clears the penalty input
- **AC-4:** Apply collects only checked items, maps penalty amounts correctly, dismisses with `BrokenEquipmentEntry[]`
- **AC-5:** Apply with no items checked dismisses with `[]`
- **AC-6:** Cancel dismisses with `undefined`
- **AC-7:** Re-opening pre-populates checkboxes and penalty amounts from `existingEntries`

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/broken-equipment-sheet.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import type { BrokenEquipmentEntry, RentalEquipmentItem } from '@ui-models';
import { BrokenEquipmentSheetComponent } from './broken-equipment-sheet.component';

function makeItem(id: number, isReturned: boolean): RentalEquipmentItem {
  return {
    id,
    uid: `B-00${id}`,
    model: `Bike ${id}`,
    type: { slug: 'bike', name: 'bike', isForSpecialTariff: false },
    isReturned,
    statusSlug: isReturned ? 'RETURNED' : 'ACTIVE',
  };
}

async function setup(
  equipmentItems: RentalEquipmentItem[],
  existingEntries: BrokenEquipmentEntry[] = [],
) {
  const sheetRef = { dismiss: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [BrokenEquipmentSheetComponent],
    providers: [
      provideNoopAnimations(),
      { provide: MAT_BOTTOM_SHEET_DATA, useValue: { equipmentItems, existingEntries } },
      { provide: MatBottomSheetRef, useValue: sheetRef },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(BrokenEquipmentSheetComponent);
  fixture.detectChanges();
  return { fixture, sheetRef };
}

describe('BrokenEquipmentSheetComponent', () => {
  describe('AC-1: initial render', () => {
    it('shows one row per active item and all penalty inputs are disabled', async () => {
      const items = [makeItem(1, false), makeItem(2, false), makeItem(3, true)];
      const { fixture } = await setup(items);

      const rows = fixture.nativeElement.querySelectorAll('mat-checkbox') as NodeListOf<Element>;
      expect(rows.length).toBe(2);

      const inputs = fixture.nativeElement.querySelectorAll(
        'input[type="number"]',
      ) as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => expect(input.disabled).toBe(true));
    });

    it('shows returned items note when returnedCount > 0', async () => {
      const items = [makeItem(1, false), makeItem(2, true)];
      const { fixture } = await setup(items);

      const note = fixture.nativeElement.querySelector('p.italic') as HTMLElement;
      expect(note.textContent).toContain('1');
    });

    it('does not show returned items note when returnedCount is 0', async () => {
      const items = [makeItem(1, false)];
      const { fixture } = await setup(items);

      const note = fixture.nativeElement.querySelector('p.italic');
      expect(note).toBeNull();
    });
  });

  describe('AC-2: checking an item enables its penalty input', () => {
    it('enables the penalty input after the checkbox is checked', async () => {
      const items = [makeItem(1, false)];
      const { fixture } = await setup(items);

      const checkbox = fixture.nativeElement.querySelector(
        'mat-checkbox input[type="checkbox"]',
      ) as HTMLInputElement;
      checkbox.click();
      fixture.detectChanges();

      const penaltyInput = fixture.nativeElement.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      expect(penaltyInput.disabled).toBe(false);
    });
  });

  describe('AC-3: unchecking an item disables and clears its penalty input', () => {
    it('clears and disables the penalty input when unchecked', async () => {
      const items = [makeItem(5, false)];
      const { fixture } = await setup(items, [{ equipmentItemId: 5, penaltyAmount: 200 }]);

      const checkbox = fixture.nativeElement.querySelector(
        'mat-checkbox input[type="checkbox"]',
      ) as HTMLInputElement;

      checkbox.click();
      fixture.detectChanges();

      const penaltyInput = fixture.nativeElement.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      expect(penaltyInput.disabled).toBe(true);
      expect(penaltyInput.value).toBe('');
    });
  });

  describe('AC-4: Apply collects checked items and dismisses with entries', () => {
    it('dismisses with correct BrokenEquipmentEntry[] on Apply', async () => {
      const items = [makeItem(5, false), makeItem(6, false)];
      const { fixture, sheetRef } = await setup(items, [
        { equipmentItemId: 5, penaltyAmount: 200 },
      ]);

      const applyBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b: Element) => (b as HTMLButtonElement).textContent?.includes('Apply')) as HTMLButtonElement;
      applyBtn.click();
      fixture.detectChanges();

      expect(sheetRef.dismiss).toHaveBeenCalledWith([
        { equipmentItemId: 5, penaltyAmount: 200 },
      ]);
    });

    it('sets penaltyAmount to undefined when penalty input is empty', async () => {
      const items = [makeItem(7, false)];
      const { fixture, sheetRef } = await setup(items, [{ equipmentItemId: 7 }]);

      const applyBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b: Element) => (b as HTMLButtonElement).textContent?.includes('Apply')) as HTMLButtonElement;
      applyBtn.click();
      fixture.detectChanges();

      expect(sheetRef.dismiss).toHaveBeenCalledWith([
        { equipmentItemId: 7, penaltyAmount: undefined },
      ]);
    });
  });

  describe('AC-5: Apply with no items checked dismisses with empty array', () => {
    it('dismisses with [] when no checkboxes are checked', async () => {
      const items = [makeItem(1, false)];
      const { fixture, sheetRef } = await setup(items);

      const applyBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b: Element) => (b as HTMLButtonElement).textContent?.includes('Apply')) as HTMLButtonElement;
      applyBtn.click();
      fixture.detectChanges();

      expect(sheetRef.dismiss).toHaveBeenCalledWith([]);
    });
  });

  describe('AC-6: Cancel dismisses with undefined', () => {
    it('calls dismiss() with no argument on Cancel', async () => {
      const items = [makeItem(1, false)];
      const { fixture, sheetRef } = await setup(items);

      const cancelBtn = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b: Element) => (b as HTMLButtonElement).textContent?.includes('Cancel')) as HTMLButtonElement;
      cancelBtn.click();
      fixture.detectChanges();

      expect(sheetRef.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('AC-7: re-opening pre-populates from existingEntries', () => {
    it('pre-checks the checkbox for an existing entry and shows its penalty', async () => {
      const items = [makeItem(5, false)];
      const { fixture } = await setup(items, [{ equipmentItemId: 5, penaltyAmount: 100 }]);

      const checkbox = fixture.nativeElement.querySelector(
        'mat-checkbox input[type="checkbox"]',
      ) as HTMLInputElement;
      const penaltyInput = fixture.nativeElement.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;

      expect(checkbox.checked).toBe(true);
      expect(penaltyInput.value).toBe('100');
      expect(penaltyInput.disabled).toBe(false);
    });
  });
});
```

> **Note on checkbox interaction in tests:** `checkbox.click()` triggers the native click event
> which propagates to Angular Material's `MatCheckbox` and emits the `(change)` event. After
> `detectChanges()` the signal is updated and the DOM reflects the new state.

> **Note on `existingEntries` pre-population for AC-7:** Item with `id: 5` and `penaltyAmount: 100`
> is found by `find((e) => e.equipmentItemId === item.id)`. The component initialises `checked: true`
> and `penalty: '100'`, so the checkbox renders checked and input renders with value `'100'`.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npm test -- --reporter=verbose broken-equipment-sheet
```
