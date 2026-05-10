# Task 008: Spec for `RentalActivateButtonComponent`

> **Applied Skill:** `angular-testing` — Dumb component. No store. Tests use `componentRef.setInput()` to drive `disabled` and `loading` inputs; assert `activateRequested` output emits on click.

## 1. Objective

Unit tests for `RentalActivateButtonComponent`: button enabled when not disabled/loading; button disabled when `disabled=true` or `loading=true`; spinner shown when `loading=true`; `activateRequested` emitted on click; not emitted when disabled.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-activate-button.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RentalActivateButtonComponent } from './rental-activate-button.component';

describe('RentalActivateButtonComponent', () => {
  let fixture: ComponentFixture<RentalActivateButtonComponent>;
  let component: RentalActivateButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalActivateButtonComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalActivateButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enable the button by default', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should disable the button when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should disable the button when loading input is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should show spinner when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).not.toBeNull();
  });

  it('should not show spinner when loading is false', () => {
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeNull();
  });

  it('should emit activateRequested when button is clicked', () => {
    let emitted = false;
    component.activateRequested.subscribe(() => (emitted = true));
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(emitted).toBe(true);
  });

  it('should not emit activateRequested when button is disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    let emitted = false;
    component.activateRequested.subscribe(() => (emitted = true));
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(emitted).toBe(false);
  });
});
```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step3/rental-activate-button.component.spec**"
```
