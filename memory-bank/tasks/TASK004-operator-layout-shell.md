# TASK004 - Operator Layout Shell (Mobile Bottom Navigation)

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK002  
**Blocks:** TASK010, TASK011, TASK012

## Original Request

Create the operator module shell — a mobile-optimized layout with Angular Material `mat-toolbar` at the top and
a fixed bottom navigation bar at the bottom. Three navigation tabs: Дашборд, Новая аренда, Возврат. The content
area uses `<router-outlet>`. This is designed for phone screens as the primary interaction device.

## Thought Process

The operator layout must be mobile-first:
- Top toolbar: compact, with app title and logout icon button
- Content area: scrollable, takes full remaining height
- Bottom navigation: 3 tabs with icons, fixed at the bottom of the screen
- Touch-friendly: large tap targets (48px minimum)
- No sidenav — phone screens don't have room for it

For the bottom navigation, Angular Material does not have a dedicated bottom-nav component. We will use
`mat-tab-nav-bar` with `mat-tab-link` elements styled at the bottom, OR build a custom bottom bar using
`mat-toolbar` with `mat-icon-button` elements. The custom approach is simpler and more flexible.

**Custom bottom nav approach**:
- A `<nav>` element with `display: flex; justify-content: space-around;`
- 3 items, each is a `routerLink` with an icon and a label
- `routerLinkActive` highlights the active tab
- Fixed position at the bottom of the viewport

The layout uses flexbox: `flex-direction: column; height: 100vh;`
- Toolbar (top) — fixed height
- Content (middle) — `flex: 1; overflow-y: auto;`
- Bottom nav — fixed height at bottom

### i18n consideration
All labels use `i18n` attribute. Russian as default.

## Implementation Plan

### 4.1 — Create operator child routes

Create `src/app/features/operator/operator.routes.ts`:
```typescript
import { Routes } from '@angular/router';
import { OperatorLayoutComponent } from './layout/operator-layout.component';

export const OPERATOR_ROUTES: Routes = [
  {
    path: '',
    component: OperatorLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'rental/new',
        loadComponent: () => import('./rental-create/rental-create.component').then(m => m.RentalCreateComponent)
      },
      {
        path: 'return',
        loadComponent: () => import('./return/return.component').then(m => m.ReturnComponent)
      }
    ]
  }
];
```

### 4.2 — Create OperatorLayoutComponent

Create `src/app/features/operator/layout/operator-layout.component.ts`:
- Standalone component
- Imports: `MatToolbarModule`, `MatIconModule`, `MatButtonModule`, `RouterOutlet`, `RouterLink`, `RouterLinkActive`
- Injects: `AuthService`
- `OnPush` change detection
- Method: `logout()` → calls `AuthService.logout()`

Create `src/app/features/operator/layout/operator-layout.component.html`:
```html
<div class="operator-shell">
  <mat-toolbar color="primary" class="top-toolbar">
    <span i18n>Bike Rental</span>
    <span class="toolbar-spacer"></span>
    <button mat-icon-button (click)="logout()" aria-label="Logout">
      <mat-icon>logout</mat-icon>
    </button>
  </mat-toolbar>

  <main class="content-area">
    <router-outlet />
  </main>

  <nav class="bottom-nav">
    <a routerLink="dashboard" routerLinkActive="active-tab" class="nav-item">
      <mat-icon>dashboard</mat-icon>
      <span i18n>Дашборд</span>
    </a>
    <a routerLink="rental/new" routerLinkActive="active-tab" class="nav-item">
      <mat-icon>add_circle</mat-icon>
      <span i18n>Новая аренда</span>
    </a>
    <a routerLink="return" routerLinkActive="active-tab" class="nav-item">
      <mat-icon>qr_code_scanner</mat-icon>
      <span i18n>Возврат</span>
    </a>
  </nav>
</div>
```

Create `src/app/features/operator/layout/operator-layout.component.css`:
```css
:host {
  display: block;
  height: 100vh;
  height: 100dvh; /* dynamic viewport height for mobile browsers */
}

.operator-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.top-toolbar {
  flex-shrink: 0;
}

.toolbar-spacer {
  flex: 1 1 auto;
}

.content-area {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

.bottom-nav {
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 8px 0;
  text-decoration: none;
  color: rgba(0, 0, 0, 0.54);
  font-size: 12px;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.nav-item mat-icon {
  font-size: 24px;
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.nav-item span {
  line-height: 1;
}

.active-tab {
  color: #3f51b5;
  font-weight: 500;
}
```

### 4.3 — Create placeholder components for operator child routes

Create the following placeholder components (same pattern):

**`src/app/features/operator/dashboard/dashboard.component.ts`**:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: '<h2 i18n>Активные аренды</h2><p i18n>Будет реализовано в TASK010</p>'
})
export class DashboardComponent {}
```

**`src/app/features/operator/rental-create/rental-create.component.ts`**:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-rental-create',
  standalone: true,
  template: '<h2 i18n>Новая аренда</h2><p i18n>Будет реализовано в TASK011</p>'
})
export class RentalCreateComponent {}
```

**`src/app/features/operator/return/return.component.ts`**:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-return',
  standalone: true,
  template: '<h2 i18n>Возврат оборудования</h2><p i18n>Будет реализовано в TASK012</p>'
})
export class ReturnComponent {}
```

### 4.4 — Delete old operator placeholder

Delete `src/app/features/operator/layout/operator-placeholder.component.ts` (created in TASK001).

### 4.5 — Verify build and test on mobile

Run:
```powershell
npm run build
```

Test manually on phone (or Chrome DevTools mobile emulation):
- Login as operator → should see top toolbar + bottom nav with 3 tabs
- Tap each tab → should navigate and show placeholder content
- Content should scroll if it overflows
- Bottom nav should remain fixed at the bottom
- Logout icon should redirect to `/login`
- Layout should not exceed 480px width (centered on wider screens)

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 4.1 | Operator child routes (operator.routes.ts) | Not Started | 2026-02-28 | |
| 4.2 | OperatorLayoutComponent (toolbar + bottom nav) | Not Started | 2026-02-28 | |
| 4.3 | Placeholder components for operator sections (3) | Not Started | 2026-02-28 | |
| 4.4 | Delete old operator placeholder | Not Started | 2026-02-28 | |
| 4.5 | Verify build and test on mobile | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with full mobile layout design
- Custom bottom nav chosen over mat-tab-nav-bar
- 3 navigation items: Dashboard, New Rental, Return
- 100dvh for dynamic viewport height on mobile browsers
- Max-width 480px for operator shell

