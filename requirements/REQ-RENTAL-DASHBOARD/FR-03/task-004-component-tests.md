# Task 004: Component Unit Tests

> **Applied Skill:** `angular-testing` — Vitest with `vi.fn()`, `TestBed.configureTestingModule`,
> `componentRef.setInput()` for signal inputs. `angular-routing` — `provideRouter([])` to
> satisfy `Router` injection.

## 1. Objective

Write unit tests for `RentalHistoryTabComponent` covering all four BDD scenarios from `fr.md`:
default filter, filter URL update, tab-switch filter preservation (signal-level), and subtitle
count.

**Depends on:** Task 002 (placeholder), Task 003 (implementation).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-history-tab.component.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Imports Required:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { RentalListItem } from '@bikerental/shared';
import { RentalListStore } from '@bikerental/shared';
import { RentalHistoryTabComponent } from './rental-history-tab.component';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { RentalListItem } from '@bikerental/shared';
import { RentalListStore } from '@bikerental/shared';
import { RentalHistoryTabComponent } from './rental-history-tab.component';

const makeRentalItem = (id: number, status: string): RentalListItem =>
  ({
    id,
    status,
    customerPhone: '',
    startedAt: new Date(),
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

describe('RentalHistoryTabComponent', () => {
  let fixture: ComponentFixture<RentalHistoryTabComponent>;
  let component: RentalHistoryTabComponent;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [RentalHistoryTabComponent],
      providers: [
        provideRouter([]),
        { provide: RentalListStore, useValue: store },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalHistoryTabComponent);
    component = fixture.componentInstance;
  });

  // Scenario 1: "All" filter is selected by default
  it('activeFilter defaults to "ALL" when no filter input is set', () => {
    fixture.detectChanges();

    expect(component.activeFilter()).toBe('ALL');
  });

  it('calls store.loadHistory with "ALL" on initial render', () => {
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(store.loadHistory).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      'ALL',
    );
  });

  // Scenario 2: Selecting a filter triggers a server-side reload
  it('activeFilter returns "COMPLETED" when filter input is set to "COMPLETED"', () => {
    fixture.componentRef.setInput('filter', 'COMPLETED');
    fixture.detectChanges();

    expect(component.activeFilter()).toBe('COMPLETED');
  });

  it('calls store.loadHistory with the new filter when filter input changes', () => {
    fixture.detectChanges();
    TestBed.flushEffects();
    (store.loadHistory as ReturnType<typeof vi.fn>).mockClear();

    fixture.componentRef.setInput('filter', 'DEBT');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(store.loadHistory).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      'DEBT',
    );
  });

  // Scenario 3: Switching tabs preserves the selected filter (URL input binding)
  it('activeFilter reads "CANCELLED" from the filter input after tab switch and return', () => {
    fixture.componentRef.setInput('filter', 'CANCELLED');
    fixture.detectChanges();

    expect(component.activeFilter()).toBe('CANCELLED');
  });

  // Scenario 4: Subtitle count reflects items returned by the server
  it('totalRecords reflects the length of store.historyRentals', () => {
    store.historyRentals.set([
      makeRentalItem(1, 'DEBT'),
      makeRentalItem(2, 'DEBT'),
      makeRentalItem(3, 'DEBT'),
    ]);
    fixture.detectChanges();

    expect(component.totalRecords()).toBe(3);
  });

  it('falls back to "ALL" for an unrecognised filter value', () => {
    fixture.componentRef.setInput('filter', 'UNKNOWN');
    fixture.detectChanges();

    expect(component.activeFilter()).toBe('ALL');
  });

  it('normalises lowercase filter input to uppercase', () => {
    fixture.componentRef.setInput('filter', 'completed');
    fixture.detectChanges();

    expect(component.activeFilter()).toBe('COMPLETED');
  });
});
```

---

## 4. Validation Steps

skip