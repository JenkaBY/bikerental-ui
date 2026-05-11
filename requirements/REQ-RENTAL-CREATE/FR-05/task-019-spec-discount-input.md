# Task 019: Spec for `DiscountInputComponent`

> **Applied Skill:** `angular-testing` — Dumb component spec. Tests: `null` initial renders empty; valid 0–100 value emits; out-of-range resets; empty commit emits `null`.

## 1. Objective

Unit tests for `DiscountInputComponent`: null initial state, valid range emit, out-of-range reset, empty → `null` emit.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/discount-input.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DiscountInputComponent } from './discount-input.component';

describe('DiscountInputComponent', () => {
  let fixture: ComponentFixture<DiscountInputComponent>;
  let component: DiscountInputComponent;

  async function setup(value: number | null = null) {
    await TestBed.configureTestingModule({
      imports: [DiscountInputComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscountInputComponent);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('should render an empty input when value is null', async () => {
    await setup(null);
    expect(component['rawValue']()).toBe('');
  });

  it('should emit the value when a valid percentage is committed', async () => {
    await setup(null);
    const emitted: Array<number | null> = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set(15);
    component['commit']();

    expect(emitted).toEqual([15]);
  });

  it('should emit null when field is cleared', async () => {
    await setup(15);
    const emitted: Array<number | null> = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set('');
    component['commit']();

    expect(emitted).toEqual([null]);
  });

  it('should reset to current value when out-of-range value is committed', async () => {
    await setup(10);
    component['rawValue'].set(150);
    component['commit']();
    expect(component['rawValue']()).toBe(10);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/discount-input.component.spec**"
```
