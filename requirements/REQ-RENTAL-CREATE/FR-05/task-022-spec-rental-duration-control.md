# Task 022: Spec for `RentalDurationControlComponent`

> **Applied Skill:** `angular-testing` — Smart component. Override `RentalStore` via `overrideComponent`. Tests: slider `valueChange` snaps to nearest point and calls `setDurationMinutes`; input `valueChange` with mid-point value snaps correctly.

## 1. Objective

Unit tests for `RentalDurationControlComponent`: snapping logic via slider and input, both call `store.setDurationMinutes` with the snapped value.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-duration-control.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import { RentalDurationControlComponent } from './rental-duration-control.component';

function makeStore(durationMinutes = 60) {
  return {
    durationMinutes: signal(durationMinutes),
    setDurationMinutes: vi.fn(),
  };
}

describe('RentalDurationControlComponent', () => {
  let fixture: ComponentFixture<RentalDurationControlComponent>;
  let component: RentalDurationControlComponent;
  let store: ReturnType<typeof makeStore>;

  async function setup(duration = 60) {
    store = makeStore(duration);

    await TestBed.configureTestingModule({
      imports: [RentalDurationControlComponent],
      providers: [provideAnimationsAsync()],
    })
      .overrideComponent(RentalDurationControlComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalDurationControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should call setDurationMinutes with 60 when exact snap value is passed', async () => {
    await setup();
    component['onDurationChange'](60);
    expect(store.setDurationMinutes).toHaveBeenCalledWith(60);
  });

  it('should snap 90 minutes to 120 (nearest snap point)', async () => {
    await setup();
    component['onDurationChange'](90);
    expect(store.setDurationMinutes).toHaveBeenCalledWith(120);
  });

  it('should snap 50 minutes to 60 (nearest snap point)', async () => {
    await setup();
    component['onDurationChange'](50);
    expect(store.setDurationMinutes).toHaveBeenCalledWith(60);
  });

  it('should snap 2000 minutes to 1440 (nearest snap point)', async () => {
    await setup();
    component['onDurationChange'](2000);
    expect(store.setDurationMinutes).toHaveBeenCalledWith(1440);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/rental-duration-control.component.spec**"
```
