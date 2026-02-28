# TASK003 - Admin Layout Shell (Desktop Sidebar + Toolbar)

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK002  
**Blocks:** TASK005, TASK006, TASK007, TASK008, TASK009

## Original Request

Create the admin module shell — a desktop-optimized layout with Angular Material `mat-sidenav` (permanent side
navigation), `mat-toolbar` at the top, and a `<router-outlet>` for child content. The sidenav contains navigation
links to all admin sections. The toolbar shows the app title and a logout button. Define all admin child routes
(lazy-loaded components). This is designed for desktop screens ≥22" at 1080p resolution.

## Thought Process

The admin layout is a classic desktop application shell:
- Fixed sidebar on the left (260px wide) with navigation links
- Top toolbar with application name and user actions (logout)
- Content area fills the remaining space with `<router-outlet>`

We use Material `mat-sidenav-container` with `mat-sidenav` in `mode="side"` and `opened="true"` for a persistent
sidebar that never collapses on desktop.

Navigation items in the sidebar (each is a `routerLink`):
1. Оборудование (`/admin/equipment`) — icon: `pedal_bike`
2. Типы оборудования (`/admin/equipment-types`) — icon: `category`
3. Статусы оборудования (`/admin/equipment-statuses`) — icon: `toggle_on`
4. Тарифы (`/admin/tariffs`) — icon: `payments`
5. Клиенты (`/admin/customers`) — icon: `people`
6. Аренды (`/admin/rentals`) — icon: `receipt_long`
7. Платежи (`/admin/payments`) — icon: `account_balance_wallet`
8. Пользователи (`/admin/users`) — icon: `manage_accounts`

The child routes load components that will be created in TASK005–TASK009. For now, each route points to
placeholder components that just display the section name.

### i18n consideration
All navigation labels should use Angular i18n `i18n` attribute on the text elements so they can be extracted
for translation later. For now the labels are in Russian as the default language.

## Implementation Plan

### 3.1 — Create admin child routes

Create `src/app/features/admin/admin.routes.ts`:
```typescript
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'equipment', pathMatch: 'full' },
      {
        path: 'equipment',
        loadComponent: () => import('./equipment/equipment-list.component').then(m => m.EquipmentListComponent)
      },
      {
        path: 'equipment-types',
        loadComponent: () => import('./equipment-types/equipment-type-list.component').then(m => m.EquipmentTypeListComponent)
      },
      {
        path: 'equipment-statuses',
        loadComponent: () => import('./equipment-statuses/equipment-status-list.component').then(m => m.EquipmentStatusListComponent)
      },
      {
        path: 'tariffs',
        loadComponent: () => import('./tariffs/tariff-list.component').then(m => m.TariffListComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./customers/customer-list.component').then(m => m.CustomerListComponent)
      },
      {
        path: 'rentals',
        loadComponent: () => import('./rentals/rental-history.component').then(m => m.RentalHistoryComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./payments/payment-history.component').then(m => m.PaymentHistoryComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./users/user-placeholder.component').then(m => m.UserPlaceholderComponent)
      }
    ]
  }
];
```

### 3.2 — Create AdminLayoutComponent

Create `src/app/features/admin/layout/admin-layout.component.ts`:
- Standalone component
- Imports: `MatSidenavModule`, `MatToolbarModule`, `MatListModule`, `MatIconModule`, `MatButtonModule`, `RouterOutlet`, `RouterLink`, `RouterLinkActive`
- Injects: `AuthService`, `Router`
- `OnPush` change detection
- Method: `logout()` → calls `AuthService.logout()`
- Property: `currentUser = inject(AuthService).currentUser`

Create `src/app/features/admin/layout/admin-layout.component.html`:
```html
<mat-sidenav-container class="admin-container">
  <mat-sidenav mode="side" opened class="admin-sidenav">
    <div class="sidenav-header">
      <h2 i18n>Bike Rental</h2>
    </div>
    <mat-nav-list>
      <a mat-list-item routerLink="equipment" routerLinkActive="active-link">
        <mat-icon matListItemIcon>pedal_bike</mat-icon>
        <span matListItemTitle i18n>Оборудование</span>
      </a>
      <a mat-list-item routerLink="equipment-types" routerLinkActive="active-link">
        <mat-icon matListItemIcon>category</mat-icon>
        <span matListItemTitle i18n>Типы оборудования</span>
      </a>
      <a mat-list-item routerLink="equipment-statuses" routerLinkActive="active-link">
        <mat-icon matListItemIcon>toggle_on</mat-icon>
        <span matListItemTitle i18n>Статусы оборудования</span>
      </a>
      <a mat-list-item routerLink="tariffs" routerLinkActive="active-link">
        <mat-icon matListItemIcon>payments</mat-icon>
        <span matListItemTitle i18n>Тарифы</span>
      </a>
      <a mat-list-item routerLink="customers" routerLinkActive="active-link">
        <mat-icon matListItemIcon>people</mat-icon>
        <span matListItemTitle i18n>Клиенты</span>
      </a>
      <a mat-list-item routerLink="rentals" routerLinkActive="active-link">
        <mat-icon matListItemIcon>receipt_long</mat-icon>
        <span matListItemTitle i18n>Аренды</span>
      </a>
      <a mat-list-item routerLink="payments" routerLinkActive="active-link">
        <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
        <span matListItemTitle i18n>Платежи</span>
      </a>
      <a mat-list-item routerLink="users" routerLinkActive="active-link">
        <mat-icon matListItemIcon>manage_accounts</mat-icon>
        <span matListItemTitle i18n>Пользователи</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content class="admin-content">
    <mat-toolbar color="primary">
      <span i18n>Админ-панель</span>
      <span class="toolbar-spacer"></span>
      <span class="username">{{ currentUser()?.username }}</span>
      <button mat-icon-button (click)="logout()" aria-label="Logout">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    <div class="content-area">
      <router-outlet />
    </div>
  </mat-sidenav-content>
</mat-sidenav-container>
```

Create `src/app/features/admin/layout/admin-layout.component.css`:
```css
:host {
  display: block;
  height: 100vh;
}

.admin-container {
  height: 100%;
}

.admin-sidenav {
  width: 260px;
  background: #fafafa;
}

.sidenav-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.sidenav-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.admin-content {
  display: flex;
  flex-direction: column;
}

.toolbar-spacer {
  flex: 1 1 auto;
}

.username {
  margin-right: 8px;
  font-size: 14px;
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.active-link {
  background: rgba(63, 81, 181, 0.08) !important;
}
```

### 3.3 — Create placeholder components for all admin child routes

Each placeholder is a minimal standalone component that displays the section name.
These will be replaced in TASK005–TASK009 with real implementations.

Create the following files (same pattern for each):

**`src/app/features/admin/equipment/equipment-list.component.ts`**:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  template: '<h1 i18n>Оборудование</h1><p i18n>Будет реализовано в TASK007</p>'
})
export class EquipmentListComponent {}
```

Repeat for:
- `equipment-types/equipment-type-list.component.ts` → `EquipmentTypeListComponent` → "Типы оборудования — TASK005"
- `equipment-statuses/equipment-status-list.component.ts` → `EquipmentStatusListComponent` → "Статусы оборудования — TASK006"
- `tariffs/tariff-list.component.ts` → `TariffListComponent` → "Тарифы — TASK008"
- `customers/customer-list.component.ts` → `CustomerListComponent` → "Клиенты — TASK009"
- `rentals/rental-history.component.ts` → `RentalHistoryComponent` → "История аренд — TASK009"
- `payments/payment-history.component.ts` → `PaymentHistoryComponent` → "История платежей — TASK009"
- `users/user-placeholder.component.ts` → `UserPlaceholderComponent` → "Пользователи — TASK009"

### 3.4 — Delete old admin placeholder

Delete `src/app/features/admin/layout/admin-placeholder.component.ts` (created in TASK001 as temporary placeholder).

### 3.5 — Verify build

Run:
```powershell
npm run build
```

Test manually:
- Login as admin → should see sidebar with all navigation links
- Click each link → should navigate and show placeholder content
- Logout button should redirect to `/login`

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 3.1 | Admin child routes (admin.routes.ts) | Not Started | 2026-02-28 | |
| 3.2 | AdminLayoutComponent (sidenav + toolbar) | Not Started | 2026-02-28 | |
| 3.3 | Placeholder components for all admin sections (8) | Not Started | 2026-02-28 | |
| 3.4 | Delete old admin placeholder | Not Started | 2026-02-28 | |
| 3.5 | Verify build | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with full layout design
- 8 navigation items defined with icons and Russian labels
- Desktop-first layout: 260px sidenav, full-height, OnPush

