# Task 004: Relocate Operator Layout Components

> **Applied Skill:** `angular-component` — standalone, `ChangeDetectionStrategy.OnPush`, `inject()`.
> **Applied Skill:** `angular-di` — `inject()` for `APP_BRAND` and `LayoutModeService`.

## 1. Objective

Create the two layout components in `projects/operator/src/app/layout/`. All relative import paths pointing to `src/app/core/` and `src/app/shared/` are replaced with `@bikerental/shared`. Intra-layout relative imports (e.g., `./operator-layout.component`) are unchanged.

## 2. Files to Create

| # | File Path                                                              | Action          |
|---|------------------------------------------------------------------------|-----------------|
| 1 | `projects/operator/src/app/layout/operator-layout.component.ts`        | Create New File |
| 2 | `projects/operator/src/app/layout/operator-shell-wrapper.component.ts` | Create New File |

---

## 3. Code Implementation

### File 1 — `projects/operator/src/app/layout/operator-layout.component.ts`

**Import changes from source** (`src/app/features/operator/layout/operator-layout.component.ts`):

| Old import path                                                            | New import path      |
|----------------------------------------------------------------------------|----------------------|
| `'../../../shared/components/app-toolbar/app-toolbar.component'`           | `@bikerental/shared` |
| `'../../../shared/components/bottom-nav/bottom-nav.component'`             | `@bikerental/shared` |
| `'../../../shared/components/health-indicator/health-indicator.component'` | `@bikerental/shared` |
| `'../../../shared/components/logout-button/logout-button.component'`       | `@bikerental/shared` |
| `'../../../shared/components/sidebar-nav-item/nav-item.model'`             | `@bikerental/shared` |
| `'../../../app.tokens'`                                                    | `@bikerental/shared` |

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AppToolbarComponent,
  BottomNavComponent,
  HealthIndicatorComponent,
  LogoutButtonComponent,
  NavItem,
  APP_BRAND,
} from '@bikerental/shared';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Dashboard`, route: 'dashboard', icon: 'dashboard' },
  { label: $localize`New Rental`, route: 'rental/new', icon: 'add_circle' },
  { label: $localize`Return`, route: 'return', icon: 'qr_code_scanner' },
];

@Component({
  selector: 'app-operator-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToolbarComponent,
    BottomNavComponent,
    HealthIndicatorComponent,
    LogoutButtonComponent,
  ],
  host: { class: 'flex flex-col h-screen max-w-[480px] mx-auto' },
  template: `
    <app-toolbar [title]="title" [showToggle]="false" [showDesktopModeToggle]="true">
      <app-health-indicator />
      <app-logout-button (logout)="onLogout()" />
    </app-toolbar>

    <main class="flex-1 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch]">
      <ng-content></ng-content>
    </main>

    <app-bottom-nav [items]="navItems" />
  `,
})
export class OperatorLayoutComponent {
  protected navItems = NAV_ITEMS;
  protected brand = inject(APP_BRAND);
  protected title = $localize`Bike Rental`;

  protected onLogout() {
    console.log('logout requested from operator layout');
  }
}
```

### File 2 — `projects/operator/src/app/layout/operator-shell-wrapper.component.ts`

**Import changes from source** (`src/app/features/operator/layout/operator-shell-wrapper.component.ts`):

| Old import path                                                            | New import path      |
|----------------------------------------------------------------------------|----------------------|
| `'../../../core/layout-mode.service'`                                      | `@bikerental/shared` |
| `'../../../shared/components/shell/shell.component'`                       | `@bikerental/shared` |
| `'../../../shared/components/health-indicator/health-indicator.component'` | `@bikerental/shared` |
| `'../../../shared/components/logout-button/logout-button.component'`       | `@bikerental/shared` |
| `'../../../shared/components/sidebar-nav-item/nav-item.model'`             | `@bikerental/shared` |
| `'../../../app.tokens'`                                                    | `@bikerental/shared` |
| `'./operator-layout.component'`                                            | unchanged            |

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  LayoutModeService,
  ShellComponent,
  HealthIndicatorComponent,
  LogoutButtonComponent,
  NavItem,
  APP_BRAND,
} from '@bikerental/shared';
import { OperatorLayoutComponent } from './operator-layout.component';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Dashboard`, route: 'dashboard', icon: 'dashboard' },
  { label: $localize`New Rental`, route: 'rental/new', icon: 'add_circle' },
  { label: $localize`Return`, route: 'return', icon: 'qr_code_scanner' },
];

@Component({
  selector: 'app-operator-shell-wrapper',
  standalone: true,
  imports: [
    RouterOutlet,
    OperatorLayoutComponent,
    ShellComponent,
    HealthIndicatorComponent,
    LogoutButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout.isMobile()) {
      <app-operator-layout>
        <router-outlet></router-outlet>
      </app-operator-layout>
    } @else {
      <app-shell [items]="navItems" [brand]="brand" [title]="title" [showModeToggle]="true">
        <div sidebar-footer>
          <app-health-indicator />
        </div>

        <div toolbar-actions>
          <app-logout-button (logout)="onLogout()" />
        </div>

        <router-outlet></router-outlet>
      </app-shell>
    }
  `,
})
export class OperatorShellWrapperComponent {
  protected readonly layout = inject(LayoutModeService);
  protected readonly navItems = NAV_ITEMS;
  protected readonly brand = inject(APP_BRAND);
  protected readonly title = $localize`Operator`;

  protected onLogout() {
    console.log('logout from operator wrapper');
  }
}
```

---

## 4. Validation Steps

```powershell
# TypeScript parse-check — errors about missing dashboard/rental-create/return components are expected until Task 005 completes
npx tsc -p projects/operator/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: `Cannot find module './dashboard/dashboard.component'` etc. No errors on `@bikerental/shared` named imports or `LayoutModeService`.
