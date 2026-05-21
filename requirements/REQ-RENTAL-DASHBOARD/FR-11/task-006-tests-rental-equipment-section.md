# Task 006: Write Unit Tests for `RentalEquipmentSectionComponent`

> **Applied Skill:** `angular-testing` — Vitest + Angular `TestBed` with signal-based store stub; tests cover all seven BDD scenarios from FR-11 using `By.css` queries and Angular Material checkbox inspection.

## 1. Objective

Verify all acceptance criteria for `RentalEquipmentSectionComponent`:

* **AC-1:** Active items render with interactive checkboxes (unchecked, normal opacity)
* **AC-2:** Returned items render as pre-checked and disabled (dimmed row)
* **AC-3:** "Select all" calls `store.selectAllActiveItems()` with only active item IDs
* **AC-4:** "Deselect" calls `store.clearSelection()`
* **AC-5:** Row secondary text shows `{type.name} · {uid}`
* **AC-6:** DEBT rental — "Select all" and "Deselect" buttons are absent; checkboxes are disabled
* **AC-7:** Checking one item calls `store.selectEquipmentItem(id)`; unchecking calls `store.deselectEquipmentItem(id)`

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-equipment-section.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file — paste the complete content below.

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import type { RentalEquipmentItem } from '@bikerental/shared';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';

const ACTIVE_ITEM: RentalEquipmentItem = {
  id: 1,
  uid: 'B-0055',
  model: 'City Bike',
  type: { slug: 'bike', name: 'bike', isForSpecialTariff: false },
  statusSlug: 'ASSIGNED',
  isReturned: false,
};

const RETURNED_ITEM: RentalEquipmentItem = {
  id: 2,
  uid: 'B-0042',
  model: 'Trek FX3',
  type: { slug: 'bike', name: 'bike', isForSpecialTariff: false },
  statusSlug: 'RETURNED',
  isReturned: true,
};

function makeStore() {
  return {
    selectedEquipmentItemIds: signal<Set<number>>(new Set()),
    selectEquipmentItem: vi.fn(),
    deselectEquipmentItem: vi.fn(),
    selectAllActiveItems: vi.fn(),
    clearSelection: vi.fn(),
  };
}

describe('RentalEquipmentSectionComponent (FR-11)', () => {
  let fixture: ComponentFixture<RentalEquipmentSectionComponent>;
  let store: ReturnType<typeof makeStore>;

  async function setup(
    items: RentalEquipmentItem[],
    isDebt = false,
  ): Promise<ComponentFixture<RentalEquipmentSectionComponent>> {
    store = makeStore();

    await TestBed.configureTestingModule({
      imports: [RentalEquipmentSectionComponent],
      providers: [
        provideNoopAnimations(),
        { provide: RentalStore, useValue: store },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalEquipmentSectionComponent);
    fixture.componentRef.setInput('equipmentItems', items);
    fixture.componentRef.setInput('isDebt', isDebt);
    fixture.detectChanges();
    return fixture;
  }

  it('AC-1: Active item renders unchecked interactive checkbox with normal opacity', async () => {
    await setup([ACTIVE_ITEM]);

    const rows = fixture.debugElement.queryAll(By.css('.border-t'));
    expect(rows).toHaveLength(1);
    expect(rows[0].nativeElement.classList).not.toContain('opacity-40');

    const checkbox = rows[0].query(By.css('mat-checkbox'));
    expect(checkbox).not.toBeNull();
    expect(checkbox.nativeElement.getAttribute('ng-reflect-disabled')).not.toBe('true');
  });

  it('AC-2: Returned item renders pre-checked disabled checkbox with dimmed row', async () => {
    await setup([RETURNED_ITEM]);

    const rows = fixture.debugElement.queryAll(By.css('.border-t'));
    expect(rows[0].nativeElement.classList).toContain('opacity-40');

    const checkbox = rows[0].query(By.css('mat-checkbox'));
    expect(checkbox).not.toBeNull();
    expect(checkbox.nativeElement.getAttribute('ng-reflect-disabled')).toBe('true');
  });

  it('AC-3: "Select all" calls selectAllActiveItems with only active item IDs', async () => {
    await setup([ACTIVE_ITEM, RETURNED_ITEM]);

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const selectAllBtn = Array.from(buttons).find((b) =>
      b.textContent?.toLowerCase().includes('select all'),
    );
    expect(selectAllBtn).toBeDefined();
    selectAllBtn!.click();

    expect(store.selectAllActiveItems).toHaveBeenCalledWith([ACTIVE_ITEM.id]);
  });

  it('AC-4: "Deselect" calls clearSelection', async () => {
    await setup([ACTIVE_ITEM]);

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    const deselectBtn = Array.from(buttons).find((b) =>
      b.textContent?.toLowerCase().includes('deselect'),
    );
    expect(deselectBtn).toBeDefined();
    deselectBtn!.click();

    expect(store.clearSelection).toHaveBeenCalled();
  });

  it('AC-5: Row secondary text shows "{type.name} · {uid}"', async () => {
    await setup([ACTIVE_ITEM]);

    const secondaryText: HTMLElement = fixture.nativeElement.querySelector('.text-xs.text-slate-500');
    expect(secondaryText.textContent?.trim()).toBe('bike · B-0055');
  });

  it('AC-6: DEBT rental — select/deselect buttons absent and checkboxes disabled', async () => {
    await setup([ACTIVE_ITEM], true);

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    expect(buttons).toHaveLength(0);

    const checkbox = fixture.debugElement.query(By.css('mat-checkbox'));
    expect(checkbox.nativeElement.getAttribute('ng-reflect-disabled')).toBe('true');
  });

  it('AC-7a: Checking an active item calls selectEquipmentItem with its id', async () => {
    await setup([ACTIVE_ITEM]);

    const checkbox = fixture.debugElement.query(By.css('mat-checkbox'));
    const inputEl: HTMLInputElement = checkbox.nativeElement.querySelector('input[type="checkbox"]');
    inputEl.click();
    fixture.detectChanges();

    expect(store.selectEquipmentItem).toHaveBeenCalledWith(ACTIVE_ITEM.id);
  });

  it('AC-7b: Unchecking a selected active item calls deselectEquipmentItem with its id', async () => {
    store = makeStore();
    store.selectedEquipmentItemIds.set(new Set([ACTIVE_ITEM.id]));

    await TestBed.configureTestingModule({
      imports: [RentalEquipmentSectionComponent],
      providers: [
        provideNoopAnimations(),
        { provide: RentalStore, useValue: store },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalEquipmentSectionComponent);
    fixture.componentRef.setInput('equipmentItems', [ACTIVE_ITEM]);
    fixture.componentRef.setInput('isDebt', false);
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(By.css('mat-checkbox'));
    const inputEl: HTMLInputElement = checkbox.nativeElement.querySelector('input[type="checkbox"]');
    inputEl.click();
    fixture.detectChanges();

    expect(store.deselectEquipmentItem).toHaveBeenCalledWith(ACTIVE_ITEM.id);
  });
});
```

### Key notes for the Junior Dev Agent

* The `store` stub must expose `selectedEquipmentItemIds` as a `signal<Set<number>>()` — not a plain value — because the component template reads `store.selectedEquipmentItemIds()` reactively via `isChecked()`.
* `provideNoopAnimations()` is required to prevent Angular Material checkbox animation errors in the test environment.
* `fixture.componentRef.setInput()` is used for signal inputs (not direct property assignment).
* **AC-7b** creates a fresh `TestBed` configuration to pre-populate the selection set. This avoids `TestBed.resetTestingModule()` conflicts.
* Angular Material renders `ng-reflect-disabled="true"` on the host element when a component's `disabled` input is `true`. This is the reliable way to assert disabled state without querying internal DOM.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx vitest run projects/operator/src/app/rental-detail/rental-equipment-section.component.spec.ts
```
