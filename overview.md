# bikerental-ui — Angular 21 Point-of-Sale UI for a bike rental shop

## Summary

- Single-page Angular 21 application providing two lazy-loaded feature areas: Admin (desktop CRUD) and Operator (mobile rental workflow).
- Primary technologies: Angular 21, Angular Material 3 (M3), Angular CDK, Tailwind CSS 4, RxJS 7, Vitest, TypeScript 5.
- Communicates exclusively with a Spring Boot backend REST API; no direct database access; no SSR.
- API client code is auto-generated from an OpenAPI spec via `ng-openapi`; raw API types never leave `core/api/generated/` or `core/mappers/`.
- Global signal-based state stores (`core/state/`) hold lookup data; all component-level state uses Angular signals with `OnPush` change detection.

---

## Projects and Folder Map

- PATH: `src/main.ts`
  PURPOSE: Application bootstrap entry point
  ENTRY_FILES: `main.ts`

- PATH: `src/app/app.config.ts`
  PURPOSE: Root `ApplicationConfig` — registers all providers, HTTP client, interceptors, locale, and app initializer
  ENTRY_FILES: `app.config.ts`

- PATH: `src/app/app.routes.ts`
  PURPOSE: Root route table; lazy-loads admin, operator, auth, and home feature modules
  ENTRY_FILES: `app.routes.ts`

- PATH: `src/app/app.ts`
  PURPOSE: Root `App` component (router outlet)
  ENTRY_FILES: `app.ts`

- PATH: `src/app/core/`
  PURPOSE: Cross-cutting services, generated API client, state stores, mappers, domain models, and interceptors
  ENTRY_FILES: `core/layout-mode.service.ts`, `core/health/`, `core/interceptors/`, `core/state/`, `core/mappers/`, `core/models/`, `core/api/generated/`

- PATH: `src/app/features/admin/`
  PURPOSE: Desktop-first CRUD management feature area
  ENTRY_FILES: `admin/admin.routes.ts`, `admin/layout/admin-layout.component.ts`

- PATH: `src/app/features/operator/`
  PURPOSE: Mobile-first rental creation and equipment return feature area
  ENTRY_FILES: `operator/operator.routes.ts`, `operator/layout/operator-shell-wrapper.component.ts`

- PATH: `src/app/features/auth/`
  PURPOSE: Authentication placeholder (TASK002 — not yet implemented)
  ENTRY_FILES: `auth/login.component.ts`

- PATH: `src/app/features/home/`
  PURPOSE: Landing page with navigation cards to Admin and Operator
  ENTRY_FILES: `home/home.component.ts`

- PATH: `src/app/shared/`
  PURPOSE: Reusable UI components, pipes, validators, and constants shared across features
  ENTRY_FILES: `shared/components/`, `shared/constant/labels.ts`, `shared/validators/`

- PATH: `src/environments/`
  PURPOSE: Environment-specific configuration values
  ENTRY_FILES: `environment.ts`

- PATH: `src/config/`
  PURPOSE: ng-openapi code-generation configuration
  ENTRY_FILES: `openapi.config.ts`

- PATH: `.github/workflows/`
  PURPOSE: CI/CD pipeline (lint, test, build, deploy to GitHub Pages)
  ENTRY_FILES: `build-and-deploy.yml`

---

## Components

COMPONENT_NAME: App
TYPE: Gateway
PURPOSE: Root component that hosts the Angular router outlet.
RESPONSIBILITIES:

- Mounts the primary `<router-outlet>` for all route-based views
  SOURCE: `src/app/app.ts`
  CALLS:
- NONE
  CALLED_BY:
- Bootstrap (`src/main.ts`)

---

COMPONENT_NAME: HomeComponent
TYPE: API
PURPOSE: Landing page allowing navigation to Admin or Operator areas.
RESPONSIBILITIES:

- Renders a grid of `DashboardCardComponent` tiles for Admin and Operator
- Sets `LayoutModeService` mode based on the selected card target
- Navigates to `/admin` or `/operator` via Angular Router
  SOURCE: `src/app/features/home/home.component.ts`
  CALLS:
- LayoutModeService — to set layout mode before navigating
- DashboardCardComponent — to render each navigation tile
  CALLED_BY:
- Angular Router (route `''`)

---

COMPONENT_NAME: LoginComponent
TYPE: API
PURPOSE: Placeholder login page (auth not yet implemented — TASK002).
RESPONSIBILITIES:

- Renders a placeholder element; no business logic
  SOURCE: `src/app/features/auth/login.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (route `'login'`)

---

COMPONENT_NAME: AdminLayoutComponent
TYPE: Gateway
PURPOSE: Desktop shell for all Admin sub-routes with sidenav and toolbar.
RESPONSIBILITIES:

- Renders `ShellComponent` with a sidebar and top toolbar
- Defines the 8-item admin navigation (`NavItem[]`)
- Embeds `HealthIndicatorComponent` in the sidebar footer
- Provides `LogoutButtonComponent` in the toolbar
- Manages sidenav open/closed state via `signal()`
  SOURCE: `src/app/features/admin/layout/admin-layout.component.ts`
  CALLS:
- ShellComponent — to provide sidenav layout chrome
- HealthIndicatorComponent — to display backend health in sidebar footer
- LogoutButtonComponent — to render logout action in toolbar
  CALLED_BY:
- Angular Router (admin route wrapper)

---

COMPONENT_NAME: OperatorShellWrapperComponent
TYPE: Gateway
PURPOSE: Adaptive operator shell that switches between mobile and desktop layouts based on `LayoutModeService`.
RESPONSIBILITIES:

- Renders `OperatorLayoutComponent` when `LayoutModeService.isMobile()` is true
- Renders `ShellComponent` (desktop sidenav) when desktop mode is active
- Embeds `HealthIndicatorComponent` and `LogoutButtonComponent`
- Hosts `<router-outlet>` for operator child routes
  SOURCE: `src/app/features/operator/layout/operator-shell-wrapper.component.ts`
  CALLS:
- LayoutModeService — to read `isMobile()` signal
- OperatorLayoutComponent — for mobile layout rendering
- ShellComponent — for desktop layout rendering
- HealthIndicatorComponent — to embed health status
- LogoutButtonComponent — to render logout action
  CALLED_BY:
- Angular Router (operator route wrapper)

---

COMPONENT_NAME: OperatorLayoutComponent
TYPE: API
PURPOSE: Mobile-first layout frame for the Operator feature area.
RESPONSIBILITIES:

- Renders `AppToolbarComponent` at the top with title and action buttons
- Renders `BottomNavComponent` at the bottom with operator nav items
- Projects main content between toolbar and bottom nav
  SOURCE: `src/app/features/operator/layout/operator-layout.component.ts`
  CALLS:
- AppToolbarComponent — to render the top toolbar
- BottomNavComponent — to render the bottom navigation bar
- HealthIndicatorComponent — embedded inside toolbar
- LogoutButtonComponent — embedded inside toolbar
  CALLED_BY:
- OperatorShellWrapperComponent

---

COMPONENT_NAME: EquipmentListComponent
TYPE: API
PURPOSE: Admin table view for equipment management with filtering, pagination, and create/edit dialogs.
RESPONSIBILITIES:

- Reads paginated equipment list from `EquipmentStore`
- Provides status and type filter dropdowns
- Opens `EquipmentDialogComponent` for create and edit operations
- Triggers store reload after dialog success
  SOURCE: `src/app/features/admin/equipment/equipment-list.component.ts`
  CALLS:
- EquipmentStore — to load, filter, and page equipment data
- EquipmentTypeStore — to provide type filter options
- EquipmentStatusStore — to provide status filter options
- MatDialog → EquipmentDialogComponent — to open create/edit form
  CALLED_BY:
- Angular Router (admin route `'equipment'`)

---

COMPONENT_NAME: EquipmentDialogComponent
TYPE: API
PURPOSE: Modal form for creating or editing a single equipment item.
RESPONSIBILITIES:

- Renders a reactive form with serial number, UID, model, type, status, and commissioned-at fields
- Calls `EquipmentStore.create()` or `EquipmentStore.update()` on save
- Closes `MatDialogRef` with `true` on success; shows `MatSnackBar` error on failure
  SOURCE: `src/app/features/admin/equipment/equipment-dialog.component.ts`
  CALLS:
- EquipmentStore — to persist create/update operations
- MatDialogRef — to close the dialog
- MatSnackBar — to surface error notifications
- EquipmentTypeDropdownComponent — for reactive-form type selection
  CALLED_BY:
- EquipmentListComponent

---

COMPONENT_NAME: EquipmentTypeListComponent
TYPE: API
PURPOSE: Admin table view for equipment type management.
RESPONSIBILITIES:

- Reads equipment types from `EquipmentTypeStore`
- Opens `EquipmentTypeDialogComponent` for create and edit operations
  SOURCE: `src/app/features/admin/equipment-types/equipment-type-list.component.ts`
  CALLS:
- EquipmentTypeStore — to read type list and loading state
- MatDialog → EquipmentTypeDialogComponent — to open create/edit form
  CALLED_BY:
- Angular Router (admin route `'equipment-types'`)

---

COMPONENT_NAME: EquipmentTypeDialogComponent
TYPE: API
PURPOSE: Modal form for creating or editing an equipment type.
RESPONSIBILITIES:

- Renders a reactive form with slug, name, and description fields
- Applies slug pattern and max-length validators
- Calls `EquipmentTypeStore.create()` or `EquipmentTypeStore.update()` on save
- Closes dialog with `true` on success; shows snack bar on error
  SOURCE: `src/app/features/admin/equipment-types/equipment-type-dialog.component.ts`
  CALLS:
- EquipmentTypeStore — to persist create/update operations
- MatDialogRef — to close the dialog
- MatSnackBar — to surface error notifications
  CALLED_BY:
- EquipmentTypeListComponent

---

COMPONENT_NAME: EquipmentStatusListComponent
TYPE: API
PURPOSE: Admin table view for equipment status management.
RESPONSIBILITIES:

- Reads equipment statuses from `EquipmentStatusStore`
- Opens `EquipmentStatusDialogComponent` for create and edit operations
  SOURCE: `src/app/features/admin/equipment-statuses/equipment-status-list.component.ts`
  CALLS:
- EquipmentStatusStore — to read status list and loading state
- MatDialog → EquipmentStatusDialogComponent — to open create/edit form
  CALLED_BY:
- Angular Router (admin route `'equipment-statuses'`)

---

COMPONENT_NAME: EquipmentStatusDialogComponent
TYPE: API
PURPOSE: Modal form for creating or editing an equipment status.
RESPONSIBILITIES:

- Renders a reactive form with slug, name, description, and allowed-transitions fields
- Calls `EquipmentStatusStore.create()` or `EquipmentStatusStore.update()` on save
- Closes dialog with `true` on success; shows snack bar on error
  SOURCE: `src/app/features/admin/equipment-statuses/equipment-status-dialog.component.ts`
  CALLS:
- EquipmentStatusStore — to persist create/update operations
- MatDialogRef — to close the dialog
- MatSnackBar — to surface error notifications
  CALLED_BY:
- EquipmentStatusListComponent

---

COMPONENT_NAME: TariffListComponent
TYPE: API
PURPOSE: Admin table view for tariff management with pagination and active/inactive toggle.
RESPONSIBILITIES:

- Reads paginated tariff list from `TariffStore`
- Renders name, equipment type, pricing type, valid dates, and active toggle columns
- Opens `TariffDialogComponent` for create and edit operations
- Calls `TariffStore.setPage()` on paginator events
- Calls `TariffStore.toggleActive()` on slide-toggle changes
  SOURCE: `src/app/features/admin/tariffs/tariff-list.component.ts`
  CALLS:
- TariffStore — to load tariff data and toggle active status
- MatDialog → TariffDialogComponent — to open create/edit form
- MatSnackBar — to surface error notifications
  CALLED_BY:
- Angular Router (admin route `'tariffs'`)

---

COMPONENT_NAME: TariffDialogComponent
TYPE: API
PURPOSE: Modal form for creating or editing a tariff, including dynamic pricing-parameter sub-forms.
RESPONSIBILITIES:

- Renders a reactive form with name, description, equipment type, pricing type, and date range fields
- Dynamically renders one of five pricing-params sub-components based on selected pricing type
- Reads available pricing types from `PricingTypeStore`
- Calls `TariffStore.create()` or `TariffStore.update()` on save
- Closes dialog with `true` on success
  SOURCE: `src/app/features/admin/tariffs/tariff-dialog.component.ts`
  CALLS:
- TariffStore — to persist create/update operations
- PricingTypeStore — to populate the pricing-type dropdown
- EquipmentTypeDropdownComponent — for reactive-form type selection
- DegressiveHourlyParamsComponent — pricing sub-form (DEGRESSIVE_HOURLY)
- FlatHourlyParamsComponent — pricing sub-form (FLAT_HOURLY)
- DailyParamsComponent — pricing sub-form (DAILY)
- FlatFeeParamsComponent — pricing sub-form (FLAT_FEE)
- SpecialParamsComponent — pricing sub-form (SPECIAL)
- MatDialogRef — to close the dialog
- MatSnackBar — to surface error notifications
  CALLED_BY:
- TariffListComponent

---

COMPONENT_NAME: DegressiveHourlyParamsComponent
TYPE: API
PURPOSE: Pricing-parameter sub-form for the DEGRESSIVE_HOURLY tariff type.
RESPONSIBILITIES:

- Accepts a `FormGroup` input and a description input
- Renders fields specific to degressive hourly pricing (e.g., rates per tier)
  SOURCE: `src/app/features/admin/tariffs/degressive-hourly-params.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- TariffDialogComponent

---

COMPONENT_NAME: FlatHourlyParamsComponent
TYPE: API
PURPOSE: Pricing-parameter sub-form for the FLAT_HOURLY tariff type.
RESPONSIBILITIES:

- Accepts a `FormGroup` input and renders flat hourly rate field
  SOURCE: `src/app/features/admin/tariffs/flat-hourly-params.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- TariffDialogComponent

---

COMPONENT_NAME: DailyParamsComponent
TYPE: API
PURPOSE: Pricing-parameter sub-form for the DAILY tariff type.
RESPONSIBILITIES:

- Accepts a `FormGroup` input and renders daily rate field
  SOURCE: `src/app/features/admin/tariffs/daily-params.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- TariffDialogComponent

---

COMPONENT_NAME: FlatFeeParamsComponent
TYPE: API
PURPOSE: Pricing-parameter sub-form for the FLAT_FEE tariff type.
RESPONSIBILITIES:

- Accepts a `FormGroup` input and renders flat fee amount field
  SOURCE: `src/app/features/admin/tariffs/flat-fee-params.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- TariffDialogComponent

---

COMPONENT_NAME: SpecialParamsComponent
TYPE: API
PURPOSE: Pricing-parameter sub-form for the SPECIAL tariff type (display-only description).
RESPONSIBILITIES:

- Accepts a description input; renders no editable fields for SPECIAL pricing
  SOURCE: `src/app/features/admin/tariffs/special-params.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- TariffDialogComponent

---

COMPONENT_NAME: CustomerListComponent
TYPE: API
PURPOSE: Admin placeholder view for customer management (TASK009 — not yet implemented).
RESPONSIBILITIES:

- Renders a placeholder message
  SOURCE: `src/app/features/admin/customers/customer-list.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (admin route `'customers'`)

---

COMPONENT_NAME: RentalHistoryComponent
TYPE: API
PURPOSE: Admin placeholder view for rental history (TASK009 — not yet implemented).
RESPONSIBILITIES:

- Renders a placeholder message
  SOURCE: `src/app/features/admin/rentals/rental-history.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (admin route `'rentals'`)

---

COMPONENT_NAME: PaymentHistoryComponent
TYPE: API
PURPOSE: Admin placeholder view for payment history (TASK009 — not yet implemented).
RESPONSIBILITIES:

- Renders a placeholder message
  SOURCE: `src/app/features/admin/payments/payment-history.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (admin route `'payments'`)

---

COMPONENT_NAME: UserPlaceholderComponent
TYPE: API
PURPOSE: Admin placeholder view for user management (TASK009 — not yet implemented).
RESPONSIBILITIES:

- Renders a placeholder message
  SOURCE: `src/app/features/admin/users/user-placeholder.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (admin route `'users'`)

---

COMPONENT_NAME: DashboardComponent
TYPE: API
PURPOSE: Operator placeholder view for active rentals dashboard (TASK010 — not yet implemented).
RESPONSIBILITIES:

- Renders a placeholder message
  SOURCE: `src/app/features/operator/dashboard/dashboard.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (operator route `'dashboard'`)

---

COMPONENT_NAME: RentalCreateComponent
TYPE: API
PURPOSE: Operator placeholder view for the multi-step new rental flow (TASK011 — not yet implemented).
RESPONSIBILITIES:

- Renders a placeholder message
  SOURCE: `src/app/features/operator/rental-create/rental-create.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (operator route `'rental/new'`)

---

COMPONENT_NAME: ReturnComponent
TYPE: API
PURPOSE: Operator view for equipment return via QR scanner or manual UID entry.
RESPONSIBILITIES:

- Reads `LayoutModeService.isMobile()` to decide which return UI to render
- Conditionally shows QR-scanner note (mobile) or manual-entry note (desktop)
  SOURCE: `src/app/features/operator/return/return.component.ts`
  CALLS:
- LayoutModeService — to read current layout mode
  CALLED_BY:
- Angular Router (operator route `'return'`)

---

COMPONENT_NAME: HealthIndicatorComponent
TYPE: API
PURPOSE: Status dot widget that displays backend health and shows a CDK overlay tooltip with component details.
RESPONSIBILITIES:

- Reads `HealthService` signals for status, last-checked time, and component details
- Maps status to a colour class (green/red/yellow/grey)
- Manages overlay open/closed state via `signal()`
- Renders `HealthTooltipComponent` inside a CDK connected overlay
  SOURCE: `src/app/shared/components/health-indicator/health-indicator.component.ts`
  CALLS:
- HealthService — to read status, components, and last-checked signals
- HealthTooltipComponent — to render the overlay tooltip content
  CALLED_BY:
- AdminLayoutComponent
- OperatorShellWrapperComponent
- OperatorLayoutComponent

---

COMPONENT_NAME: EquipmentTypeDropdownComponent
TYPE: API
PURPOSE: Reusable `ControlValueAccessor` dropdown for selecting an equipment type in reactive forms.
RESPONSIBILITIES:

- Reads available types from `EquipmentTypeStore`
- Implements `ControlValueAccessor` for seamless `formControlName` integration
- Filters types by `showAll` input (all vs. non-special-tariff only)
  SOURCE: `src/app/shared/components/equipment-type-dropdown/equipment-type-dropdown.component.ts`
  CALLS:
- EquipmentTypeStore — to read available equipment types and loading state
  CALLED_BY:
- TariffDialogComponent
- EquipmentDialogComponent

---

COMPONENT_NAME: ShellComponent
TYPE: API
PURPOSE: Generic desktop layout shell with sidenav and toolbar via content projection.
RESPONSIBILITIES:

- Renders a `MatSidenav` with optional sidebar
- Projects `AppToolbarComponent` at the top
- Projects sidebar footer content and toolbar action content via named slots
  SOURCE: `src/app/shared/components/shell/shell.component.ts`
  CALLS:
- SidebarComponent — to render the sidenav body with nav items
- AppToolbarComponent — to render the top toolbar
  CALLED_BY:
- AdminLayoutComponent
- OperatorShellWrapperComponent (desktop mode)

---

COMPONENT_NAME: AppToolbarComponent
TYPE: API
PURPOSE: Reusable top toolbar with title, optional menu-toggle, optional desktop-mode toggle, and action slot.
RESPONSIBILITIES:

- Renders a `MatToolbar` with configurable title and toggle buttons
- Navigates to `'/'` when the title is clicked
- Emits `toggleSidebar` output when the toggle button is pressed
- Conditionally renders `LayoutModeToggleComponent`
  SOURCE: `src/app/shared/components/app-toolbar/app-toolbar.component.ts`
  CALLS:
- LayoutModeToggleComponent — to render the mode-toggle button when `showDesktopModeToggle` is true
- Angular Router — to navigate home on title click
  CALLED_BY:
- ShellComponent
- OperatorLayoutComponent

---

COMPONENT_NAME: BottomNavComponent
TYPE: API
PURPOSE: Mobile bottom navigation bar rendering a row of `BottomNavItemComponent` tiles.
RESPONSIBILITIES:

- Accepts a `NavItem[]` input
- Renders one `BottomNavItemComponent` per nav item
  SOURCE: `src/app/shared/components/bottom-nav/bottom-nav.component.ts`
  CALLS:
- BottomNavItemComponent — to render each navigation item
  CALLED_BY:
- OperatorLayoutComponent

---

COMPONENT_NAME: DashboardCardComponent
TYPE: API
PURPOSE: Reusable clickable card for dashboard navigation tiles.
RESPONSIBILITIES:

- Accepts title, description, aria-label, and disabled inputs
- Emits `activate` output on click when not disabled
  SOURCE: `src/app/shared/components/dashboard-card/dashboard-card.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- HomeComponent

---

COMPONENT_NAME: EquipmentTypeStore
TYPE: Store
PURPOSE: Signal-based in-memory store for the equipment-type lookup list.
RESPONSIBILITIES:

- Loads all equipment types from the backend via `EquipmentTypesService`
- Applies `EquipmentTypeMapper.fromResponse()` to convert raw API responses
- Exposes `types()`, `typesForEquipment()`, `loading()`, `saving()` computed signals
- Handles create and update operations, keeping in-memory list consistent
  SOURCE: `src/app/core/state/equipment-type.store.ts`
  CALLS:
- EquipmentTypesService (generated) — to call `GET /equipment-types`, `POST`, `PUT`
- EquipmentTypeMapper — to convert API responses to domain models
  CALLED_BY:
- LookupInitializerFacade
- EquipmentTypeListComponent
- EquipmentTypeDialogComponent
- EquipmentTypeDropdownComponent
- EquipmentStore
- TariffStore

---

COMPONENT_NAME: EquipmentStatusStore
TYPE: Store
PURPOSE: Signal-based in-memory store for the equipment-status lookup list.
RESPONSIBILITIES:

- Loads all equipment statuses from the backend via `EquipmentStatusesService`
- Applies `EquipmentStatusMapper.fromResponse()` to convert raw API responses
- Exposes `statuses()`, `loading()`, `saving()` computed signals
- Handles create and update operations
  SOURCE: `src/app/core/state/equipment-status.store.ts`
  CALLS:
- EquipmentStatusesService (generated) — to call `GET /equipment-statuses`, `POST`, `PUT`
- EquipmentStatusMapper — to convert API responses to domain models
  CALLED_BY:
- LookupInitializerFacade
- EquipmentStatusListComponent
- EquipmentStatusDialogComponent
- EquipmentStore

---

COMPONENT_NAME: EquipmentStore
TYPE: Store
PURPOSE: Signal-based paginated store for the equipment list with status and type filters.
RESPONSIBILITIES:

- Loads paginated equipment from the backend via generated `EquipmentService`
- Applies `EquipmentMapper.fromResponse()` using lookup data from `EquipmentTypeStore` and `EquipmentStatusStore`
- Exposes `items()`, `totalItems()`, `loading()`, `saving()`, filter, and page signals
- Handles create, update operations with automatic reload
  SOURCE: `src/app/core/state/equipment.store.ts`
  CALLS:
- EquipmentService (generated) — to call `GET /equipments` (with pagination/filters), `POST`, `PUT`
- EquipmentTypeStore — to read types for response mapping
- EquipmentStatusStore — to read statuses for response mapping
- EquipmentMapper — to convert API responses to domain models
  CALLED_BY:
- EquipmentListComponent
- EquipmentDialogComponent

---

COMPONENT_NAME: TariffStore
TYPE: Store
PURPOSE: Signal-based paginated store for the tariff list.
RESPONSIBILITIES:

- Loads paginated tariffs from the backend via `TariffsService`
- Applies `TariffMapper.fromResponse()` using lookup data from `EquipmentTypeStore` and `PricingTypeStore`
- Exposes `tariffs()`, `totalItems()`, `loading()`, `saving()`, page signals
- Handles create, update, and active-toggle operations
  SOURCE: `src/app/core/state/tariff.store.ts`
  CALLS:
- TariffsService (generated) — to call `GET /tariffs`, `POST`, `PUT`, `PATCH /status`
- EquipmentTypeStore — to read types for response mapping
- PricingTypeStore — to read pricing types for response mapping
- TariffMapper — to convert API responses and write objects
  CALLED_BY:
- TariffListComponent
- TariffDialogComponent

---

COMPONENT_NAME: PricingTypeStore
TYPE: Store
PURPOSE: Signal-based in-memory store for the pricing-type lookup list.
RESPONSIBILITIES:

- Loads pricing types from the backend via `TariffsService.getPricingTypes()`
- Applies `PricingTypeMapper.fromResponse()` to convert raw API responses
- Exposes `pricingTypes()` and `loading()` computed signals
  SOURCE: `src/app/core/state/pricing-type.store.ts`
  CALLS:
- TariffsService (generated) — to call `GET /pricing-types`
- PricingTypeMapper — to convert API responses to domain models
  CALLED_BY:
- LookupInitializerFacade
- TariffStore
- TariffDialogComponent

---

COMPONENT_NAME: LookupInitializerFacade
TYPE: Service
PURPOSE: Orchestrates background pre-loading of all lookup stores at application startup.
RESPONSIBILITIES:

- Accepts a `LookupConfig` specifying which stores to pre-load
- Calls `load()` on each configured store and merges via `forkJoin`
- Swallows individual errors to prevent blocking startup
  SOURCE: `src/app/core/state/lookup-initializer.facade.ts`
  CALLS:
- EquipmentStatusStore — `load()` when `config.loadEquipmentStatus`
- EquipmentTypeStore — `load()` when `config.loadEquipmentType`
- PricingTypeStore — `load()` when `config.loadPricingType`
  CALLED_BY:
- appConfig `provideAppInitializer` (`src/app/app.config.ts`)

---

COMPONENT_NAME: HealthService
TYPE: Service
PURPOSE: Polls the Spring Boot Actuator `/health` and `/info` endpoints and exposes results as signals.
RESPONSIBILITIES:

- Calls `GET /actuator/health` via `HttpClient`; sets `status`, `components`, `lastChecked`, `error` signals
- Calls `GET /actuator/info` on first successful UP response to populate `serverInfo` signal
  SOURCE: `src/app/core/health/health.service.ts`
  CALLS:
- HttpClient — to make HTTP GET requests to actuator endpoints
  CALLED_BY:
- HealthPollerService
- HealthIndicatorComponent

---

COMPONENT_NAME: HealthPollerService
TYPE: Worker
PURPOSE: Drives periodic health checks by triggering `HealthService.checkHealth()` on an interval.
RESPONSIBILITIES:

- Invokes `HealthService.checkHealth()` once at construction
- Sets up an RxJS `interval` (default 300 000 ms) that calls `checkHealth()` repeatedly
- Unsubscribes automatically via `takeUntilDestroyed()`
  SOURCE: `src/app/core/health/health-poller.service.ts`
  CALLS:
- HealthService — to invoke `checkHealth()` on each tick
  CALLED_BY:
- appConfig `provideAppInitializer` (`src/app/app.config.ts`)

---

COMPONENT_NAME: ErrorService
TYPE: Service
PURPOSE: Centralises HTTP error handling by storing the last error as a signal and displaying a snack bar.
RESPONSIBILITIES:

- Parses `HttpErrorResponse` into a structured `AppError`
- Sets `lastError` signal with the parsed error
- Opens `MatSnackBar` with a human-readable message and 4-second duration
  SOURCE: `src/app/core/interceptors/error.service.ts`
  CALLS:
- MatSnackBar — to surface error notification to the user
  CALLED_BY:
- errorInterceptor

---

COMPONENT_NAME: errorInterceptor
TYPE: Gateway
PURPOSE: `HttpInterceptorFn` that catches all HTTP errors and delegates them to `ErrorService`.
RESPONSIBILITIES:

- Wraps every outbound HTTP request
- On `catchError`, calls `ErrorService.handleError()` and re-throws the error
  SOURCE: `src/app/core/interceptors/error.interceptor.ts`
  CALLS:
- ErrorService — to handle and display HTTP errors
  CALLED_BY:
- appConfig via `withInterceptors([errorInterceptor])`

---

COMPONENT_NAME: LayoutModeService
TYPE: Service
PURPOSE: Persists and exposes the current layout mode (`mobile` | `desktop`) using signals and `localStorage`.
RESPONSIBILITIES:

- Reads initial mode from `localStorage` key `bikerental.operatorLayoutMode`
- Exposes `mode()`, `isMobile()` computed signals
- Provides `setMode()` and `toggle()` mutators; persists to `localStorage`
  SOURCE: `src/app/core/layout-mode.service.ts`
  CALLS:
- NONE
  CALLED_BY:
- OperatorShellWrapperComponent
- ReturnComponent
- HomeComponent
- AppToolbarComponent (indirectly via LayoutModeToggleComponent)

---

COMPONENT_NAME: TariffMapper
TYPE: Utility
PURPOSE: Pure static class that converts between generated API types and domain `Tariff` / `TariffWrite`.
RESPONSIBILITIES:

- `fromResponse(r, equipmentTypes, pricingTypes)` — maps `TariffV2Response` → `Tariff`; resolves slugs against lookup arrays
- `toRequest(w)` — maps `TariffWrite` → `TariffV2Request`; converts `Date` to ISO string
  SOURCE: `src/app/core/mappers/tariff.mapper.ts`
  CALLS:
- NONE (pure static methods)
  CALLED_BY:
- TariffStore

---

COMPONENT_NAME: EquipmentTypeMapper
TYPE: Utility
PURPOSE: Pure static class that converts between generated API types and domain `EquipmentType` / `EquipmentTypeWrite`.
RESPONSIBILITIES:

- `fromResponse(r)` — maps `EquipmentTypeResponse` → `EquipmentType`
- `toCreateRequest(w)` — maps write model to `EquipmentTypeRequest`
- `toUpdateRequest(w)` — maps write model to `EquipmentTypeUpdateRequest`
  SOURCE: `src/app/core/mappers/equipment-type.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentTypeStore

---

COMPONENT_NAME: EquipmentStatusMapper
TYPE: Utility
PURPOSE: Pure static class that converts between generated API types and domain `EquipmentStatus` / `EquipmentStatusWrite`.
RESPONSIBILITIES:

- `fromResponse(r)` — maps API response → `EquipmentStatus` domain model
- `toCreateRequest(w)` / `toUpdateRequest(w)` — map write models to API request types
  SOURCE: `src/app/core/mappers/equipment-status.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentStatusStore

---

COMPONENT_NAME: EquipmentMapper
TYPE: Utility
PURPOSE: Pure static class that converts between generated API types and domain `Equipment` / `EquipmentWrite`.
RESPONSIBILITIES:

- `fromResponse(r, types, statuses)` — maps `EquipmentResponse` → `Equipment`; resolves type and status slugs against lookup arrays
- `toRequest(w)` — maps `EquipmentWrite` → `EquipmentRequest`
  SOURCE: `src/app/core/mappers/equipment.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentStore

---

COMPONENT_NAME: PricingTypeMapper
TYPE: Utility
PURPOSE: Pure static class converting `PricingTypeResponse` → `PricingType` domain model.
RESPONSIBILITIES:

- `fromResponse(r)` — maps a single pricing-type API response to the domain model
  SOURCE: `src/app/core/mappers/pricing-type.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- PricingTypeStore

---

COMPONENT_NAME: TariffsService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Tariffs API controller.
RESPONSIBILITIES:

- Provides typed Observable-based methods: `getAllTariffs`, `getTariffById`, `createTariff`, `updateTariff`, `patchTariffStatus`, `getPricingTypes`, `getActiveTariffForEquipment`, `calculateCost`
- Attaches `CLIENT_CONTEXT_TOKEN_DEFAULT` to each request for interceptor routing
  SOURCE: `src/app/core/api/generated/services/tariffs.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- TariffStore
- PricingTypeStore

---

COMPONENT_NAME: EquipmentService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Equipment API controller.
RESPONSIBILITIES:

- Provides typed methods: `getEquipmentById`, `searchEquipments`, `createEquipment`, `updateEquipment`
- Attaches `CLIENT_CONTEXT_TOKEN_DEFAULT` to each request
  SOURCE: `src/app/core/api/generated/services/equipment.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- EquipmentStore

---

COMPONENT_NAME: EquipmentTypesService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Equipment Types API controller.
RESPONSIBILITIES:

- Provides typed methods: `getAllEquipmentTypes`, `create`, `update`
  SOURCE: `src/app/core/api/generated/services/equipmentTypes.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- EquipmentTypeStore

---

COMPONENT_NAME: EquipmentStatusesService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Equipment Statuses API controller.
RESPONSIBILITIES:

- Provides typed methods: `getAllEquipmentStatuses`, `create`, `update`
  SOURCE: `src/app/core/api/generated/services/equipmentStatuses.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- EquipmentStatusStore

---

COMPONENT_NAME: CustomersService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Customers API controller.
RESPONSIBILITIES:

- Provides typed methods for customer CRUD operations
  SOURCE: `src/app/core/api/generated/services/customers.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- NONE (CustomerListComponent is a placeholder; not yet wired)

---

COMPONENT_NAME: RentalsService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Rentals API controller.
RESPONSIBILITIES:

- Provides typed methods for rental CRUD and status operations
  SOURCE: `src/app/core/api/generated/services/rentals.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- NONE (RentalHistoryComponent is a placeholder; not yet wired)

---

COMPONENT_NAME: FinanceService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Finance (payments) API controller.
RESPONSIBILITIES:

- Provides typed methods for payment retrieval and management
  SOURCE: `src/app/core/api/generated/services/finance.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- NONE (PaymentHistoryComponent is a placeholder; not yet wired)

---

COMPONENT_NAME: DefaultBaseInterceptor (generated)
TYPE: Gateway
PURPOSE: Routes HTTP requests to client-specific interceptors based on `HttpContext` token presence.
RESPONSIBILITIES:

- Checks each request for `CLIENT_CONTEXT_TOKEN_DEFAULT` in `HttpContext`
- If present, chains registered `HTTP_INTERCEPTORS_DEFAULT` interceptors
- If absent, passes request through unchanged
  SOURCE: `src/app/core/api/generated/utils/base-interceptor.ts`
  CALLS:
- HTTP_INTERCEPTORS_DEFAULT — to apply client-specific interceptors
  CALLED_BY:
- Angular `HttpClient` pipeline (registered via `provideDefaultClient`)

---

COMPONENT_NAME: DateInterceptor (generated)
TYPE: Utility
PURPOSE: HTTP interceptor that transforms ISO-8601 date strings in responses into JavaScript `Date` objects.
RESPONSIBILITIES:

- Intercepts HTTP responses and recursively converts date strings matching `ISO_DATE_REGEX` to `Date` instances
  SOURCE: `src/app/core/api/generated/utils/date-transformer.ts`
  CALLS:
- NONE
  CALLED_BY:
- DefaultBaseInterceptor (via HTTP_INTERCEPTORS_DEFAULT chain)

---

## Component Call Sequences

### Use-Case: Admin creates a new tariff

STEP 1: TariffListComponent → MatDialog
OPERATION: `open(TariffDialogComponent, { data: {} })`
PURPOSE: User clicks "Create Tariff" button; list component opens the create dialog
SOURCE: `src/app/features/admin/tariffs/tariff-list.component.ts`

STEP 2: TariffDialogComponent → PricingTypeStore
OPERATION: `pricingTypes()` (read signal)
PURPOSE: Dialog reads available pricing types to populate the pricing-type dropdown
SOURCE: `src/app/features/admin/tariffs/tariff-dialog.component.ts`

STEP 3: TariffDialogComponent → EquipmentTypeDropdownComponent
OPERATION: reactive form binding via `formControlName="equipmentTypeSlug"`
PURPOSE: Dropdown component reads `EquipmentTypeStore.types()` to populate the equipment-type selector
SOURCE: `src/app/features/admin/tariffs/tariff-dialog.component.ts`

STEP 4: TariffDialogComponent → TariffStore
OPERATION: `create(tariffWrite)`
PURPOSE: On form submit, dialog delegates persistence to the store
SOURCE: `src/app/features/admin/tariffs/tariff-dialog.component.ts`

STEP 5: TariffStore → TariffMapper
OPERATION: `TariffMapper.toRequest(write)`
PURPOSE: Store converts `TariffWrite` domain object to `TariffV2Request` API shape
SOURCE: `src/app/core/state/tariff.store.ts`

STEP 6: TariffStore → TariffsService (generated)
OPERATION: `createTariff(tariffV2Request)`
PURPOSE: Store delegates HTTP POST to the generated service
SOURCE: `src/app/core/state/tariff.store.ts`

STEP 7: TariffsService (generated) → HttpClient
OPERATION: `POST /tariffs`
PURPOSE: Sends the JSON request body to the backend REST API
SOURCE: `src/app/core/api/generated/services/tariffs.service.ts`

STEP 8: TariffStore → TariffMapper
OPERATION: `TariffMapper.fromResponse(response, equipmentTypes, pricingTypes)`
PURPOSE: Store maps the API response back to the `Tariff` domain model for in-memory update
SOURCE: `src/app/core/state/tariff.store.ts`

STEP 9: TariffDialogComponent → MatDialogRef
OPERATION: `close(true)`
PURPOSE: Dialog signals success to its caller
SOURCE: `src/app/features/admin/tariffs/tariff-dialog.component.ts`

STEP 10: TariffListComponent → TariffStore
OPERATION: `load()` (triggered by `afterClosed()` result `=== true`)
PURPOSE: List component reloads the tariff table to reflect the newly created entry
SOURCE: `src/app/features/admin/tariffs/tariff-list.component.ts`

---

### Use-Case: Application startup — lookup data pre-loading

STEP 1: Bootstrap → appConfig
OPERATION: `bootstrapApplication(App, appConfig)`
PURPOSE: Angular bootstraps the application and executes all registered providers
SOURCE: `src/main.ts`

STEP 2: appConfig → HealthPollerService
OPERATION: `inject(HealthPollerService)` inside `provideAppInitializer`
PURPOSE: Eagerly instantiates the health poller so backend health is checked immediately
SOURCE: `src/app/app.config.ts`

STEP 3: HealthPollerService → HealthService
OPERATION: `checkHealth()` (once at construction + every 300 000 ms)
PURPOSE: Initiates the first health check against `GET /actuator/health`
SOURCE: `src/app/core/health/health-poller.service.ts`

STEP 4: HealthService → HttpClient
OPERATION: `GET /actuator/health`
PURPOSE: Fetches current backend health status and component details
SOURCE: `src/app/core/health/health.service.ts`

STEP 5: appConfig → LookupInitializerFacade
OPERATION: `inject(LookupInitializerFacade)` then `init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: true }).subscribe()`
PURPOSE: Triggers background loading of all lookup entities needed by form dropdowns
SOURCE: `src/app/app.config.ts`

STEP 6: LookupInitializerFacade → EquipmentStatusStore
OPERATION: `load()`
PURPOSE: Fetches all equipment statuses from the backend and populates the store's signal
SOURCE: `src/app/core/state/lookup-initializer.facade.ts`

STEP 7: LookupInitializerFacade → EquipmentTypeStore
OPERATION: `load()`
PURPOSE: Fetches all equipment types from the backend and populates the store's signal
SOURCE: `src/app/core/state/lookup-initializer.facade.ts`

STEP 8: LookupInitializerFacade → PricingTypeStore
OPERATION: `load()`
PURPOSE: Fetches all pricing types from the backend and populates the store's signal
SOURCE: `src/app/core/state/lookup-initializer.facade.ts`

---

## Communication Channels

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/actuator/health` (default: `http://localhost:8080/actuator/health`)
  SOURCE: `src/app/core/health/health.service.ts`
  NOTES: GET; polled every 300 000 ms; returns Spring Boot Actuator `HealthResponse`

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/actuator/info`
  SOURCE: `src/app/core/health/health.service.ts`
  NOTES: GET; called once on first successful UP response

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/equipment-types` (and sub-paths)
  SOURCE: `src/app/core/api/generated/services/equipmentTypes.service.ts`
  NOTES: GET (list), POST (create), PUT /{slug} (update); managed by generated service

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/equipment-statuses` (and sub-paths)
  SOURCE: `src/app/core/api/generated/services/equipmentStatuses.service.ts`
  NOTES: GET (list), POST (create), PUT /{slug} (update); managed by generated service

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/equipments` (and sub-paths)
  SOURCE: `src/app/core/api/generated/services/equipment.service.ts`
  NOTES: GET with pagination + filters, GET /{id}, POST, PUT /{id}; managed by generated service

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/tariffs` (and sub-paths)
  SOURCE: `src/app/core/api/generated/services/tariffs.service.ts`
  NOTES: GET (paginated list), GET /{id}, POST, PUT /{id}, PATCH /{id}/status, GET /pricing-types, GET /active, POST /calculate

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/customers` (and sub-paths)
  SOURCE: `src/app/core/api/generated/services/customers.service.ts`
  NOTES: Not yet wired to any feature component

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/rentals` (and sub-paths)
  SOURCE: `src/app/core/api/generated/services/rentals.service.ts`
  NOTES: Not yet wired to any feature component

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/finance` (and sub-paths)
  SOURCE: `src/app/core/api/generated/services/finance.service.ts`
  NOTES: Not yet wired to any feature component

---

## Dependency Registration and Wiring

DI_CONTAINER: Angular built-in DI (Ivy)
REGISTRATION_FILE: `src/app/app.config.ts` — `appConfig` constant

- LIFETIME: Singleton (root)
  ABSTRACTION: `HealthPollerService`
  CONCRETE: `HealthPollerService`
  SNIPPET:
  ```typescript
  provideAppInitializer(() => {
    inject(HealthPollerService);
    return Promise.resolve();
  })
  ```

- LIFETIME: Singleton (root)
  ABSTRACTION: `LookupInitializerFacade`
  CONCRETE: `LookupInitializerFacade`
  SNIPPET:
  ```typescript
  provideAppInitializer(() => {
    const lookupFacade = inject(LookupInitializerFacade);
    lookupFacade.init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: true }).subscribe();
    return Promise.resolve();
  })
  ```

- LIFETIME: Singleton (environment)
  ABSTRACTION: `BASE_PATH_DEFAULT` (InjectionToken)
  CONCRETE: `environment.apiUrl` value string
  SNIPPET:
  ```typescript
  provideDefaultClient({ basePath: environment.apiUrl })
  ```

- LIFETIME: Request (function interceptor)
  ABSTRACTION: HTTP interceptor
  CONCRETE: `errorInterceptor` function
  SNIPPET:
  ```typescript
  provideHttpClient(withInterceptors([errorInterceptor]))
  ```

- LIFETIME: Value
  ABSTRACTION: `LOCALE_ID`
  CONCRETE: `environment.defaultLocale` (`'ru'`)
  SNIPPET:
  ```typescript
  { provide: LOCALE_ID, useValue: environment.defaultLocale }
  ```

- LIFETIME: Value
  ABSTRACTION: `APP_BRAND` (InjectionToken)
  CONCRETE: brand string from environment or `BRAND` constant
  SNIPPET:
  ```typescript
  { provide: APP_BRAND, useValue: envBrand }
  ```

All stores (`EquipmentTypeStore`, `EquipmentStatusStore`, `EquipmentStore`, `TariffStore`, `PricingTypeStore`) use `@Injectable({ providedIn: 'root' })` and are therefore singletons. All generated services also use `providedIn: 'root'`.

---

## Configuration and Secrets

- SOURCE_TYPE: config file
  KEYS: `production`, `apiUrl`, `healthPollIntervalMs`, `defaultLocale`, `brand`
  SENSITIVE: NO
  LOCATION: `src/environments/environment.ts` (development), `src/environments/environment.prod.ts` (production)

- SOURCE_TYPE: environment variable (CI/CD)
  KEYS: `GITHUB_TOKEN` (implicit via GitHub Actions), `DEPLOY_TOKEN` (GitHub Pages deployment)
  SENSITIVE: YES
  LOCATION: `.github/workflows/build-and-deploy.yml`

- SOURCE_TYPE: config file
  KEYS: `input` (OpenAPI spec URL), `output` (generated code directory), `dateType`, `enumStyle`, `generateServices`
  SENSITIVE: NO
  LOCATION: `src/config/openapi.config.ts`

- SOURCE_TYPE: config file
  KEYS: `bikerental.operatorLayoutMode` (localStorage key)
  SENSITIVE: NO
  LOCATION: `src/app/core/layout-mode.service.ts` (runtime browser localStorage)

---

## Persistence and Data Access

DATABASE: NONE — the Angular SPA has no direct database access
DATA_ACCESS: All data access is via REST HTTP calls to the Spring Boot backend
MIGRATIONS_PATH: NONE
REPOSITORY_PATTERN: NO

Client-side state is held in signal-based stores (`core/state/`) for the lifetime of the browser session. No IndexedDB, WebSQL, or other client-side persistence is used beyond `localStorage` for layout mode.

---

## Patterns and Architecture Notes

- PATTERN: Three-Layer Data Pipeline (API → Mapper → Domain Model → Component)
  EVIDENCE: `src/app/core/mappers/tariff.mapper.ts`, `TariffStore`, `TariffListComponent`
  SNIPPET:
  ```typescript
  // TariffStore.load()
  map((response) => ({
    items: (response.items ?? []).map((r) =>
      TariffMapper.fromResponse(r, equipmentTypes, pricingTypes)),
  }))
  ```

- PATTERN: Signal-based reactive state (Angular Signals)
  EVIDENCE: `src/app/core/state/equipment-type.store.ts`
  SNIPPET:
  ```typescript
  private readonly _types = signal<EquipmentType[]>([]);
  readonly types = computed(() => this._types());
  ```

- PATTERN: Admin CRUD via MatDialog (open → afterClosed → reload)
  EVIDENCE: `src/app/features/admin/tariffs/tariff-list.component.ts`
  SNIPPET:
  ```typescript
  this.dialog.open(TariffDialogComponent, { data: {} })
    .afterClosed().pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(result => { if (result) this.load(); });
  ```

- PATTERN: ControlValueAccessor for reactive-form dropdown integration
  EVIDENCE: `src/app/shared/components/equipment-type-dropdown/equipment-type-dropdown.component.ts`
  SNIPPET:
  ```typescript
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EquipmentTypeDropdownComponent), multi: true }]
  ```

- PATTERN: Facade for multi-store initialisation
  EVIDENCE: `src/app/core/state/lookup-initializer.facade.ts`
  SNIPPET:
  ```typescript
  return forkJoin(tasks).pipe(tap(() => console.log('Lookup initialization started...')));
  ```

- PATTERN: Adaptive layout (mobile/desktop) via LayoutModeService signal
  EVIDENCE: `src/app/features/operator/layout/operator-shell-wrapper.component.ts`
  SNIPPET:
  ```typescript
  @if (layout.isMobile()) { <app-operator-layout> } @else { <app-shell> }
  ```

- PATTERN: Generated API client (ng-openapi) with client-scoped HTTP context token routing
  EVIDENCE: `src/app/core/api/generated/utils/base-interceptor.ts`, `src/app/core/api/generated/providers.ts`
  SNIPPET:
  ```typescript
  if (!req.context.has(this.clientContextToken)) { return next.handle(req); }
  ```

---

## Security and Operational Considerations

AUTHN_AUTHZ:

- Mechanism: NONE — authentication (TASK002) is intentionally unimplemented; all routes are currently open
- Config location: `src/app/app.routes.ts` (no route guards present)

KNOWN_RISKS:

- All admin and operator routes are publicly accessible; no route guards or auth interceptors
- `environment.ts` hard-codes `apiUrl: 'http://localhost:8080'`; HTTP (not HTTPS) in development
- `ErrorService` logs raw `HttpErrorResponse` messages which may surface internal server details in the snack bar
- `DateInterceptor.transformDates` uses `any` typed intermediary during date scanning; acceptable only inside auto-generated code

OBSERVABILITY:

- Logging: `console.log` / `console.error` only; no structured logging framework
- Health endpoint: `HealthService` polls `GET /actuator/health` and exposes status via signals; visualised by `HealthIndicatorComponent`
- Error surfacing: `ErrorService` signals + `MatSnackBar` notifications for all HTTP errors
- No application-level metrics or distributed tracing

DEPLOYMENT:

- No Dockerfile or docker-compose in the repository
- CI/CD: `.github/workflows/build-and-deploy.yml` — lint → test → build → deploy to GitHub Pages on push to `main`/`master`
- Build output: `dist/bikerental-ui/browser/` (Angular CLI `ng build`)
- GitHub Actions Node version: 24; package manager: npm with `npm ci`
