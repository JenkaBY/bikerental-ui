# Task 005: Component Unit Tests

> **Applied Skill:** `angular-testing` — Vitest with `vi.fn()`, `TestBed.configureTestingModule`,
> `TestBed.overrideComponent` for component-level providers, `componentRef.setInput()` for signal
> inputs, `TestBed.flushEffects()` for effect-driven side effects.

## 1. Objective

Write unit tests for `RentalDashboardComponent` (Scenarios 1–4 from `fr.md`) and
`RentalActiveTabComponent` (Scenario 3 subtitle row). Cover all BDD acceptance criteria.

**Depends on:** Task 002, Task 003.

## 2. Files to Modify / Create

| File                                                                      | Action          |
|---------------------------------------------------------------------------|-----------------|
| `projects/operator/src/app/dashboard/rental-dashboard.component.spec.ts`  | Create New File |
| `projects/operator/src/app/dashboard/rental-active-tab.component.spec.ts` | Create New File |

---

## 3. Code Implementation

### 3.1 — `rental-dashboard.component.spec.ts`

**Imports Required:**

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { RentalListItem } from '@bikerental/shared';
import { RentalListStore } from '@bikerental/shared';
import { RentalDashboardComponent } from './rental-dashboard.component';
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
import { RentalDashboardComponent } from './rental-dashboard.component';

const makeStore = () => ({
  activeRentals: signal<RentalListItem[]>([]),
  historyRentals: signal<RentalListItem[]>([]),
  isLoadingActive: signal(false),
  isLoadingHistory: signal(false),
  loadActive: vi.fn(),
  loadHistory: vi.fn(),
});

describe('RentalDashboardComponent', () => {
  let fixture: ComponentFixture<RentalDashboardComponent>;
  let component: RentalDashboardComponent;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [RentalDashboardComponent],
      providers: [provideRouter([])],
    })
      .overrideComponent(RentalDashboardComponent, {
        set: { providers: [{ provide: RentalListStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalDashboardComponent);
    component = fixture.componentInstance;
  });

  // Scenario 1: Default tab is Active on first visit
  it('activeTab defaults to "active" when no tab input is set', () => {
    fixture.detectChanges();

    expect(component.activeTab()).toBe('active');
  });

  it('renders RentalActiveTabComponent in the DOM when tab is active', () => {
    fixture.detectChanges();

    const activeTab = fixture.nativeElement.querySelector('app-rental-active-tab');
    expect(activeTab).toBeTruthy();
  });

  // Scenario 2: Tab switch updates the URL (verified via activeTab signal)
  it('activeTab returns "history" when tab input is set to "history"', () => {
    fixture.componentRef.setInput('tab', 'history');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('history');
  });

  it('removes RentalActiveTabComponent from DOM when history tab is active', () => {
    fixture.componentRef.setInput('tab', 'history');
    fixture.detectChanges();

    const activeTab = fixture.nativeElement.querySelector('app-rental-active-tab');
    expect(activeTab).toBeNull();
  });

  // Scenario 4: Direct URL navigation to history tab triggers loadHistory
  it('calls store.loadHistory when tab becomes "history" and historyRentals is empty', () => {
    fixture.detectChanges();

    fixture.componentRef.setInput('tab', 'history');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(store.loadHistory).toHaveBeenCalledOnce();
    const [dateFrom, dateTo] = (store.loadHistory as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateFrom).toBe(dateTo);
  });

  it('does NOT call store.loadHistory again when historyRentals already has items', () => {
    store.historyRentals.set([{ id: 1 } as RentalListItem]);
    fixture.componentRef.setInput('tab', 'history');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(store.loadHistory).not.toHaveBeenCalled();
  });

  it('isLoading() reflects isLoadingActive when active tab is selected', () => {
    fixture.detectChanges();
    store.isLoadingActive.set(true);

    expect(component.isLoading()).toBe(true);
  });

  it('isLoading() reflects isLoadingHistory when history tab is selected', () => {
    fixture.componentRef.setInput('tab', 'history');
    fixture.detectChanges();
    store.isLoadingHistory.set(true);

    expect(component.isLoading()).toBe(true);
  });

  it('calls store.loadActive() when onRefresh is called on the active tab', () => {
    fixture.detectChanges();

    (component as unknown as { onRefresh(): void }).onRefresh();

    expect(store.loadActive).toHaveBeenCalledOnce();
  });

  it('calls store.loadHistory() when onRefresh is called on the history tab', () => {
    fixture.componentRef.setInput('tab', 'history');
    fixture.detectChanges();
    TestBed.flushEffects();
    (store.loadHistory as ReturnType<typeof vi.fn>).mockClear();

    (component as unknown as { onRefresh(): void }).onRefresh();

    expect(store.loadHistory).toHaveBeenCalledOnce();
  });
});
```

---

### 3.2 — `rental-active-tab.component.spec.ts`

**Imports Required:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import type { RentalListItem } from '@bikerental/shared';
import { RentalActiveTabComponent } from './rental-active-tab.component';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import type { RentalListItem } from '@bikerental/shared';
import { RentalActiveTabComponent } from './rental-active-tab.component';

const makeRentalItem = (id: number): RentalListItem =>
  ({
    id,
    status: 'ACTIVE',
    customerPhone: '+375291234567',
    startedAt: new Date(),
    equipmentNames: [],
    isActive: true,
    isDebt: false,
    isOverdue: false,
  }) as RentalListItem;

describe('RentalActiveTabComponent', () => {
  let fixture: ComponentFixture<RentalActiveTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentalActiveTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalActiveTabComponent);
  });

  // Scenario 3: Subtitle row reflects active rental count
  it('displays the count of active rentals in the subtitle row', () => {
    const items = [makeRentalItem(1), makeRentalItem(2), makeRentalItem(3)];
    fixture.componentRef.setInput('activeRentals', items);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('3');
  });

  it('shows 0 when activeRentals is empty', () => {
    fixture.componentRef.setInput('activeRentals', []);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('0');
  });

  it('updates the count when activeRentals input changes', () => {
    fixture.componentRef.setInput('activeRentals', [makeRentalItem(1)]);
    fixture.detectChanges();

    fixture.componentRef.setInput('activeRentals', [makeRentalItem(1), makeRentalItem(2)]);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('2');
  });
});
```

---

## 4. Validation Steps

```bash
ng test operator --watch=false
```

Expected: all tests in `rental-dashboard.component.spec.ts` and
`rental-active-tab.component.spec.ts` pass. Zero failures.
