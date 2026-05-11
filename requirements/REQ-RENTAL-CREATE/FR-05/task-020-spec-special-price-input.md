# Task 020: Spec for `SpecialPriceInputComponent`

> **Applied Skill:** `angular-testing` — Dumb component spec. Tests: valid positive emit; null initial; `showError` shown when `showRequired=true` and value is null; error hidden after valid commit.

## 1. Objective

Unit tests for `SpecialPriceInputComponent`: positive value emit, null → no emit, validation error visibility.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/special-price-input.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SpecialPriceInputComponent } from './special-price-input.component';

describe('SpecialPriceInputComponent', () => {
  let fixture: ComponentFixture<SpecialPriceInputComponent>;
  let component: SpecialPriceInputComponent;

  async function setup(value: number | null = null, showRequired = false) {
    await TestBed.configureTestingModule({
      imports: [SpecialPriceInputComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialPriceInputComponent);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('showRequired', showRequired);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('should emit the value when a valid positive number is committed', async () => {
    await setup(null);
    const emitted: Array<number | null> = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set(49.99);
    component['commit']();

    expect(emitted).toEqual([49.99]);
  });

  it('should not emit when committed value is 0 or negative', async () => {
    await setup(null);
    const emitted: Array<number | null> = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set(0);
    component['commit']();

    expect(emitted).toEqual([]);
  });

  it('should show error when showRequired is true and value is null', async () => {
    await setup(null, true);
    expect(component['showError']()).toBe(true);
  });

  it('should hide error after a valid commit', async () => {
    await setup(null, true);
    component['rawValue'].set(25);
    component['commit']();
    expect(component['showError']()).toBe(false);
  });

  it('should emit null when field is cleared', async () => {
    await setup(10);
    const emitted: Array<number | null> = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set('');
    component['commit']();

    expect(emitted).toEqual([null]);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/special-price-input.component.spec**"
```
