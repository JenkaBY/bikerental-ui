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
│       └── qr-scanner/               # QR code scanner (camera-based, html5-qrcode)
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

### 4. Two Layout Shells
- **Admin layout**: `mat-sidenav-container` with permanent side nav (260px) + toolbar. Desktop-optimized.
- **Operator layout**: `mat-toolbar` at top + fixed bottom navigation bar (3 tabs). Mobile-optimized, max-width 480px.

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
Angular's built-in `@angular/localize` for internationalization. Russian as the default language.
All UI labels extracted to translation files from the start.

### 11. QR Code Scanning
`html5-qrcode` library for reading QR codes from phone camera. Shared reusable component in
`shared/components/qr-scanner/`. Used by operator module for equipment UID input and return flow.

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
    │   ├── mat-sidenav (navigation)
    │   ├── mat-toolbar (title + logout)
    │   └── router-outlet
    │       ├── EquipmentListComponent → EquipmentDialogComponent
    │       ├── EquipmentTypeListComponent → EquipmentTypeDialogComponent
    │       ├── EquipmentStatusListComponent → EquipmentStatusDialogComponent
    │       ├── TariffListComponent → TariffDialogComponent
    │       ├── CustomerListComponent → CustomerDialogComponent
    │       ├── RentalHistoryComponent
    │       ├── PaymentHistoryComponent
    │       └── UserPlaceholderComponent
    └── OperatorLayoutComponent (smart)
        ├── mat-toolbar (title + logout)
        ├── router-outlet
        │   ├── DashboardComponent (smart)
        │   ├── RentalCreateComponent (smart, stepper)
        │   │   ├── CustomerStepComponent (dumb)
        │   │   ├── EquipmentStepComponent (dumb) → QrScannerComponent
        │   │   ├── DurationStepComponent (dumb)
        │   │   └── ConfirmStepComponent (dumb)
        │   └── ReturnComponent (smart)
        │       ├── QrScannerComponent (shared)
        │       └── CostBreakdownComponent (dumb)
        └── bottom-nav (3 tabs)

Shared:
└── QrScannerComponent (used by EquipmentStepComponent + ReturnComponent)
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

