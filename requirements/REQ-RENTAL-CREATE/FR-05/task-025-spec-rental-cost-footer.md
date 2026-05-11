# Task 025: Spec for `RentalCostFooterComponent`

> **Applied Skill:** `angular-testing` — Smart component. Override `RentalStore` via `overrideComponent`. Verify: cost displayed; spinner shown when null; insufficient-balance warning visible; "Next" disabled when `canProceedFromStep2=false`; `nextRequested` and `saveDraftRequested` outputs fire on button click.

## 1. Objective

Unit tests for `RentalCostFooterComponent`: cost rendering, balance warning, button disabled state, output emissions.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-cost-footer.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RentalStore } from '@bikerental/shared';
import { RentalCostFooterComponent } from './rental-cost-footer.component';

function makeStore(overrides: {
  costEstimate?: { amount: number; currency: string } | null;
  projectedBalance?: { amount: number; currency: string } | null;
  isBalanceSufficient?: boolean;
  canProceedFromStep2?: boolean;
  isSaving?: boolean;
} = {}) {
  return {
    costEstimate: signal(overrides.costEstimate ?? { amount: 120, currency: 'BYN' }),
    projectedBalance: signal(overrides.projectedBalance ?? { amount: 380, currency: 'BYN' }),
    isBalanceSufficient: signal(overrides.isBalanceSufficient ?? true),
    canProceedFromStep2: signal(overrides.canProceedFromStep2 ?? true),
    isSaving: signal(overrides.isSaving ?? false),
  };
}

describe('RentalCostFooterComponent', () => {
  let fixture: ComponentFixture<RentalCostFooterComponent>;
  let component: RentalCostFooterComponent;

  async function setup(storeOverrides = {}) {
    const store = makeStore(storeOverrides);

    await TestBed.configureTestingModule({
      imports: [RentalCostFooterComponent],
      providers: [provideAnimationsAsync()],
    })
      .overrideComponent(RentalCostFooterComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalCostFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should display cost estimate amount', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('120');
  });

  it('should display projected balance', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('380');
  });

  it('should show insufficient-balance warning when balance is not sufficient', async () => {
    await setup({ isBalanceSufficient: false, projectedBalance: { amount: -50, currency: 'BYN' } });
    expect(fixture.nativeElement.textContent).toContain('Insufficient');
  });

  it('should NOT show insufficient-balance warning when balance is sufficient', async () => {
    await setup({ isBalanceSufficient: true });
    expect(fixture.nativeElement.textContent).not.toContain('Insufficient');
  });

  it('should disable the Next button when canProceedFromStep2 is false', async () => {
    await setup({ canProceedFromStep2: false });
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const nextBtn = buttons.find((b) => b.textContent?.includes('Next'));
    expect(nextBtn?.disabled).toBe(true);
  });

  it('should emit nextRequested when Next button is clicked', async () => {
    await setup({ canProceedFromStep2: true });
    const emitted: void[] = [];
    component.nextRequested.subscribe(() => emitted.push());

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const nextBtn = buttons.find((b) => b.textContent?.includes('Next'));
    nextBtn?.click();

    expect(emitted.length).toBe(1);
  });

  it('should emit saveDraftRequested when Save Draft button is clicked', async () => {
    await setup();
    const emitted: void[] = [];
    component.saveDraftRequested.subscribe(() => emitted.push());

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const saveBtn = buttons.find((b) => b.textContent?.includes('Draft'));
    saveBtn?.click();

    expect(emitted.length).toBe(1);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/rental-cost-footer.component.spec**"
```
