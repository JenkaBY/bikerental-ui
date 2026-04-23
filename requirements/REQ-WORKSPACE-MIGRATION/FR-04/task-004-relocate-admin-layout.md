# Task 004: Relocate Admin Layout Component

> **Applied Skill:** `angular-component` — standalone, `OnPush`, host bindings, inject().
> **Applied Skill:** `angular-testing` — Vitest TestBed, value providers.

## 1. Objective

Relocate the admin layout component from `src/app/features/admin/layout/` to `projects/admin/src/app/layout/`. All three files must be created with updated import paths: every `../../../shared/...` and `../../../app.tokens` import must be replaced by a single import from `@bikerental/shared`.

## 2. Files to Create

| # | Source (reference only — do NOT edit)                          | Destination                                                    |
|---|----------------------------------------------------------------|----------------------------------------------------------------|
| 1 | `src/app/features/admin/layout/admin-layout.component.ts`      | `projects/admin/src/app/layout/admin-layout.component.ts`      |
| 2 | `src/app/features/admin/layout/admin-layout.component.html`    | `projects/admin/src/app/layout/admin-layout.component.html`    |
| 3 | `src/app/features/admin/layout/admin-layout.component.spec.ts` | `projects/admin/src/app/layout/admin-layout.component.spec.ts` |

---

## 3. Code Implementation

### File 1 — `projects/admin/src/app/layout/admin-layout.component.ts`

**Import substitution rule:** Every import with a path beginning `../../../shared/` or `../../../app.tokens` is replaced with a single `@bikerental/shared` import.

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  APP_BRAND,
  HealthIndicatorComponent,
  LogoutButtonComponent,
  NavItem,
  ShellComponent,
} from '@bikerental/shared';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Equipment`, route: 'equipment', icon: 'pedal_bike' },
  { label: $localize`Equipment Types`, route: 'equipment-types', icon: 'category' },
  { label: $localize`Equipment Statuses`, route: 'equipment-statuses', icon: 'toggle_on' },
  { label: $localize`Tariffs`, route: 'tariffs', icon: 'payments' },
  { label: $localize`Customers`, route: 'customers', icon: 'people' },
  { label: $localize`Rentals`, route: 'rentals', icon: 'receipt_long' },
  { label: $localize`Payments`, route: 'payments', icon: 'account_balance_wallet' },
  { label: $localize`Users`, route: 'users', icon: 'manage_accounts' },
];

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShellComponent, RouterOutlet, HealthIndicatorComponent, LogoutButtonComponent],
  host: { class: 'block h-screen' },
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  protected navItems = NAV_ITEMS;
  protected brand = inject(APP_BRAND);
  protected title = $localize`Admin Dashboard`;
  protected sidenavOpened = signal(true);

  protected onToggleSidebar() {
    this.sidenavOpened.update((v) => !v);
  }

  protected onLogout() {
    console.log('logout requested from admin layout');
  }
}
```

### File 2 — `projects/admin/src/app/layout/admin-layout.component.html`

**Action:** Copy verbatim from `src/app/features/admin/layout/admin-layout.component.html`. No changes required.

```html

<app-shell
  [items]="navItems"
  [brand]="brand"
  [title]="title"
  (toggleSidebar)="onToggleSidebar()"
  (logout)="onLogout()"
  [showModeToggle]="false"
>
  <div sidebar-footer>
    <app-health-indicator />
  </div>

  <div toolbar-actions>
    <app-logout-button (logout)="onLogout()" />
  </div>

  <router-outlet></router-outlet>
</app-shell>
```

### File 3 — `projects/admin/src/app/layout/admin-layout.component.spec.ts`

**Import substitution rule:** Replace `from '../../../app.tokens'` with `from '@bikerental/shared'`. All other imports are unchanged.

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';
import { APP_BRAND, BRAND } from '@bikerental/shared';

describe('AdminLayoutComponent', () => {
  let fixture: ComponentFixture<AdminLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the shell', () => {
    expect(fixture.nativeElement.querySelector('app-shell')).toBeTruthy();
  });

  it('should render the health indicator', () => {
    expect(fixture.nativeElement.querySelector('app-health-indicator')).toBeTruthy();
  });
});
```

> **Note:** Read the full source at `src/app/features/admin/layout/admin-layout.component.spec.ts` before writing the relocated spec — copy any additional test cases verbatim, updating only the `APP_BRAND`/`BRAND` import.

---

## 4. Validation Steps

```powershell
# Confirm all three files exist
Test-Path "projects\admin\src\app\layout\admin-layout.component.ts"
Test-Path "projects\admin\src\app\layout\admin-layout.component.html"
Test-Path "projects\admin\src\app\layout\admin-layout.component.spec.ts"

# TypeScript parse-check (errors for missing feature components still expected)
npx tsc -p projects/admin/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```
