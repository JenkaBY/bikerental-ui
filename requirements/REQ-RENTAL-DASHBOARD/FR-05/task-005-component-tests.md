# Task 005: Component Tests — RentalCardComponent History Variant + RentalHistoryCardListComponent Sort

> **Applied Skill:** `angular-testing` — Vitest + TestBed, `componentRef.setInput()`, signal
> mocks via `useValue`, `OnPush` fixture, `provideRouter([])`.

## 1. Objective

1. **Extend** `rental-card.component.spec.ts` (created in FR-04) with history variant scenarios:
   debt warning treatment, completion time row, `isWarning` computed.
2. **Create** `rental-history-card-list.component.spec.ts` covering the `sortedHistoryRentals`
   sort logic inside `RentalHistoryCardListComponent`.

**Depends on:** Tasks 001–004.

## 2. Files to Modify / Create

### File A

* **File Path:** `projects/operator/src/app/dashboard/rental-card.component.spec.ts`
* **Action:** Modify Existing File (append a new `describe` block)

### File B

* **File Path:** `projects/operator/src/app/dashboard/rental-history-card-list.component.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### 3.1 — Append to `rental-card.component.spec.ts`

**Location:** Append after the closing `});` of the existing `describe('RentalCardComponent', ...)` block.

```typescript
describe('RentalCardComponent — history variant', () => {
  let fixture: ComponentFixture<RentalCardComponent>;

  const makeHistoryItem = (overrides: Partial<RentalListItem> = {}): RentalListItem => ({
    id: 99,
    status: 'COMPLETED',
    customerPhone: '+375291234567',
    startedAt: new Date(),
    equipmentNames: ['Trek FX3'],
    expectedReturnAt: new Date('2026-05-14T14:30:00'),
    isActive: false,
    isDebt: false,
    isOverdue: false,
  } as RentalListItem,
...
  overrides
)
  as
  RentalListItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalCardComponent);
    fixture.componentRef.setInput('variant', 'history');
  });

  // Scenario 4: Completed card shows completion time
  it('renders "Ended HH:mm" in default color for a completed card', () => {
    fixture.componentRef.setInput('item', makeHistoryItem());
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Ended');
    expect(text).toContain('14:30');
  });

  it('does not render the active time row for history variant', () => {
    fixture.componentRef.setInput('item', makeHistoryItem());
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toMatch(/remaining|overdue/i);
  });

  // Scenario 3: Debt card has warning visual treatment
  it('applies warning host classes and shows debt label for a debt card', () => {
    fixture.componentRef.setInput(
      'item',
      makeHistoryItem({ status: 'DEBT', isDebt: true }),
    );
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent as string;

    expect(host.className).toContain('bg-amber-50');
    expect(host.className).toContain('border-l-amber-400');
    expect(text).toContain('Debt');
  });

  it('isWarning is true when isDebt is true', () => {
    fixture.componentRef.setInput(
      'item',
      makeHistoryItem({ isDebt: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.isWarning()).toBe(true);
  });

  it('isWarning is false for a normal completed card', () => {
    fixture.componentRef.setInput('item', makeHistoryItem());
    fixture.detectChanges();

    expect(fixture.componentInstance.isWarning()).toBe(false);
  });
});
```

> **Note:** The `makeHistoryItem` factory uses object spread via a cast — ensure TypeScript accepts
> it; adjust to `{ ...BASE_HISTORY_ITEM, ...overrides }` if needed for strict-mode compatibility.

---

### 3.2 — Create `rental-history-card-list.component.spec.ts`

**Full file content:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { RentalListItem } from '@bikerental/shared';
import { RentalListStore } from '@bikerental/shared';
import { RentalHistoryCardListComponent } from './rental-history-card-list.component';

const makeItem = (id: number, startedAt: Date, status = 'COMPLETED'): RentalListItem =>
  ({
    id,
    status,
    customerPhone: `+3752900000${id}`,
    startedAt,
    equipmentNames: [],
    isActive: false,
    isDebt: status === 'DEBT',
    isOverdue: false,
  }) as RentalListItem;

const makeStore = () => ({
  historyRentals: signal<RentalListItem[]>([]),
  isLoadingHistory: signal(false),
  activeRentals: signal<RentalListItem[]>([]),
  isLoadingActive: signal(false),
  loadActive: vi.fn(),
  loadHistory: vi.fn(),
});

describe('RentalHistoryCardListComponent — sortedHistoryRentals', () => {
  let fixture: ComponentFixture<RentalHistoryCardListComponent>;
  let component: RentalHistoryCardListComponent;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [RentalHistoryCardListComponent],
      providers: [
        { provide: RentalListStore, useValue: store },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalHistoryCardListComponent);
    component = fixture.componentInstance;
  });

  it('sorts history rentals descending by startedAt (most recent first)', () => {
    const early = makeItem(1, new Date('2026-05-14T10:00:00'));
    const middle = makeItem(2, new Date('2026-05-14T12:00:00'));
    const recent = makeItem(3, new Date('2026-05-14T14:00:00'));

    store.historyRentals.set([early, recent, middle]);
    fixture.detectChanges();

    const sorted = component.sortedHistoryRentals();

    expect(sorted[0].id).toBe(3);
    expect(sorted[1].id).toBe(2);
    expect(sorted[2].id).toBe(1);
  });

  it('does not mutate the original historyRentals array', () => {
    const items = [
      makeItem(1, new Date('2026-05-14T10:00:00')),
      makeItem(2, new Date('2026-05-14T14:00:00')),
    ];
    const originalOrder = items.map((i) => i.id);

    store.historyRentals.set(items);
    fixture.detectChanges();
    component.sortedHistoryRentals();

    expect(items.map((i) => i.id)).toEqual(originalOrder);
  });

  it('returns an empty array when historyRentals is empty', () => {
    store.historyRentals.set([]);
    fixture.detectChanges();

    expect(component.sortedHistoryRentals()).toHaveLength(0);
  });
});
```

---

## 4. Validation Steps

```powershell
npm test -- --reporter=verbose rental-card.component.spec.ts rental-history-card-list.component.spec.ts
```
