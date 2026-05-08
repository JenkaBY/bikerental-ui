# Task 008: Update `operator-layout.component.spec.ts` to Verify New Route

> **Applied Skill:** `angular-testing` — Adding a regression test to the existing layout spec prevents the `rentals/new` route from being accidentally reverted. The test reads the `href` attribute of the "New Rental" anchor element rendered by `BottomNavItemComponent`.

## 1. Objective

Add one regression test to the existing `OperatorLayoutComponent` spec that asserts the "New Rental" bottom-nav anchor's `href` attribute contains `rentals/new` (plural), confirming Task 003's change is wired correctly to the rendered DOM.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/layout/operator-layout.component.spec.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — the file already imports `ComponentFixture`, `TestBed`, `provideRouter`, `OperatorLayoutComponent`, `APP_BRAND`, and `BRAND`.

**Code to Add/Replace:**

* **Location:** Inside the `describe('OperatorLayoutComponent', ...)` block, after the last existing `it(...)` test (the one asserting `'host element should have h-screen class'`), insert the new test immediately before the closing `});` of the `describe` block.
* **Snippet:**

```typescript
  it('should have the "New Rental" bottom nav link pointing to rentals/new', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    const newRentalLink = Array.from(links).find((a) => a.textContent?.includes('New Rental'));
    expect(newRentalLink).toBeTruthy();
    expect(newRentalLink!.getAttribute('href')).toContain('rentals/new');
  });
```

The full updated spec file after this addition must have the following structure (existing tests left unchanged; only the new `it` block is appended):

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OperatorLayoutComponent } from './operator-layout.component';
import { APP_BRAND, BRAND } from '@bikerental/shared';

describe('OperatorLayoutComponent', () => {
  let fixture: ComponentFixture<OperatorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorLayoutComponent],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => { /* existing */ });
  it('should render the toolbar', () => { /* existing */ });
  it('should render the bottom nav', () => { /* existing */ });
  it('should render a main content area', () => { /* existing */ });
  it('should render exactly 3 bottom nav items', () => { /* existing */ });
  it('should render the health indicator in the toolbar', () => { /* existing */ });
  it('should render the logout button in the toolbar', () => { /* existing */ });
  it('toolbar should not have a sidebar toggle button', () => { /* existing */ });
  it('host element should have h-screen class', () => { /* existing */ });

  it('should have the "New Rental" bottom nav link pointing to rentals/new', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    const newRentalLink = Array.from(links).find((a) => a.textContent?.includes('New Rental'));
    expect(newRentalLink).toBeTruthy();
    expect(newRentalLink!.getAttribute('href')).toContain('rentals/new');
  });
});
```

> **Note:** Replace the `/* existing */` comments with the actual existing test bodies — do NOT delete or alter any existing `it(...)` blocks; only insert the new one at the end.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng test operator --include="**/layout/operator-layout**"
```
