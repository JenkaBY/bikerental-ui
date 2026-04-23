# Task 003: Create Gateway Routes and Home Feature Component

> **Applied Skill:** `angular-routing` — gateway routes use `loadComponent` for lazy loading; no `admin` or `operator` route segments.
> **Applied Skill:** `angular-component` — `ChangeDetectionStrategy.OnPush`; no `standalone: true`; signal-based design.

## 1. Objective

Create the gateway-specific `app.routes.ts` and the relocated `HomeComponent`. The gateway is a single-page app — `HomeComponent` is the only page. The routes file contains only the root route and a wildcard redirect.

`HomeComponent` must:

- **Replace** Angular `Router.navigate()` calls with `window.location.href` assignments pointing to root-relative URLs (`/admin/`, `/operator/`)
- **Remove** the `LayoutModeService` dependency (layout mode is an operator concern; gateway has no layout toggle)
- **Import** `DashboardCardComponent` from `@bikerental/shared`

## 2. Files to Create

### File 1

* **File Path:** `projects/gateway/src/app/app.routes.ts`
* **Action:** Create New File

### File 2

* **File Path:** `projects/gateway/src/app/features/home/home.component.ts`
* **Action:** Create New File

### File 3

* **File Path:** `projects/gateway/src/app/features/home/home.component.spec.ts`
* **Action:** Create New File

### File 4

* **File Path:** `projects/gateway/src/app/features/home/home.component.handlers.spec.ts`
* **Action:** Create New File

### File 5

* **File Path:** `projects/gateway/src/app/features/home/home.component.interactions.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### `projects/gateway/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  { path: '**', redirectTo: '' },
];
```

### `projects/gateway/src/app/features/home/home.component.ts`

Key changes from the monolithic version:

- Navigation uses `window.location.href` instead of `Router.navigate()`
- `LayoutModeService` dependency removed
- `DashboardCardComponent` imported from `@bikerental/shared`
- `CommonModule` import removed (use `@for` / `@if` control flow which needs no import)

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardCardComponent } from '@bikerental/shared';

interface DashboardCardDef {
  id: string;
  title: string;
  description: string;
  ariaLabel: string;
  href: string;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardCardComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <header class="mb-6 text-center">
        <h1 class="text-3xl font-semibold">{{ title }}</h1>
        <p class="text-sm text-slate-500 mt-2">{{ subtitle }}</p>
      </header>

      <div class="grid gap-4 grid-cols-1 sm:grid-cols-3">
        @for (card of cards; track card.id) {
          <app-dashboard-card
            [title]="card.title"
            [description]="card.description"
            [ariaLabel]="card.ariaLabel"
            (activate)="onCardSelect(card)"
          ></app-dashboard-card>
        }
      </div>
    </div>
  `,
})
export class HomeComponent {
  protected readonly title = $localize`Bike Rental`;
  protected readonly subtitle = $localize`Choose your dashboard`;

  protected readonly cards: DashboardCardDef[] = [
    {
      id: 'admin',
      title: $localize`Administrator`,
      description: $localize`Manage equipment, tariffs and customers`,
      ariaLabel: $localize`Open administrator dashboard`,
      href: '/admin/',
    },
    {
      id: 'operator-mobile',
      title: $localize`Operator (Mobile)`,
      description: $localize`Mobile-first operator flow`,
      ariaLabel: $localize`Open operator dashboard (mobile)`,
      href: '/operator/',
    },
    {
      id: 'operator-desktop',
      title: $localize`Operator (Desktop)`,
      description: $localize`Desktop layout with sidebar`,
      ariaLabel: $localize`Open operator dashboard (desktop)`,
      href: '/operator/',
    },
  ];

  onCardSelect(card: DashboardCardDef) {
    window.location.href = card.href;
  }
}
```

> **Note on `LayoutModeService`:** The old home component called `this.layout.setMode()` before navigating to `/operator`. Since operator is now a separate SPA, layout mode cannot be set cross-app via a service. This concern belongs to the operator app's own initialisation. The two operator cards both point to `/operator/` — the operator app decides which layout to show on load.

---

### `projects/gateway/src/app/features/home/home.component.spec.ts`

The original test required `Router` and `LayoutModeService` providers. Both are gone from the new component, so no providers are needed.

```typescript
import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();
  });

  it('renders three navigation cards', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const adminBtn = el.querySelector('button[aria-label="Open administrator dashboard"]');
    const opMobile = el.querySelector('button[aria-label="Open operator dashboard (mobile)"]');
    const opDesktop = el.querySelector('button[aria-label="Open operator dashboard (desktop)"]');

    expect(adminBtn).toBeTruthy();
    expect(opMobile).toBeTruthy();
    expect(opDesktop).toBeTruthy();
  });
});
```

---

### `projects/gateway/src/app/features/home/home.component.handlers.spec.ts`

Tests that `onCardSelect` sets `window.location.href`. Uses `Object.defineProperty` to replace `window.location` with a writable mock (required in jsdom).

```typescript
import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent handlers (direct)', () => {
  let locationMock: { href: string };

  beforeEach(() => {
    locationMock = { href: '' };
    Object.defineProperty(window, 'location', { value: locationMock, writable: true });
  });

  it('onCardSelect sets window.location.href to card href', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    const comp = fixture.componentInstance;

    comp.onCardSelect({
      id: 'admin',
      title: 'Admin',
      description: 'd',
      ariaLabel: 'a',
      href: '/admin/',
    });

    expect(locationMock.href).toBe('/admin/');
  });

  it('onCardSelect navigates to /operator/ for operator card', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    const comp = fixture.componentInstance;

    comp.onCardSelect({
      id: 'operator-mobile',
      title: 'Operator',
      description: 'd',
      ariaLabel: 'a',
      href: '/operator/',
    });

    expect(locationMock.href).toBe('/operator/');
  });
});
```

---

### `projects/gateway/src/app/features/home/home.component.interactions.spec.ts`

Tests that clicking a `app-dashboard-card` (via the `activate` output) triggers navigation.

```typescript
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HomeComponent } from './home.component';

describe('HomeComponent interactions', () => {
  let locationMock: { href: string };

  beforeEach(() => {
    locationMock = { href: '' };
    Object.defineProperty(window, 'location', { value: locationMock, writable: true });
  });

  it('activate event on admin card navigates to /admin/', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const cardDe = fixture.debugElement.queryAll(By.css('app-dashboard-card'))[0];
    expect(cardDe).toBeTruthy();

    cardDe.triggerEventHandler('activate', null);
    fixture.detectChanges();

    expect(locationMock.href).toBe('/admin/');
  });

  it('activate event on operator-mobile card navigates to /operator/', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const cardDe = fixture.debugElement.queryAll(By.css('app-dashboard-card'))[1];
    expect(cardDe).toBeTruthy();

    cardDe.triggerEventHandler('activate', null);
    fixture.detectChanges();

    expect(locationMock.href).toBe('/operator/');
  });
});
```

---

## 4. Validation Steps

```powershell
# Confirm source files exist
Test-Path "projects\gateway\src\app\app.routes.ts"
Test-Path "projects\gateway\src\app\features\home\home.component.ts"
Test-Path "projects\gateway\src\app\features\home\home.component.spec.ts"
Test-Path "projects\gateway\src\app\features\home\home.component.handlers.spec.ts"
Test-Path "projects\gateway\src\app\features\home\home.component.interactions.spec.ts"

# TypeScript parse-check (requires tasks 001 and 002 to be complete)
npx tsc -p projects/gateway/tsconfig.app.json --noEmit

# Run only gateway home component tests
npx ng test gateway --watch=false --include="**/home/**/*.spec.ts"
```

Expected: all `Test-Path` return `True`; `tsc` produces no errors; all 5 tests pass.
