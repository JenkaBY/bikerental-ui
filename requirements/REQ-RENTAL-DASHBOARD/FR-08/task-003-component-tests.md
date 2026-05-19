# Task 003: Component Tests — `RentalPeriodSectionComponent`

> **Applied Skill:** `angular-testing` — Vitest + TestBed, mocking a store dependency via
> `TestBed` providers with signal values, `OnPush` change detection patterns.

## 1. Objective

Create a spec file for `RentalPeriodSectionComponent` that covers all four BDD scenarios from
FR-08:

- **Scenario 1:** Non-overdue row renders start, expected return, and duration correctly.
- **Scenario 2:** Expected return datetime receives `text-amber-700` class when `isOverdue` is
  `true`.
- **Scenario 3:** Row shows `—` in place of expected return datetime when `expectedReturnAt` is
  `undefined`.
- **Scenario 4:** Sub-hour paid duration is formatted as minutes only (e.g., `"45 min"`).

**Depends on:** Task 001 (`RentalPeriodSectionComponent` must exist).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-period-section.component.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### Full file content

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { RentalStore } from '@bikerental/shared';
import { RentalPeriodSectionComponent } from './rental-period-section.component';

const START = new Date('2026-05-14T10:00:00');
const RETURN = new Date('2026-05-14T11:30:00');

const makeStore = () => ({
  startedAt: signal<Date | null>(START),
  expectedReturnAt: signal<Date | undefined>(undefined),
  paidDurationMinutes: signal<number | undefined>(undefined),
  isOverdue: signal(false),
});

describe('RentalPeriodSectionComponent', () => {
  let fixture: ComponentFixture<RentalPeriodSectionComponent>;
  let store: ReturnType<typeof makeStore>;

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    store = makeStore();

    await TestBed.configureTestingModule({
      imports: [RentalPeriodSectionComponent],
      providers: [{ provide: RentalStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(RentalPeriodSectionComponent);
    fixture.detectChanges();
  });

  it('renders start datetime, expected return datetime, and duration for a non-overdue rental', () => {
    store.expectedReturnAt.set(RETURN);
    store.paidDurationMinutes.set(90);
    store.isOverdue.set(false);
    fixture.detectChanges();

    const content = text();
    expect(content).toContain('14.05 10:00');
    expect(content).toContain('14.05 11:30');
    expect(content).toContain('1 h 30 min');
  });

  it('does not apply text-amber-700 to expected return when isOverdue is false', () => {
    store.expectedReturnAt.set(RETURN);
    store.paidDurationMinutes.set(90);
    store.isOverdue.set(false);
    fixture.detectChanges();

    const overdueEl = (fixture.nativeElement as HTMLElement).querySelector('.text-amber-700');
    expect(overdueEl).toBeNull();
  });

  it('applies text-amber-700 class to expected return span when isOverdue is true', () => {
    store.expectedReturnAt.set(RETURN);
    store.paidDurationMinutes.set(90);
    store.isOverdue.set(true);
    fixture.detectChanges();

    const overdueEl = (fixture.nativeElement as HTMLElement).querySelector('.text-amber-700');
    expect(overdueEl).not.toBeNull();
    expect(overdueEl?.textContent).toContain('14.05 11:30');
  });

  it('renders an em dash when expectedReturnAt is undefined', () => {
    store.expectedReturnAt.set(undefined);
    store.paidDurationMinutes.set(90);
    fixture.detectChanges();

    expect(text()).toContain('—');
    expect(text()).not.toContain('14.05 11:30');
  });

  it('applies text-amber-700 to the dash span when isOverdue is true and expectedReturnAt is undefined', () => {
    store.expectedReturnAt.set(undefined);
    store.isOverdue.set(true);
    fixture.detectChanges();

    const overdueEl = (fixture.nativeElement as HTMLElement).querySelector('.text-amber-700');
    expect(overdueEl).not.toBeNull();
    expect(overdueEl?.textContent?.trim()).toBe('—');
  });

  it('formats sub-hour paidDurationMinutes as minutes only', () => {
    store.expectedReturnAt.set(RETURN);
    store.paidDurationMinutes.set(45);
    fixture.detectChanges();

    expect(text()).toContain('45 min');
    expect(text()).not.toContain('h');
  });

  it('renders the arrow separator between start and expected return', () => {
    store.expectedReturnAt.set(RETURN);
    fixture.detectChanges();

    expect(text()).toContain('→');
  });

  it('renders the dot separator before the duration', () => {
    store.expectedReturnAt.set(RETURN);
    store.paidDurationMinutes.set(60);
    fixture.detectChanges();

    expect(text()).toContain('·');
  });
});
```

---

**Key implementation notes:**

- `makeStore()` returns plain signals typed to match `RentalStore`'s public surface. Only the
  four fields read by the component need to be present in the mock.
- `{ provide: RentalStore, useValue: store }` in `TestBed` providers satisfies the `inject(RentalStore)`
  call inside the component without instantiating the real store (which has further DI dependencies).
- `store.startedAt.set(...)` mutates the signal directly — `fixture.detectChanges()` then
  propagates the change through `OnPush`.
- The `DatePipe` format `'dd.MM HH:mm'` for `new Date('2026-05-14T10:00:00')` produces
  `"14.05 10:00"` — this is what the test assertions check for.
- The `DurationPipe` for `90` minutes produces `"1 h 30 min"`; for `45` it produces `"45 min"`.
- The arrow `→` and bullet `·` are static characters in the template — tested as text content.
- No `MatDividerModule` or any Material import is needed — this spec tests only the component's
  own template.

---

## 4. Validation Steps

```powershell
npm test -- --project operator --testPathPattern="rental-period-section"
```
