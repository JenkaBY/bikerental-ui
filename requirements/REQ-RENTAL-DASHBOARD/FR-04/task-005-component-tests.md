# Task 005: Component Tests — RentalCardComponent and RentalActiveTabComponent

> **Applied Skill:** `angular-testing` — Vitest + TestBed, `componentRef.setInput()`, signal
> mocks, `OnPush` fixture, `provideRouter([])` for navigation stubs.

## 1. Objective

Write unit tests covering `RentalCardComponent` (scenarios 1–7) and `RentalActiveTabComponent`
sort logic (scenario 1). Tests live alongside their respective source files.

**Depends on:** Tasks 001–004 (all components exist).

## 2. Files to Modify / Create

### File A

* **File Path:** `projects/operator/src/app/dashboard/rental-card.component.spec.ts`
* **Action:** Create New File

### File B

* **File Path:** `projects/operator/src/app/dashboard/rental-active-tab.component.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### 3.1 — `rental-card.component.spec.ts`

**Full file content:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import type { RentalListItem } from '@bikerental/shared';
import { RentalCardComponent } from './rental-card.component';

const BASE_ITEM: RentalListItem = {
  id: 42,
  status: 'ACTIVE',
  customerPhone: '+375291234567',
  customerName: 'Ivan Petrov',
  startedAt: new Date(),
  equipmentNames: ['Trek FX3', 'Helmet S'],
  expectedReturnAt: new Date(Date.now() + 45 * 60_000),
  isActive: true,
  isDebt: false,
  isOverdue: false,
  overdueMinutes: undefined,
};

const makeItem = (overrides: Partial<RentalListItem> = {}): RentalListItem => ({
  ...BASE_ITEM,
  ...overrides,
});

describe('RentalCardComponent', () => {
  let fixture: ComponentFixture<RentalCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalCardComponent);
    fixture.componentRef.setInput('item', BASE_ITEM);
    fixture.detectChanges();
  });

  // Scenario 4: Card first row shows phone and name
  it('displays customerPhone in bold and customerName in parentheses', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('+375291234567');
    expect(text).toContain('(Ivan Petrov)');
  });

  // Scenario 5: Card first row omits name when absent
  it('omits customer name when customerName is undefined', () => {
    fixture.componentRef.setInput('item', makeItem({ customerName: undefined }));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('+375291234567');
    expect(text).not.toContain('(');
  });

  // Scenario 6: Equipment pills display item names
  it('renders one pill per equipment name', () => {
    const pills = fixture.nativeElement.querySelectorAll('span.rounded.text-xs');

    expect(pills).toHaveLength(2);
    expect((pills[0] as HTMLElement).textContent?.trim()).toBe('Trek FX3');
    expect((pills[1] as HTMLElement).textContent?.trim()).toBe('Helmet S');
  });

  // Scenario 3: Non-overdue card shows remaining time
  it('shows remaining time text for a non-overdue card in active variant', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toMatch(/\d+\s*min\s*remaining/i);
  });

  // Scenario 2: Overdue card has distinct visual treatment
  it('applies overdue background and shows overdue duration for isOverdue cards', () => {
    fixture.componentRef.setInput(
      'item',
      makeItem({ isOverdue: true, overdueMinutes: 20, expectedReturnAt: undefined }),
    );
    fixture.detectChanges();

    const cardDiv = fixture.nativeElement.querySelector('div') as HTMLElement;
    const text = fixture.nativeElement.textContent as string;

    expect(cardDiv.className).toContain('bg-amber-50');
    expect(cardDiv.className).toContain('border-l-amber-400');
    expect(text).toContain('20');
  });

  // Scenario 2: Overdue card does NOT show remaining time row
  it('does not show "remaining" text for an overdue card', () => {
    fixture.componentRef.setInput(
      'item',
      makeItem({ isOverdue: true, overdueMinutes: 20 }),
    );
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toMatch(/remaining/i);
  });

  // Variant: history — row 2 is suppressed
  it('does not render the time row when variant is "history"', () => {
    fixture.componentRef.setInput('variant', 'history');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toMatch(/remaining|overdue/i);
  });

  // Scenario 4: Status badge shows "Active" label
  it('renders "Active" status badge for ACTIVE status', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Active');
  });
});
```

---

### 3.2 — `rental-active-tab.component.spec.ts`

**Full file content:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import type { RentalListItem } from '@bikerental/shared';
import { RentalActiveTabComponent } from './rental-active-tab.component';

const makeItem = (
  id: number,
  isOverdue: boolean,
  expectedReturnAt?: Date,
): RentalListItem =>
  ({
    id,
    status: 'ACTIVE',
    customerPhone: `+3752900000${id}`,
    startedAt: new Date(),
    equipmentNames: [],
    isActive: true,
    isDebt: false,
    isOverdue,
    overdueMinutes: isOverdue ? 10 : undefined,
    expectedReturnAt,
  }) as RentalListItem;

describe('RentalActiveTabComponent — sortedActiveRentals', () => {
  let fixture: ComponentFixture<RentalActiveTabComponent>;
  let component: RentalActiveTabComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalActiveTabComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalActiveTabComponent);
    component = fixture.componentInstance;
  });

  // Scenario 1: Overdue rentals appear first
  it('places overdue items before non-overdue items', () => {
    const now = Date.now();
    const overdueItem = makeItem(1, true);
    const due30 = makeItem(2, false, new Date(now + 30 * 60_000));
    const due60 = makeItem(3, false, new Date(now + 60 * 60_000));

    fixture.componentRef.setInput('activeRentals', [due30, due60, overdueItem]);
    fixture.detectChanges();

    const sorted = component.sortedActiveRentals();

    expect(sorted[0].id).toBe(1);
    expect(sorted[1].id).toBe(2);
    expect(sorted[2].id).toBe(3);
  });

  it('sorts non-overdue items ascending by expectedReturnAt', () => {
    const now = Date.now();
    const due60 = makeItem(3, false, new Date(now + 60 * 60_000));
    const due30 = makeItem(2, false, new Date(now + 30 * 60_000));
    const due120 = makeItem(4, false, new Date(now + 120 * 60_000));

    fixture.componentRef.setInput('activeRentals', [due60, due120, due30]);
    fixture.detectChanges();

    const sorted = component.sortedActiveRentals();

    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(4);
  });

  it('places items without expectedReturnAt at the end of the non-overdue group', () => {
    const now = Date.now();
    const noReturn = makeItem(5, false, undefined);
    const due30 = makeItem(2, false, new Date(now + 30 * 60_000));

    fixture.componentRef.setInput('activeRentals', [noReturn, due30]);
    fixture.detectChanges();

    const sorted = component.sortedActiveRentals();

    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(5);
  });

  it('does not mutate the original activeRentals input array', () => {
    const now = Date.now();
    const items = [
      makeItem(3, false, new Date(now + 60 * 60_000)),
      makeItem(1, true),
      makeItem(2, false, new Date(now + 30 * 60_000)),
    ];
    const originalOrder = items.map((i) => i.id);

    fixture.componentRef.setInput('activeRentals', items);
    fixture.detectChanges();
    component.sortedActiveRentals();

    expect(items.map((i) => i.id)).toEqual(originalOrder);
  });
});
```

---

## 4. Validation Steps

```powershell
npm test -- --reporter=verbose rental-card.component.spec.ts rental-active-tab.component.spec.ts
```
