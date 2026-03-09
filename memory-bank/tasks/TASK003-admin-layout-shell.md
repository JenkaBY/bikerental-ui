# TASK003 - Admin Layout Shell (Desktop Sidebar + Toolbar)

**Status:** Completed  
**Added:** 2026-02-28  
**Updated:** 2026-03-09  
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

### Reusable Components Approach (Updated 2026-03-07)

Instead of hard-coding navigation links directly in the layout template, we extract:

1. **`NavItem` interface** — `{ label: string; route: string; icon: string }` — plain data model
2. **`SidebarNavItemComponent`** — a dumb, reusable `<a mat-list-item>` component that takes a `NavItem` input and
   renders the icon + label. Used with `@for` in the sidebar.
3. **`adminNavItems` array** — defined as a constant in `admin-layout.component.ts` and iterated with `@for` in the template.

This keeps the template clean, makes it easy to add/remove items without touching HTML, and makes `SidebarNavItemComponent` reusable for the operator layout shell (TASK004).

### Tailwind 4 Styling Approach (Updated 2026-03-07)

Tailwind 4 is already installed (`tailwindcss@^4`, `@tailwindcss/postcss`, `postcss.config.js`). We use it for all
fine-grained layout tweaks, margin/padding, typography and colour utilities **instead of hand-rolled CSS classes**:

- **No component `.css` files** for `AdminLayoutComponent` — layout is expressed entirely with Tailwind utilities in
  the template and `host: { class: '...' }`.
- **`host: { class: 'block h-screen' }`** on `AdminLayoutComponent` replaces the old `:host { height: 100vh }` rule.
- **`SidebarNavItemComponent`** uses Tailwind utilities on `<a mat-list-item>` and its child elements
  (`rounded-lg! mx-2! my-0.5!`, `text-sm! font-medium!`).
- **Important modifier** uses Tailwind 4 suffix syntax `class!` (e.g. `rounded-lg!`) — **not** the old `!class` prefix.
- **Sidebar width** uses `w-65` (Tailwind 4 canonical for 260 px) — not `w-[260px]`.
- **Active nav-item styles** (set via `routerLinkActive="active-nav-item"`) are placed in `src/styles.css` using
  standard Material MDC class selectors, because component-scoped styles cannot pierce Material's shadow DOM.

### Language

All labels and placeholder texts use **English** (no Russian). i18n `i18n` attributes are still applied so strings
can be extracted for translation later.

### Navigation items

| Label              | Route              | Icon                   |
|--------------------|--------------------|------------------------|
| Equipment          | equipment          | pedal_bike             |
| Equipment Types    | equipment-types    | category               |
| Equipment Statuses | equipment-statuses | toggle_on              |
| Tariffs            | tariffs            | payments               |
| Customers          | customers          | people                 |
| Rentals            | rentals            | receipt_long           |
| Payments           | payments           | account_balance_wallet |
| Users              | users              | manage_accounts        |

## Implementation Plan

### 3.0 — Create NavItem model and SidebarNavItemComponent

**`src/app/shared/components/sidebar-nav-item/nav-item.model.ts`**:

```typescript
export interface NavItem {
  label: string;
  route: string;
  icon: string;
}
```

**`src/app/shared/components/sidebar-nav-item/sidebar-nav-item.component.ts`**:

```typescript
import {Component, ChangeDetectionStrategy, input} from '@angular/core';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {NavItem} from './nav-item.model';

@Component({
  selector: 'app-sidebar-nav-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  template: `
    <a
      mat-list-item
      [routerLink]="item().route"
      routerLinkActive="active-nav-item"
      class="rounded-lg! mx-2! my-0.5!"
    >
      <mat-icon matListItemIcon class="text-slate-500!">{{ item().icon }}</mat-icon>
      <span matListItemTitle class="text-sm! font-medium!">{{ item().label }}</span>
    </a>
  `,
  styles: `:host { display: block; }`,
})
export class SidebarNavItemComponent {
  item = input.required<NavItem>();
}
```

Active-state styles go in `src/styles.css` (global) because `routerLinkActive` applies the class at runtime
and component-scoped styles cannot pierce Material's MDC shadow DOM:

```css
.active-nav-item.mdc-list-item {
  background-color: rgba(99, 102, 241, 0.12) !important;
}

.active-nav-item .mat-icon {
  color: rgb(99, 102, 241) !important;
}

.active-nav-item .mdc-list-item__primary-text {
  color: rgb(99, 102, 241) !important;
  font-weight: 600 !important;
}
```

> **Tailwind 4 note:** important modifier is a *suffix* — `rounded-lg!`, not `!rounded-lg`.

### 3.1 — Create admin child routes

`src/app/features/admin/admin.routes.ts` — root route uses `AdminLayoutComponent` as shell, all section paths are lazy-loaded children.

### 3.2 — Create AdminLayoutComponent

**`src/app/features/admin/layout/admin-layout.component.ts`**:

- No `.css` file — all layout expressed with Tailwind utilities in the template + `host`
- `host: { class: 'block h-screen' }` replaces the old `:host { height: 100vh }` rule
- Module-level `NAV_ITEMS: NavItem[]` constant; exposed as `protected navItems`
- No `AuthService` until TASK002 — logout button is present in the toolbar but wired up later

```typescript

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, RouterOutlet, SidebarNavItemComponent],
  host: {class: 'block h-screen'},
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  protected navItems = NAV_ITEMS;
}
```

**`src/app/features/admin/layout/admin-layout.component.html`** — Tailwind utilities for all sizing, spacing, colour:
```html

<mat-sidenav-container class="h-full">
  <mat-sidenav mode="side" opened class="w-65 bg-slate-50 border-r border-slate-200">
    <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-200">
      <mat-icon class="text-indigo-600">directions_bike</mat-icon>
      <span class="text-base font-semibold tracking-tight text-slate-800" i18n>Bike Rental</span>
    </div>
    <mat-nav-list class="mt-2 px-1">
      @for (item of navItems; track item.route) {
      <app-sidebar-nav-item [item]="item"/>
      }
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content class="flex flex-col">
    <mat-toolbar color="primary" class="shrink-0 flex items-center gap-2 px-4 shadow-md">
      <span class="text-base font-medium" i18n>Admin Panel</span>
      <span class="flex-1"></span>
      <button mat-icon-button aria-label="Logout" title="Logout">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    <div class="flex-1 overflow-y-auto p-6">
      <router-outlet />
    </div>
  </mat-sidenav-content>
</mat-sidenav-container>
```

> `w-65` = 260 px in Tailwind 4 (canonical). Do **not** use `w-[260px]`.

### 3.3 — Create placeholder components for all admin child routes

Each placeholder uses Tailwind utilities for its heading and subtext. Pattern:

```typescript
@Component({
  selector: 'app-equipment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Equipment</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK007</p>
  `,
})
export class EquipmentListComponent {}
```

Files to create:

- `equipment/equipment-list.component.ts` → `EquipmentListComponent` — "Equipment / TASK007"
- `equipment-types/equipment-type-list.component.ts` → `EquipmentTypeListComponent` — "Equipment Types / TASK005"
- `equipment-statuses/equipment-status-list.component.ts` → `EquipmentStatusListComponent` — "Equipment Statuses / TASK006"
- `tariffs/tariff-list.component.ts` → `TariffListComponent` — "Tariffs / TASK008"
- `customers/customer-list.component.ts` → `CustomerListComponent` — "Customers / TASK009"
- `rentals/rental-history.component.ts` → `RentalHistoryComponent` — "Rentals / TASK009"
- `payments/payment-history.component.ts` → `PaymentHistoryComponent` — "Payments / TASK009"
- `users/user-placeholder.component.ts` → `UserPlaceholderComponent` — "Users / TASK009"

### 3.4 — Delete old admin placeholder

Delete `src/app/features/admin/layout/admin-placeholder.component.ts`.

### 3.5 — Verify build

```powershell
npm run build
```

Expected: build succeeds; only i18n translation warnings for new English strings (no Russian translations yet).

## Progress Tracking

**Overall Status:** Complete - 100%

### Subtasks

| ID  | Description                                       | Status   | Updated    | Notes                                                                                                                                         |
|-----|---------------------------------------------------|----------|------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| 3.0 | NavItem model + SidebarNavItemComponent (shared)  | Complete | 2026-03-07 | Tailwind utilities; active styles in styles.css                                                                                               |
| 3.1 | Admin child routes (admin.routes.ts)              | Complete | 2026-03-07 | Full child route tree wired                                                                                                                   |
| 3.2 | AdminLayoutComponent (sidenav + toolbar)          | Complete | 2026-03-09 | Refactored to use ShellComponent                                                                                                              |
| 3.3 | Placeholder components for all admin sections (8) | Complete | 2026-03-07 | Tailwind typography utilities                                                                                                                 |
| 3.4 | Delete old admin-placeholder.component.ts         | Complete | 2026-03-07 | File removed                                                                                                                                  |
| 3.5 | Verify build                                      | Complete | 2026-03-07 | Build passes; i18n warnings only                                                                                                              |
| 3.6 | Shared shell component layer                      | Complete | 2026-03-09 | ShellComponent + SidebarComponent + AppToolbarComponent + AppBrandComponent + ButtonComponent + ToggleButtonComponent + LogoutButtonComponent |

## Progress Log

### 2026-02-28

- Task created with full layout design
- 8 navigation items defined with icons and Russian labels
- Desktop-first layout: 260px sidenav, full-height, OnPush

### 2026-03-09 — Admin layout refactored to use shared ShellComponent

- Introduced `ShellComponent` (`shared/components/shell/`) — generic layout shell with optional sidebar, toolbar toggle, content projection slots (`[sidebar-footer]`, `[toolbar-actions]`)
- Introduced `SidebarComponent` (`shared/components/sidebar/`) — wraps `AppBrandComponent` + `SidebarNavItemComponent` in a flex column; accepts `items` and optional `brand` input
- Introduced `AppBrandComponent` (`shared/components/app-brand/`) — renders bike icon + brand name; prefers `brand` input, falls back to `APP_BRAND` injection token
- Introduced `AppToolbarComponent` (`shared/components/app-toolbar/`) — `mat-toolbar` wrapper with optional toggle button (`ToggleButtonComponent`), title span with `flex-1 truncate`, and `<ng-content>` for toolbar actions
- Introduced `ButtonComponent` (`shared/components/button/`) — generic reusable button: text mode (`mat-button` + icon + label) or icon-only mode (`mat-icon-button`); outputs `activated`
- Introduced `ToggleButtonComponent` (`shared/components/toggle-button/`) — wraps `ButtonComponent`; `pressed` input drives `menu` vs `menu_open` icon; `customIcon` overrides computed icon; outputs `toggled`
- Introduced `LogoutButtonComponent` (`shared/components/logout-button/`) — wraps `ButtonComponent` with logout icon; outputs `logout`
- `APP_BRAND` injection token added to `app.tokens.ts`; `BRAND` constant defined; `app.config.ts` provides `APP_BRAND` using env override or fallback to `BRAND`
- `AdminLayoutComponent` refactored: now uses `<app-shell>` with `[items]`, `[brand]`, `[title]`; `<app-health-indicator>` placed in `[sidebar-footer]` slot; `<app-logout-button>` placed in `[toolbar-actions]` slot; `<router-outlet>` as default content
- `AdminLayoutComponent` manages `sidenavOpened` signal internally and passes it to `ShellComponent` via `[sidenavOpened]` binding; `onToggleSidebar()` toggles the signal
- `ShellComponent` sidebar width changed from `w-65` to `w-72` (288 px)
- Tests added: `ShellComponent` (211 lines), `AppBrandComponent` (37 lines), `AppToolbarComponent` (140 lines), `ButtonComponent` (51 lines), `ToggleButtonComponent` (54 lines)
- `QrScannerComponent` stub file created at `shared/components/qr-scanner/qr-scanner.component.ts` (empty — to be implemented in TASK011)

### 2026-03-07 — Reusable components + Tailwind-first styling

- Extracted `NavItem` interface (`nav-item.model.ts`) and `SidebarNavItemComponent` into `shared/components/sidebar-nav-item/`
- `SidebarNavItemComponent`: dumb OnPush component; `item = input.required<NavItem>()`; Tailwind utilities for spacing/rounding/typography using Tailwind 4 suffix-`!` important syntax (`rounded-lg!`, `mx-2!`, `text-sm!`)
- Active nav-item styles (`routerLinkActive="active-nav-item"`) placed in global `src/styles.css` — component-scoped styles cannot pierce Material MDC
- `AdminLayoutComponent`: no `.css` file; `host: { class: 'block h-screen' }` for full-height; template uses only Tailwind classes (`h-full`, `w-65`, `flex flex-col`, `shrink-0`, `flex-1 overflow-y-auto p-6`, `bg-slate-50`, `border-r border-slate-200`, `shadow-md`, etc.)
- `w-65` used for sidebar width (Tailwind 4 canonical 260 px — not `w-[260px]`)
- All 8 placeholder child components created with Tailwind typography (`text-2xl font-semibold text-slate-800`, `text-sm text-slate-500`)
- All labels in English; `i18n` attributes retained for future Russian translation extraction
- `admin.routes.ts` updated: full child route tree with lazy-loaded components under `AdminLayoutComponent` shell
- Build verified: passes with only expected i18n translation warnings
- Deleted `admin-placeholder.component.ts` (superseded)
- **TASK003 complete**
  **Updated:** 2026-03-09
