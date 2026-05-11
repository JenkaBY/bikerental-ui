# Task 016: Spec for `EquipmentItemRowComponent`

> **Applied Skill:** `angular-testing` — Dumb component spec. Verifies UID/model/type name render and `removeRequested` output emission.

## 1. Objective

Unit tests verifying: UID, model, and type name are rendered; clicking the remove button emits `removeRequested` with the item's id.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/equipment-item-row.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import type { EquipmentSearchItem } from '@bikerental/shared';
import { EquipmentItemRowComponent } from './equipment-item-row.component';

const ITEM: EquipmentSearchItem = {
  id: 1,
  uid: 'ABC12',
  model: 'Trek FX3',
  type: { slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false },
};

describe('EquipmentItemRowComponent', () => {
  let fixture: ComponentFixture<EquipmentItemRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentItemRowComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentItemRowComponent);
    fixture.componentRef.setInput('item', ITEM);
    fixture.detectChanges();
  });

  it('should render uid, model, and type name', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('ABC12');
    expect(text).toContain('Trek FX3');
    expect(text).toContain('Bicycle');
  });

  it('should emit removeRequested with item id when remove button is clicked', () => {
    const emitted: number[] = [];
    fixture.componentInstance.removeRequested.subscribe((id) => emitted.push(id));

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();

    expect(emitted).toEqual([1]);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/equipment-item-row.component.spec**"
```
