# System Patterns

## Architecture Overview

The application follows a **feature-based Angular architecture** with two main feature modules (admin and operator),
each with its own layout shell and child routes. A shared `core/` layer provides auth, API services, models, and
interceptors.

```
src/app/
├── core/                              # Singleton services, guards, interceptors, models
│   ├── auth/                          # AuthService, auth interceptor, auth guard, role guard
│   │   ├── auth.model.ts
│   │   ├── auth.service.ts
│   │   ├── auth.interceptor.ts
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── api/                           # HTTP API client services (one per domain)
│   │   ├── customer.service.ts
│   │   ├── equipment.service.ts
│   │   ├── equipment-type.service.ts
│   │   ├── equipment-status.service.ts
│   │   ├── tariff.service.ts
│   │   ├── rental.service.ts
│   │   └── payment.service.ts
│   ├── models/                        # TypeScript interfaces matching API schemas
│   │   ├── customer.model.ts
│   │   ├── equipment.model.ts
│   │   ├── equipment-type.model.ts
│   │   ├── equipment-status.model.ts
│   │   ├── tariff.model.ts
│   │   ├── rental.model.ts
│   │   ├── payment.model.ts
│   │   └── common.model.ts           # ProblemDetail, Pageable, PageRequest, Page<T>
│   └── interceptors/
│       └── error.interceptor.ts
├── shared/                            # Reusable UI: components, pipes, directives
│   └── components/
│       ├── shell/                    # ShellComponent — generic layout shell (sidebar + toolbar + content projection)
│       ├── sidebar/                  # SidebarComponent — brand header + nav list
│       ├── app-brand/                # AppBrandComponent — icon + brand name (input or APP_BRAND token)
│       ├── app-toolbar/              # AppToolbarComponent — mat-toolbar with toggle + title + ng-content
│       ├── button/                   # ButtonComponent — text or icon-only mat-button; activated output
│       ├── toggle-button/            # ToggleButtonComponent — menu/menu_open icon; toggled output
│       ├── logout-button/            # LogoutButtonComponent — logout icon; logout output
│       ├── sidebar-nav-item/         # NavItem model + SidebarNavItemComponent (dumb, signal input)
│       ├── qr-scanner/               # QrScannerComponent stub (camera-based, html5-qrcode — TASK011)
│       └── health-indicator/         # Server health status indicator (dot + CDK overlay tooltip)
│           ├── health-indicator.component.ts   # Smart: overlay, dotClass, checkedAt, lines computed
│           ├── health-indicator.component.html
│           ├── health-tooltip.component.ts     # Dumb: lines input → @for loop
│           ├── health-tooltip-line.component.ts # Dumb: label+value, hides when value null
│           └── health-tooltip-lines.builder.ts # Pure fn: buildTooltipLines(health, serverInfo, lastChecked)
├── features/
│   ├── auth/                          # Login page (public route)
│   │   └── login.component.ts
│   ├── admin/                         # Desktop-first admin module (lazy-loaded)
│   │   ├── admin.routes.ts
│   │   ├── layout/                    # Sidenav + toolbar shell
│   │   ├── equipment/                 # Equipment CRUD
│   │   ├── equipment-types/           # Equipment Types CRUD
│   │   ├── equipment-statuses/        # Equipment Statuses CRUD
│   │   ├── tariffs/                   # Tariffs CRUD
│   │   ├── customers/                 # Customer search + edit
│   │   ├── rentals/                   # Rental history (read-only)
│   │   ├── payments/                  # Payment history (read-only)
│   │   └── users/                     # User management (placeholder)
│   └── operator/                      # Mobile-first operator module (lazy-loaded)
│       ├── operator.routes.ts
│       ├── layout/                    # Bottom nav + toolbar shell
│       ├── dashboard/                 # Active rentals list
│       ├── rental-create/             # Multi-step rental creation (stepper)
│       │   ├── rental-create.component.ts   # Smart container
│       │   ├── customer-step/         # Step 1: Customer search/create
│       │   ├── equipment-step/        # Step 2: Equipment UID / QR scan
│       │   ├── duration-step/         # Step 3: Duration + auto-tariff
│       │   └── confirm-step/          # Step 4: Payment + start
│       └── return/                    # QR scan + return flow
├── app.routes.ts                      # Root routing
├── app.config.ts                      # Application providers
└── app.ts                             # Root component
```

## Key Technical Decisions

### 1. Standalone Components
All components are standalone (no NgModules). Imports declared per component. Uses `input()` / `output()` functions
(not decorators) per Angular 21 best practices.

### 2. Angular Signals for State
Local component state uses `signal()` and `computed()`. Cross-component state uses services with signals.
`OnPush` change detection on all components.

### 3. Angular Material UI
Material components used throughout: `mat-sidenav`, `mat-toolbar`, `mat-table`, `mat-paginator`, `mat-dialog`,
`mat-stepper`, `mat-card`, `mat-form-field`, `mat-button-toggle`, `mat-snack-bar`, `mat-select`, `mat-datepicker`.

### 4. Two Layout Shells via Shared ShellComponent

Both admin and operator layouts use the shared `ShellComponent` (`shared/components/shell/`):

- **Admin layout**: `ShellComponent` with `[items]` → sidebar rendered (`w-72`, `bg-slate-50`); `[brand]` from `APP_BRAND`; `[sidebar-footer]` for health indicator; `[toolbar-actions]` for logout button. Desktop-optimized.
- **Operator layout** (TASK004): `ShellComponent` without `[items]` → `hasSidebar = false`, no sidebar rendered; bottom navigation bar added separately. Mobile-optimized, max-width 480px.

### 5. Typed HTTP Services
Each API domain has a dedicated service in `core/api/`. Services return `Observable<T>` using `HttpClient`.
All request/response types are defined in `core/models/`.

### 6. JWT Authentication
- `AuthService` stores JWT in `localStorage`, exposes `currentUser` / `isAuthenticated` / `token` signals
- `authInterceptor` attaches `Authorization: Bearer <token>` header to all API requests
- On 401 response → `AuthService.logout()` → redirect to `/login`
- Mock login implementation until real endpoint is available
- Login endpoint will be `POST /api/auth/login` (future)

### 7. Role-Based Access Control
Two roles: `ADMIN` and `OPERATOR`.
- `/admin/**` routes protected by `roleGuard(['ADMIN'])`
- `/operator/**` routes protected by `roleGuard(['OPERATOR', 'ADMIN'])` (admin can access operator too)
- `/login` is public
- `/` redirects based on role

### 8. Environment Configuration
API base URL stored in Angular environment files:
- `src/environments/environment.ts` → `apiUrl: 'http://localhost:8080'`
- `src/environments/environment.prod.ts` → production URL

### 9. Error Handling
Global HTTP error interceptor catches API errors and maps `ProblemDetail` responses to user-friendly messages.
Components handle loading/error states using signals.

### 10. i18n

Angular's built-in `@angular/localize` for internationalization. **English as source language** (default strings in
`$localize` calls). Russian translation provided via `src/locale/messages.ru.xlf`.
All UI labels extracted to `src/locale/messages.xlf` via `npm run i18n:extract`.
Components must be reachable from `AppComponent` for the compiler to extract their `$localize` calls.

### 11. QR Code Scanning
`html5-qrcode` library for reading QR codes from phone camera. Shared reusable component in
`shared/components/qr-scanner/`. Used by operator module for equipment UID input and return flow.

### 12. Health Indicator Component Architecture

The health indicator follows a strict smart/dumb decomposition with a pure builder function:

- **`HealthIndicatorComponent`** (smart): injects `HealthService` + `LOCALE_ID`; owns `isOpen` signal,
  `dotClass`, `checkedAt`, `lines` computed; passes `lines` to tooltip via input binding
- **`HealthTooltipComponent`** (dumb): `lines = input.required<TooltipLine[]>()`; single `@for` loop;
  `separator: true` on a line renders a `<div class="border-t">` divider before it
- **`HealthTooltipLineComponent`** (dumb): `label = input.required<string>()`, `value = input<string|null|undefined>()`;
  hides itself entirely with `@if (value() != null)`
- **`buildTooltipLines(health, serverInfo, lastChecked, locale?)`** (pure function, no Angular):
  - Param 1: `Pick<HealthResponse, 'status'|'components'> & { error? }` — status + components + error
  - Param 2: `ServerInfo | null` — from `/actuator/info`
  - Param 3: `Date | null` — raw timestamp, formatted internally
  - Returns `TooltipLine[]` with component entries appended when status ≠ UP
- CDK `cdkConnectedOverlay` (not `matTooltip`) renders a real component on hover
- `TOOLTIP_LINE_LABELS` and `TooltipLineId` live in `health-tooltip-lines.builder.ts` (sole consumer)

## Routing Strategy

```
/login                         → LoginComponent (public)
/                              → redirect based on role (ADMIN → /admin, OPERATOR → /operator)
/admin                         → AdminLayoutComponent (role guard: ADMIN)
  /admin/equipment             → EquipmentListComponent (default)
  /admin/equipment-types       → EquipmentTypeListComponent
  /admin/equipment-statuses    → EquipmentStatusListComponent
  /admin/tariffs               → TariffListComponent
  /admin/customers             → CustomerListComponent
  /admin/rentals               → RentalHistoryComponent
  /admin/payments              → PaymentHistoryComponent
  /admin/users                 → UserPlaceholderComponent
/operator                      → OperatorLayoutComponent (role guard: OPERATOR, ADMIN)
  /operator/dashboard          → DashboardComponent (default)
  /operator/rental/new         → RentalCreateComponent
  /operator/return             → ReturnComponent
```

All feature routes are lazy-loaded via `loadChildren` / `loadComponent`.

## Design Patterns in Use

### Repository / Service Pattern
HTTP calls encapsulated in injectable services. Components never call `HttpClient` directly.

### Smart / Dumb Component Split
- **Smart (container) components**: inject services, manage state, handle navigation
- **Dumb (presentational) components**: receive `input()`, emit `output()`, no service injection

### Reactive Forms
Use Angular `ReactiveFormsModule` for all forms (customer search, rental creation, return input).

### Dialog Pattern (Admin)
Admin CRUD uses `MatDialog` for create/edit forms. List component opens dialog, dialog calls service,
returns result to list for refresh.

### Stepper Pattern (Operator)
Rental creation uses `mat-vertical-stepper` (linear mode) with one child component per step.

## Component Relationships

```
AppComponent
└── RouterOutlet
    ├── LoginComponent
    ├── AdminLayoutComponent (smart)
    │   └── ShellComponent
    │       ├── SidebarComponent
    │       │   ├── AppBrandComponent
    │       │   └── SidebarNavItemComponent (×8)
    │       ├── AppToolbarComponent
    │       │   └── ToggleButtonComponent → ButtonComponent
    │       ├── [sidebar-footer] → HealthIndicatorComponent
    │       │   ├── HealthTooltipComponent
    │       │   │   └── HealthTooltipLineComponent (×n)
    │       │   └── [buildTooltipLines() — pure function]
    │       ├── [toolbar-actions] → LogoutButtonComponent → ButtonComponent
    │       └── router-outlet
    │           ├── EquipmentListComponent → EquipmentDialogComponent
    │           ├── EquipmentTypeListComponent → EquipmentTypeDialogComponent
    │           ├── EquipmentStatusListComponent → EquipmentStatusDialogComponent
    │           ├── TariffListComponent → TariffDialogComponent
    │           ├── CustomerListComponent → CustomerDialogComponent
    │           ├── RentalHistoryComponent
    │           ├── PaymentHistoryComponent
    │           └── UserPlaceholderComponent
    └── OperatorLayoutComponent (smart — TASK004)
        └── ShellComponent (no items → no sidebar)
            ├── AppToolbarComponent
            │   └── ToggleButtonComponent → ButtonComponent
            ├── [toolbar-actions] → LogoutButtonComponent → ButtonComponent
            ├── [sidebar-footer] → HealthIndicatorComponent
            └── router-outlet
                ├── DashboardComponent (smart)
                ├── RentalCreateComponent (smart, stepper)
                │   ├── CustomerStepComponent (dumb)
                │   ├── EquipmentStepComponent (dumb) → QrScannerComponent
                │   ├── DurationStepComponent (dumb)
                │   └── ConfirmStepComponent (dumb)
                └── ReturnComponent (smart)
                    ├── QrScannerComponent (shared)
                    └── CostBreakdownComponent (dumb)

Shared:
├── ShellComponent (used by AdminLayoutComponent + OperatorLayoutComponent)
├── SidebarComponent (used by ShellComponent when items provided)
├── AppToolbarComponent (used by ShellComponent)
├── AppBrandComponent (used by SidebarComponent)
├── ButtonComponent (used by ToggleButtonComponent + LogoutButtonComponent)
├── ToggleButtonComponent (used by AppToolbarComponent)
├── LogoutButtonComponent (used by layout consumers via toolbar-actions slot)
├── SidebarNavItemComponent (used by SidebarComponent)
├── QrScannerComponent (used by EquipmentStepComponent + ReturnComponent)
└── HealthIndicatorComponent
    ├── HealthTooltipComponent
    │   └── HealthTooltipLineComponent (×n)
    └── [buildTooltipLines() — pure function, no Angular]
```

## API Integration Patterns

### Fast Path Rental
Single `POST /api/rentals` with full payload → creates ACTIVE rental immediately.

### Draft Path Rental
1. `POST /api/rentals/draft` → creates DRAFT
2. `PATCH /api/rentals/{id}` (JSON Patch) → fill customer, equipment, duration
3. `PATCH /api/rentals/{id}` with `status=ACTIVE` → activate rental
4. `POST /api/rentals/{id}/prepayments` → record payment

### Return Flow
`POST /api/rentals/return` with `equipmentUid` or `equipmentId` → calculates cost, records additional payment,
closes rental.

### Tariff Auto-Selection
`GET /api/tariffs/selection?equipmentType=bike&durationMinutes=120` → returns best tariff for the combination.

### Authentication
`POST /api/auth/login` (future) → returns JWT. Until then, mock implementation in `AuthService`.

