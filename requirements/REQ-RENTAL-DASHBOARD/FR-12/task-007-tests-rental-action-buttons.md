# Task 007: Write Unit Tests for `RentalActionButtonsComponent`

> **Applied Skill:** `angular-testing` — Uses Vitest + Angular TestBed; stubs `RentalStore`, `MatDialog`, `MatSnackBar`, `Router`, `MatBottomSheet` as value providers; uses `fixture.componentRef.setInput()` for signal inputs; uses `provideNoopAnimations()`.

## 1. Objective

Cover the acceptance criteria from `fr.md`:

- **AC-1:** Return button is disabled when `selectedEquipmentCount === 0`
- **AC-2:** Return button label includes the item count
- **AC-3:** ~~Return button disabled when special-price mode is active but `specialPrice === null`~~ — removed (pricing not sent to return endpoint)
- **AC-5:** Successful return navigates to `/rentals` and shows success snackbar
- **AC-6:** "Cancel rental" opens confirmation dialog, and confirmed cancel navigates to `/rentals`
- **AC-7:** Cancelled cancel (dialog dismissed) does NOT call `store.cancelRental()`
- **AC-8:** Debt rental shows only the Broken button

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-action-buttons.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file — paste the complete content below.

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal, computed } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import { RentalActionButtonsComponent } from './rental-action-buttons.component';

function makeStore(overrides: Partial<{
  isActive: boolean;
  isDebt: boolean;
  isReturning: boolean;
  isSaving: boolean;
  selectedEquipmentCount: number;
  specialPriceEnabled: boolean;
  specialPrice: number | null;
  rentalEquipmentItems: unknown[];
  brokenEquipmentEntries: unknown[];
}> = {}) {
  const opts = {
    isActive: true,
    isDebt: false,
    isReturning: false,
    isSaving: false,
    selectedEquipmentCount: 2,
    specialPriceEnabled: false,
    specialPrice: null,
    rentalEquipmentItems: [],
    brokenEquipmentEntries: [],
    ...overrides,
  };
  return {
    isActive: signal(opts.isActive),
    isDebt: signal(opts.isDebt),
    isReturning: signal(opts.isReturning),
    isSaving: signal(opts.isSaving),
    selectedEquipmentCount: signal(opts.selectedEquipmentCount),
    specialPriceEnabled: signal(opts.specialPriceEnabled),
    specialPrice: signal(opts.specialPrice),
    rentalEquipmentItems: signal(opts.rentalEquipmentItems),
    brokenEquipmentEntries: signal(opts.brokenEquipmentEntries),
    returnEquipment: vi.fn(() => of(undefined as void)),
    cancelRental: vi.fn(() => of(undefined as void)),
  };
}

function makeDialog(closeValue: boolean | undefined = undefined) {
  const dialogRef = { afterClosed: vi.fn(() => of(closeValue)) };
  return { open: vi.fn(() => dialogRef), _ref: dialogRef };
}

describe('RentalActionButtonsComponent', () => {
  let store: ReturnType<typeof makeStore>;
  let dialog: ReturnType<typeof makeDialog>;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let bottomSheet: { open: ReturnType<typeof vi.fn> };

  async function setup(storeOverrides: Parameters<typeof makeStore>[0] = {}) {
    store = makeStore(storeOverrides);
    dialog = makeDialog();
    snackBar = { open: vi.fn() };
    routerSpy = { navigate: vi.fn(() => Promise.resolve(true)) };
    bottomSheet = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RentalActionButtonsComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: RentalStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Router, useValue: routerSpy },
        { provide: MatBottomSheet, useValue: bottomSheet },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RentalActionButtonsComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('AC-1: return button is disabled when selectedEquipmentCount is 0', async () => {
    const fixture = await setup({ selectedEquipmentCount: 0 });
    const returnBtn = fixture.nativeElement.querySelector('button[mat-flat-button][color="primary"]');
    expect(returnBtn?.disabled).toBe(true);
  });

  it('AC-2: return button label shows the item count', async () => {
    const fixture = await setup({ selectedEquipmentCount: 3 });
    const returnBtn = fixture.nativeElement.querySelector('button[mat-flat-button][color="primary"]');
    expect(returnBtn?.textContent).toContain('3');
  });

  it('AC-5: successful return navigates to /rentals and shows success snackbar', async () => {
    store.returnEquipment = vi.fn(() => of(undefined as void));
    const fixture = await setup();
    const returnBtn = fixture.nativeElement.querySelector('button[mat-flat-button][color="primary"]');
    returnBtn.click();
    fixture.detectChanges();

    expect(store.returnEquipment).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('returned'),
      undefined,
      expect.objectContaining({ duration: 3000 }),
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/rentals']);
  });

  it('return failure shows error snackbar and does not navigate', async () => {
    store.returnEquipment = vi.fn(() => throwError(() => new Error('network')));
    const fixture = await setup();
    const returnBtn = fixture.nativeElement.querySelector('button[mat-flat-button][color="primary"]');
    returnBtn.click();
    fixture.detectChanges();

    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      expect.anything(),
      expect.objectContaining({ duration: 5000 }),
    );
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('AC-6: cancel button opens confirmation dialog; on confirm calls cancelRental and navigates', async () => {
    dialog = makeDialog(true);
    store = makeStore();
    snackBar = { open: vi.fn() };
    routerSpy = { navigate: vi.fn(() => Promise.resolve(true)) };
    bottomSheet = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RentalActionButtonsComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: RentalStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Router, useValue: routerSpy },
        { provide: MatBottomSheet, useValue: bottomSheet },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RentalActionButtonsComponent);
    fixture.detectChanges();

    const cancelBtn = (fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)[2];
    cancelBtn.click();
    fixture.detectChanges();

    expect(dialog.open).toHaveBeenCalled();
    expect(store.cancelRental).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/rentals']);
  });

  it('AC-7: dismissing cancel dialog does NOT call cancelRental', async () => {
    dialog = makeDialog(false);
    store = makeStore();
    snackBar = { open: vi.fn() };
    routerSpy = { navigate: vi.fn() };
    bottomSheet = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RentalActionButtonsComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: RentalStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Router, useValue: routerSpy },
        { provide: MatBottomSheet, useValue: bottomSheet },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RentalActionButtonsComponent);
    fixture.detectChanges();

    const cancelBtn = (fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)[2];
    cancelBtn.click();
    fixture.detectChanges();

    expect(dialog.open).toHaveBeenCalled();
    expect(store.cancelRental).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('AC-8: debt rental shows only the broken button', async () => {
    const fixture = await setup({ isActive: false, isDebt: true });
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain('Broken');
  });
});
```

> **Note on button selectors:** The CSS attribute selectors `button[mat-flat-button][color="primary"]` target the exact Angular Material directive attributes. For the cancel button, `querySelectorAll('button')[2]` (index 2 = third button) is the simplest selector given the active-layout order: Return (index 0), Broken (index 1), Cancel (index 2).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npm test -- --reporter=verbose rental-action-buttons
```
