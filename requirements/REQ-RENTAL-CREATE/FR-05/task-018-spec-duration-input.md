# Task 018: Spec for `DurationInputComponent`

> **Applied Skill:** `angular-testing` — Dumb component spec. Tests that valid input emits on blur; invalid input is silently reset; the initial `value` is reflected.

## 1. Objective

Unit tests for `DurationInputComponent`: initial render, valid commit, invalid reset.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/duration-input.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DurationInputComponent } from './duration-input.component';

describe('DurationInputComponent', () => {
  let fixture: ComponentFixture<DurationInputComponent>;
  let component: DurationInputComponent;

  async function setup(value = 60) {
    await TestBed.configureTestingModule({
      imports: [DurationInputComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(DurationInputComponent);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('should display the initial value in the input', async () => {
    await setup(120);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(Number(input.value)).toBe(120);
  });

  it('should emit the parsed number when a valid value is committed', async () => {
    await setup(60);
    const emitted: number[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component['rawValue'].set(240);
    component['commit']();

    expect(emitted).toEqual([240]);
  });

  it('should reset rawValue to the current value when an invalid string is committed', async () => {
    await setup(60);
    component['rawValue'].set('abc');
    component['commit']();
    expect(Number(component['rawValue']())).toBe(60);
  });

  it('should not emit when rawValue is not a positive number', async () => {
    await setup(60);
    const emitted: number[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));
    component['rawValue'].set(-10);
    component['commit']();
    expect(emitted).toEqual([]);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/duration-input.component.spec**"
```
