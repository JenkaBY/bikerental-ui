import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Labels, RentalStore } from '@bikerental/shared';
import { RentalCostFooterComponent } from './rental-cost-footer.component';

interface Money {
  amount: number;
  currency: string;
}

function makeStore(
  overrides: {
    costEstimate?: Money | null;
    projectedBalance?: Money | null;
    isBalanceSufficient?: boolean;
    canProceedFromStep2?: boolean;
    isSaving?: boolean;
  } = {},
) {
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

  async function setup(
    storeOverrides: {
      costEstimate?: Money | null;
      projectedBalance?: Money | null;
      isBalanceSufficient?: boolean;
      canProceedFromStep2?: boolean;
      isSaving?: boolean;
    } = {},
  ) {
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

  it('should show a spinner when cost estimate is null', async () => {
    await setup({ costEstimate: null });
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
  });

  it('should display projected balance', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('380');
  });

  it('should show insufficient-balance warning when balance is not sufficient', async () => {
    await setup({ isBalanceSufficient: false, projectedBalance: { amount: -50, currency: 'BYN' } });
    expect(fixture.nativeElement.textContent).toContain(Labels.InsufficientBalance);
  });

  it('should NOT show insufficient-balance warning when balance is sufficient', async () => {
    await setup({ isBalanceSufficient: true });
    expect(fixture.nativeElement.textContent).not.toContain(Labels.InsufficientBalance);
  });

  it('should disable the Next button when canProceedFromStep2 is false', async () => {
    await setup({ canProceedFromStep2: false });
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const nextButton = buttons.find((button) => button.textContent?.includes(Labels.Next));

    expect(nextButton?.disabled).toBe(true);
  });

  it('should emit nextRequested when Next button is clicked', async () => {
    await setup({ canProceedFromStep2: true });
    const emitted: void[] = [];
    component.nextRequested.subscribe(() => emitted.push());

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const nextButton = buttons.find((button) => button.textContent?.includes(Labels.Next));
    nextButton?.click();

    expect(emitted.length).toBe(1);
  });

  it('should emit saveDraftRequested when Save Draft button is clicked', async () => {
    await setup();
    const emitted: void[] = [];
    component.saveDraftRequested.subscribe(() => emitted.push());

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const saveDraftButton = buttons.find((button) =>
      button.textContent?.includes(Labels.SaveDraft),
    );
    saveDraftButton?.click();

    expect(emitted.length).toBe(1);
  });
});
