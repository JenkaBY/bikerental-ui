# bikerental-ui — Angular 21 multi-project Point-of-Sale workspace for a bike rental shop

## Summary

- Angular 21 workspace with three independently deployable SPAs (`gateway`, `admin`, `operator`) and one shared Angular library (`shared`); no SSR.
- `gateway` is the landing shell linking to the other two apps; `admin` is a desktop-first CRUD management area; `operator` is a mobile-first rental workflow.
- All three SPAs communicate exclusively with a Spring Boot backend REST API via an auto-generated OpenAPI client housed in the `shared` library; no direct database access.
- API client code is auto-generated from the backend OpenAPI spec via `ng-openapi`; raw API types never leave `core/api/generated/` or `core/mappers/`.
- Global signal-based state stores (`shared/core/state/`) hold lookup data; all component-level state uses Angular signals with `OnPush` change detection.

---

## Projects and Folder Map

- PATH: `projects/gateway/`
  PURPOSE: Landing-page SPA — displays navigation cards to Admin and Operator
  ENTRY_FILES: `projects/gateway/src/main.ts`, `projects/gateway/src/app/app.config.ts`, `projects/gateway/src/app/app.routes.ts`

- PATH: `projects/admin/`
  PURPOSE: Desktop-first CRUD management SPA for all domain entities
  ENTRY_FILES: `projects/admin/src/main.ts`, `projects/admin/src/app/app.config.ts`, `projects/admin/src/app/app.routes.ts`

- PATH: `projects/operator/`
  PURPOSE: Mobile-first rental workflow SPA — rental creation, QR return, active-rentals dashboard
  ENTRY_FILES: `projects/operator/src/main.ts`, `projects/operator/src/app/app.config.ts`, `projects/operator/src/app/app.routes.ts`

- PATH: `projects/shared/`
  PURPOSE: Angular library — generated API client, domain mappers, domain models, signal stores, shared UI components, i18n constants, interceptors, and health monitoring
  ENTRY_FILES: `projects/shared/src/public-api.ts`

- PATH: `projects/shared/src/core/api/generated/`
  PURPOSE: Auto-generated Angular services and models from backend OpenAPI spec; never edit manually
  ENTRY_FILES: `services/`, `models/`, `providers.ts`, `tokens/`, `utils/`

- PATH: `projects/shared/src/core/mappers/`
  PURPOSE: Pure static converter classes (`XyzMapper.fromResponse` / `XyzMapper.toRequest`)
  ENTRY_FILES: `equipment-type.mapper.ts`, `equipment-status.mapper.ts`, `equipment.mapper.ts`, `tariff.mapper.ts`, `pricing-type.mapper.ts`, `page.mapper.ts`, `customer.mapper.ts`

- PATH: `projects/shared/src/core/models/`
  PURPOSE: UI domain model interfaces — the only types components import
  ENTRY_FILES: `equipment-type.model.ts`, `equipment-status.model.ts`, `equipment.model.ts`, `tariff.model.ts`, `common.model.ts`

- PATH: `projects/shared/src/core/state/`
  PURPOSE: Signal-based in-memory stores and lookup initializer facade
  ENTRY_FILES: `equipment-type.store.ts`, `equipment-status.store.ts`, `equipment.store.ts`, `tariff.store.ts`, `pricing-type.store.ts`, `lookup-initializer.facade.ts`

- PATH: `projects/shared/src/core/health/`
  PURPOSE: Backend health polling and signal-based result exposure
  ENTRY_FILES: `health.service.ts`, `health-poller.service.ts`, `health.model.ts`

- PATH: `projects/shared/src/core/interceptors/`
  PURPOSE: Global HTTP error interception and user notification
  ENTRY_FILES: `error.interceptor.ts`, `error.service.ts`

- PATH: `projects/shared/src/shared/components/`
  PURPOSE: Reusable standalone UI components consumed by all three apps
  ENTRY_FILES: `shell/`, `sidebar/`, `app-toolbar/`, `app-brand/`, `bottom-nav/`, `button/`, `toggle-button/`, `logout-button/`, `cancel-button/`, `save-button/`, `sidebar-nav-item/`, `dashboard-card/`, `equipment-type-dropdown/`, `qr-scanner/`, `health-indicator/`, `layout-mode-toggle/`

- PATH: `projects/shared/src/environments/`
  PURPOSE: Environment-specific configuration values shared by all three apps
  ENTRY_FILES: `environment.ts`, `environment.prod.ts`

- PATH: `projects/shared/config/`
  PURPOSE: ng-openapi code-generation configuration
  ENTRY_FILES: `openapi.config.ts`

- PATH: `.github/workflows/`
  PURPOSE: CI/CD pipeline (lint, type-check, test, build, deploy to GitHub Pages)
  ENTRY_FILES: `build-and-deploy.yml`

---

## Components

COMPONENT_NAME: GatewayApp
TYPE: Gateway
PURPOSE: Root component for the gateway application — mounts the router outlet.
RESPONSIBILITIES:

- Mounts the primary `<router-outlet>` for gateway routes
  SOURCE: `projects/gateway/src/app/app.ts`
  CALLS:
- NONE
  CALLED_BY:
- Bootstrap (`projects/gateway/src/main.ts`)

---

COMPONENT_NAME: HomeComponent
TYPE: API
PURPOSE: Landing page displaying navigation cards for Admin, Operator Mobile, and Operator Desktop.
RESPONSIBILITIES:

- Renders three `DashboardCardComponent` tiles
- On card select, performs a hard navigation via `document.location.href` to the target sub-app URL (cross-app navigation, not in-SPA routing)
  SOURCE: `projects/gateway/src/app/home/home.component.ts`
  CALLS:
- DashboardCardComponent — to render each navigation tile
  CALLED_BY:
- Angular Router (gateway route `''`)

---

COMPONENT_NAME: AdminApp
TYPE: Gateway
PURPOSE: Root component for the admin application — mounts the router outlet.
RESPONSIBILITIES:

- Mounts the primary `<router-outlet>` for admin routes
  SOURCE: `projects/admin/src/app/app.ts`
  CALLS:
- NONE
  CALLED_BY:
- Bootstrap (`projects/admin/src/main.ts`)

---

COMPONENT_NAME: AdminLayoutComponent
TYPE: Gateway
PURPOSE: Desktop shell for all Admin sub-routes with sidenav and toolbar.
RESPONSIBILITIES:

- Renders `ShellComponent` with an 8-item sidebar navigation
- Defines the admin nav items (Equipment, Equipment Types, Equipment Statuses, Tariffs, Customers, Rentals, Payments, Users)
- Embeds `HealthIndicatorComponent` in the sidebar footer
- Provides `LogoutButtonComponent` in the toolbar
- Manages sidenav open/closed state via `signal()`
  SOURCE: `projects/admin/src/app/layout/admin-layout.component.ts`
  CALLS:
- ShellComponent — to provide sidenav layout chrome
- HealthIndicatorComponent — to display backend health in sidebar footer
- LogoutButtonComponent — to render logout action in toolbar
  CALLED_BY:
- Angular Router (admin route wrapper)

---

COMPONENT_NAME: OperatorApp
TYPE: Gateway
PURPOSE: Root component for the operator application — mounts the router outlet.
RESPONSIBILITIES:

- Mounts the primary `<router-outlet>` for operator routes
  SOURCE: `projects/operator/src/app/app.ts`
  CALLS:
- NONE
  CALLED_BY:
- Bootstrap (`projects/operator/src/main.ts`)

---

COMPONENT_NAME: OperatorShellWrapperComponent
TYPE: Gateway
PURPOSE: Adaptive operator shell that switches between mobile and desktop layouts based on `LayoutModeService`.
RESPONSIBILITIES:

- Renders `OperatorLayoutComponent` when `LayoutModeService.isMobile()` is true
- Renders `ShellComponent` (desktop sidenav) when desktop mode is active
- Embeds `HealthIndicatorComponent` and `LogoutButtonComponent`
- Hosts `<router-outlet>` for operator child routes
  SOURCE: `projects/operator/src/app/layout/operator-shell-wrapper.component.ts`
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
- Renders `BottomNavComponent` at the bottom with three operator nav items (Dashboard, New Rental, Return)
- Projects main content between toolbar and bottom nav
  SOURCE: `projects/operator/src/app/layout/operator-layout.component.ts`
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
- Provides status and type filter dropdowns driven by store signals
- Opens `EquipmentDialogComponent` for create and edit operations, passing current types and statuses
- Triggers store reload after dialog success
  SOURCE: `projects/admin/src/app/equipment/equipment-list.component.ts`
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

- Receives `{equipment?: Equipment, types: EquipmentType[], statuses: EquipmentStatus[]}` via `MAT_DIALOG_DATA`
- Renders a reactive form with serial number, UID, type dropdown, status dropdown, model, commissionedAt, and condition fields
- Disables status dropdown when no allowed transitions are available
- Calls `EquipmentStore.create()` or `EquipmentStore.update(id, write)` on save
- Closes `MatDialogRef` with `true` on success; shows `MatSnackBar` error on failure
  SOURCE: `projects/admin/src/app/equipment/equipment-dialog.component.ts`
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
- Renders a MatTable with columns: slug, name, description, actions
- Opens `EquipmentTypeDialogComponent` for create and edit operations
  SOURCE: `projects/admin/src/app/equipment-types/equipment-type-list.component.ts`
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

- Receives `{type?: EquipmentType}` via `MAT_DIALOG_DATA`
- Renders a reactive form with slug (disabled on edit), name, and description fields
- Applies slug pattern and max-length validators
- Calls `EquipmentTypeStore.create()` or `EquipmentTypeStore.update()` on save
- Closes dialog with `true` on success; shows snack bar on error
  SOURCE: `projects/admin/src/app/equipment-types/equipment-type-dialog.component.ts`
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
- Renders a MatTable with columns: slug, name, description, allowedTransitions (mat-chips), actions
- Opens `EquipmentStatusDialogComponent` for create and edit operations
  SOURCE: `projects/admin/src/app/equipment-statuses/equipment-status-list.component.ts`
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

- Receives `{status?: EquipmentStatus, statuses: EquipmentStatus[]}` via `MAT_DIALOG_DATA`
- Renders a reactive form with slug, name, description, and allowedTransitions (multi-select) fields
- Filters the current status from the allowed-transitions options on edit
- Calls `EquipmentStatusStore.create()` or `EquipmentStatusStore.update(slug, write)` on save
- Closes dialog with `true` on success; shows snack bar on error
  SOURCE: `projects/admin/src/app/equipment-statuses/equipment-status-dialog.component.ts`
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
- Renders columns: name, equipmentType, pricingType, validFrom, validTo, status slide-toggle, actions
- Calls `TariffStore.activate(id)` or `TariffStore.deactivate(id)` on slide-toggle changes
- Opens `TariffDialogComponent` for create and edit operations
- Calls `TariffStore.setPage()` on paginator events
  SOURCE: `projects/admin/src/app/tariffs/tariff-list.component.ts`
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

- Receives `{tariff?: Tariff}` via `MAT_DIALOG_DATA`
- Renders a reactive form with name, description, equipment type, pricing type, and date range fields
- Dynamically renders one of five pricing-params sub-components based on selected pricing type via `@switch`
- Applies per-pricing-type validators dynamically via `applyParamValidators(type)` on pricing type change
- Reads available pricing types from `PricingTypeStore`
- Calls `TariffStore.create()` or `TariffStore.update(id, write)` on save
- Closes dialog with `true` on success
  SOURCE: `projects/admin/src/app/tariffs/tariff-dialog.component.ts`
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
- Renders fields: firstHourPrice, hourlyDiscount, minimumHourlyPrice, minimumDurationMinutes, minimumDurationSurcharge
  SOURCE: `projects/admin/src/app/tariffs/degressive-hourly-params.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- TariffDialogComponent

---

COMPONENT_NAME: FlatHourlyParamsComponent
TYPE: API
PURPOSE: Pricing-parameter sub-form for the FLAT_HOURLY tariff type.
RESPONSIBILITIES:

- Accepts a `FormGroup` input and renders the hourlyPrice field
  SOURCE: `projects/admin/src/app/tariffs/flat-hourly-params.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- TariffDialogComponent

---

COMPONENT_NAME: DailyParamsComponent
TYPE: API
PURPOSE: Pricing-parameter sub-form for the DAILY tariff type.
RESPONSIBILITIES:

- Accepts a `FormGroup` input and renders dailyPrice and overtimeHourlyPrice fields
  SOURCE: `projects/admin/src/app/tariffs/daily-params.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- TariffDialogComponent

---

COMPONENT_NAME: FlatFeeParamsComponent
TYPE: API
PURPOSE: Pricing-parameter sub-form for the FLAT_FEE tariff type.
RESPONSIBILITIES:

- Accepts a `FormGroup` input and renders issuanceFee and minimumDurationMinutes fields
  SOURCE: `projects/admin/src/app/tariffs/flat-fee-params.component.ts`
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
  SOURCE: `projects/admin/src/app/tariffs/special-params.component.ts`
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
  SOURCE: `projects/admin/src/app/customers/customer-list.component.ts`
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
  SOURCE: `projects/admin/src/app/rentals/rental-history.component.ts`
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
  SOURCE: `projects/admin/src/app/payments/payment-history.component.ts`
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
  SOURCE: `projects/admin/src/app/users/user-placeholder.component.ts`
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
  SOURCE: `projects/operator/src/app/dashboard/dashboard.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (operator default route `''`)

---

COMPONENT_NAME: RentalCreateComponent
TYPE: API
PURPOSE: Operator placeholder view for the multi-step new rental flow (TASK011 — not yet implemented).
RESPONSIBILITIES:

- Renders a placeholder message
  SOURCE: `projects/operator/src/app/rental-create/rental-create.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- Angular Router (operator route `'rental/new'`)

---

COMPONENT_NAME: ReturnComponent
TYPE: API
PURPOSE: Operator view for equipment return via QR scanner or manual UID entry (TASK012 — partially stubbed).
RESPONSIBILITIES:

- Reads `LayoutModeService.isMobile()` to decide which return UI to render
- Conditionally shows QR-scanner note (mobile) or manual-entry note (desktop)
  SOURCE: `projects/operator/src/app/return/return.component.ts`
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
- Maps status to a colour class (green UP / red DOWN / yellow OUT_OF_SERVICE / grey UNKNOWN)
- Manages overlay open/closed state via `signal()`
- Renders `HealthTooltipComponent` inside a CDK connected overlay
  SOURCE: `projects/shared/src/shared/components/health-indicator/health-indicator.component.ts`
  CALLS:
- HealthService — to read status, components, and last-checked signals
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
  SOURCE: `projects/shared/src/shared/components/equipment-type-dropdown/equipment-type-dropdown.component.ts`
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

- Renders a `MatSidenav` with nav items, sidebar footer slot, and main content slot
- Projects `AppToolbarComponent` at the top with optional toolbar action slot
- Inputs: items (NavItem[]), brand, title, sidenavOpened, showModeToggle
- Outputs: toggleSidebar, logout
  SOURCE: `projects/shared/src/shared/components/shell/shell.component.ts`
  CALLS:
- SidebarComponent — to render the sidenav body with nav items
- AppToolbarComponent — to render the top toolbar
  CALLED_BY:
- AdminLayoutComponent
- OperatorShellWrapperComponent (desktop mode)

---

COMPONENT_NAME: SidebarComponent
TYPE: API
PURPOSE: Sidenav body component rendering a branded header and navigation list.
RESPONSIBILITIES:

- Accepts items (NavItem[]) and brand inputs
- Renders `AppBrandComponent` followed by a `mat-nav-list` of `SidebarNavItemComponent` entries
  SOURCE: `projects/shared/src/shared/components/sidebar/sidebar.component.ts`
  CALLS:
- AppBrandComponent — to render the branded header
- SidebarNavItemComponent — one per nav item
  CALLED_BY:
- ShellComponent

---

COMPONENT_NAME: AppToolbarComponent
TYPE: API
PURPOSE: Reusable top toolbar with title, optional menu-toggle, optional desktop-mode toggle, and action slot.
RESPONSIBILITIES:

- Renders a sticky `MatToolbar` with configurable title and toggle buttons
- Navigates to home when the title is clicked via `AppBrandComponent`
- Emits `toggleSidebar` output when the toggle button is pressed
- Conditionally renders `LayoutModeToggleComponent`
- Inputs: title (required), showToggle, menuOpen, showLogout, showDesktopModeToggle
- Outputs: toggleSidebar, logout
  SOURCE: `projects/shared/src/shared/components/app-toolbar/app-toolbar.component.ts`
  CALLS:
- LayoutModeToggleComponent — to render the mode-toggle button when `showDesktopModeToggle` is true
  CALLED_BY:
- ShellComponent
- OperatorLayoutComponent

---

COMPONENT_NAME: BottomNavComponent
TYPE: API
PURPOSE: Mobile bottom navigation bar rendering a row of `BottomNavItemComponent` tiles.
RESPONSIBILITIES:

- Accepts a required `NavItem[]` input
- Renders one `BottomNavItemComponent` per nav item in a `<nav>` row
  SOURCE: `projects/shared/src/shared/components/bottom-nav/bottom-nav.component.ts`
  CALLS:
- BottomNavItemComponent — to render each navigation item
  CALLED_BY:
- OperatorLayoutComponent

---

COMPONENT_NAME: BottomNavItemComponent
TYPE: API
PURPOSE: Single bottom navigation tile with icon and label.
RESPONSIBILITIES:

- Accepts a required `NavItem` input
- Renders a flex-column tile (icon + label) with `routerLink` and `routerLinkActive` highlighting
  SOURCE: `projects/shared/src/shared/components/bottom-nav/bottom-nav-item.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- BottomNavComponent

---

COMPONENT_NAME: AppBrandComponent
TYPE: API
PURPOSE: Branded header button with bike icon and brand text.
RESPONSIBILITIES:

- Accepts a brand input
- Renders a clickable button with a `directions_bike` icon and brand name
- Navigates to home when clicked via Angular Router
  SOURCE: `projects/shared/src/shared/components/app-brand/app-brand.component.ts`
  CALLS:
- Angular Router — to navigate home on click
  CALLED_BY:
- SidebarComponent

---

COMPONENT_NAME: DashboardCardComponent
TYPE: API
PURPOSE: Reusable clickable card for dashboard navigation tiles.
RESPONSIBILITIES:

- Accepts title, description, ariaLabel, and disabled inputs
- Emits `activate` output on click when not disabled
  SOURCE: `projects/shared/src/shared/components/dashboard-card/dashboard-card.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- HomeComponent

---

COMPONENT_NAME: ButtonComponent
TYPE: API
PURPOSE: Flexible button rendering either a text button or an icon-only button.
RESPONSIBILITIES:

- Inputs: title, ariaLabel, icon, showText, disabled
- Output: activated
- If `showText` → renders `mat-button` with optional icon + text; else renders `mat-icon-button`
  SOURCE: `projects/shared/src/shared/components/button/button.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- ToggleButtonComponent
- LogoutButtonComponent

---

COMPONENT_NAME: ToggleButtonComponent
TYPE: API
PURPOSE: Button that toggles between two icon states (e.g., menu / menu_open).
RESPONSIBILITIES:

- Inputs: title, ariaLabel, showText, customIcon, pressed
- Output: toggled
- Wraps ButtonComponent; icon changes based on `pressed` state
  SOURCE: `projects/shared/src/shared/components/toggle-button/toggle-button.component.ts`
  CALLS:
- ButtonComponent — to render the underlying button
  CALLED_BY:
- AppToolbarComponent (sidebar toggle)

---

COMPONENT_NAME: LogoutButtonComponent
TYPE: API
PURPOSE: Dedicated logout action button.
RESPONSIBILITIES:

- Inputs: title ("Logout"), ariaLabel, showText, icon ("logout")
- Output: logout
- Wraps ButtonComponent
  SOURCE: `projects/shared/src/shared/components/logout-button/logout-button.component.ts`
  CALLS:
- ButtonComponent — to render the logout button
  CALLED_BY:
- AdminLayoutComponent
- OperatorShellWrapperComponent
- OperatorLayoutComponent

---

COMPONENT_NAME: SaveButtonComponent
TYPE: API
PURPOSE: Form save action button with saving-state feedback.
RESPONSIBILITIES:

- Inputs: saving, disabled
- Output: save
- Renders `mat-raised-button` (primary) with "Save" or "Saving…" text based on `saving` input
  SOURCE: `projects/shared/src/shared/components/save-button/save-button.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentTypeDialogComponent
- EquipmentStatusDialogComponent
- EquipmentDialogComponent
- TariffDialogComponent

---

COMPONENT_NAME: CancelButtonComponent
TYPE: API
PURPOSE: Form cancel action button that closes the parent MatDialog.
RESPONSIBILITIES:

- Renders `mat-button` with `mat-dialog-close` directive
  SOURCE: `projects/shared/src/shared/components/cancel-button/cancel-button.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentTypeDialogComponent
- EquipmentStatusDialogComponent
- EquipmentDialogComponent
- TariffDialogComponent

---

COMPONENT_NAME: LayoutModeToggleComponent
TYPE: API
PURPOSE: Button that toggles between mobile and desktop layout modes.
RESPONSIBILITIES:

- Reads `LayoutModeService.isMobile()` to determine the current icon (smartphone vs desktop_windows)
- Calls `LayoutModeService.toggle()` on click
  SOURCE: `projects/shared/src/shared/components/layout-mode-toggle/layout-mode-toggle.component.ts`
  CALLS:
- LayoutModeService — to read mode and call `toggle()`
  CALLED_BY:
- AppToolbarComponent

---

COMPONENT_NAME: SidebarNavItemComponent
TYPE: API
PURPOSE: Single navigation link in the admin sidenav.
RESPONSIBILITIES:

- Accepts a `NavItem` input (`label`, `route`, `icon`)
- Renders `<a mat-list-item [routerLink]="item.route" routerLinkActive>`
  SOURCE: `projects/shared/src/shared/components/sidebar-nav-item/sidebar-nav-item.component.ts`
  CALLS:
- NONE
  CALLED_BY:
- SidebarComponent

---

COMPONENT_NAME: EquipmentTypeStore
TYPE: Store
PURPOSE: Signal-based in-memory store for the equipment-type lookup list.
RESPONSIBILITIES:

- Loads all equipment types from the backend via `EquipmentTypesService`
- Applies `EquipmentTypeMapper.fromResponse()` to convert raw API responses
- Exposes `types()`, `typesForEquipment()` (filters `isForSpecialTariff`), `loading()`, `saving()` computed signals
- Handles create and update operations; sorts result by slug
  SOURCE: `projects/shared/src/core/state/equipment-type.store.ts`
  CALLS:
- EquipmentTypesService (generated) — to call `GET /equipment-types`, `POST`, `PUT`
- EquipmentTypeMapper — to convert API responses and write objects
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
- Handles create and slug-keyed update operations
  SOURCE: `projects/shared/src/core/state/equipment-status.store.ts`
  CALLS:
- EquipmentStatusesService (generated) — to call `GET /equipment-statuses`, `POST`, `PUT`
- EquipmentStatusMapper — to convert API responses and write objects
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

- Loads paginated equipment from the backend via `EquipmentService`
- Applies `EquipmentMapper.fromResponse()` using lookup data from `EquipmentTypeStore` and `EquipmentStatusStore`
- Exposes `items()`, `totalItems()`, `loading()`, `saving()`, filter, and page signals
- Handles create and ID-keyed update operations with automatic reload
  SOURCE: `projects/shared/src/core/state/equipment.store.ts`
  CALLS:
- EquipmentService (generated) — to call `GET /equipments` (with pagination/filters), `POST`, `PUT`
- EquipmentTypeStore — to read types for response mapping
- EquipmentStatusStore — to read statuses for response mapping
- EquipmentMapper — to convert API responses and write objects
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
- Handles create, ID-keyed update, activate, and deactivate operations
  SOURCE: `projects/shared/src/core/state/tariff.store.ts`
  CALLS:
- TariffsService (generated) — to call `GET /tariffs`, `POST`, `PUT`, `PATCH /activate`, `PATCH /deactivate`
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
  SOURCE: `projects/shared/src/core/state/pricing-type.store.ts`
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
- Admin app loads: equipment statuses, equipment types, pricing types
- Operator app loads: equipment statuses and equipment types only
  SOURCE: `projects/shared/src/core/state/lookup-initializer.facade.ts`
  CALLS:
- EquipmentStatusStore — `load()` when `config.loadEquipmentStatus`
- EquipmentTypeStore — `load()` when `config.loadEquipmentType`
- PricingTypeStore — `load()` when `config.loadPricingType`
  CALLED_BY:
- Admin `appConfig` `provideAppInitializer` (`projects/admin/src/app/app.config.ts`)
- Operator `appConfig` `provideAppInitializer` (`projects/operator/src/app/app.config.ts`)

---

COMPONENT_NAME: HealthService
TYPE: Service
PURPOSE: Polls the Spring Boot Actuator `/health` and `/info` endpoints and exposes results as signals.
RESPONSIBILITIES:

- Calls `GET /actuator/health` via `HttpClient`; sets `status`, `components`, `lastChecked`, `error` signals
- Calls `GET /actuator/info` on first successful UP response to populate `serverInfo` signal
  SOURCE: `projects/shared/src/core/health/health.service.ts`
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
  SOURCE: `projects/shared/src/core/health/health-poller.service.ts`
  CALLS:
- HealthService — to invoke `checkHealth()` on each tick
  CALLED_BY:
- Admin `appConfig` `provideAppInitializer` (`projects/admin/src/app/app.config.ts`)
- Operator `appConfig` `provideAppInitializer` (`projects/operator/src/app/app.config.ts`)

---

COMPONENT_NAME: ErrorService
TYPE: Service
PURPOSE: Centralises HTTP error handling by storing the last error as a signal and displaying a snack bar.
RESPONSIBILITIES:

- Parses `HttpErrorResponse` into a structured `AppError`
- Sets `lastError` signal with the parsed error; provides `clearError()` mutator
- Opens `MatSnackBar` with a human-readable message keyed by HTTP status and 4-second duration
  SOURCE: `projects/shared/src/core/interceptors/error.service.ts`
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
  SOURCE: `projects/shared/src/core/interceptors/error.interceptor.ts`
  CALLS:
- ErrorService — to handle and display HTTP errors
  CALLED_BY:
- Admin and Operator `appConfig` via `withInterceptors([errorInterceptor])`

---

COMPONENT_NAME: LayoutModeService
TYPE: Service
PURPOSE: Persists and exposes the current layout mode (`mobile` | `desktop`) using signals and `localStorage`.
RESPONSIBILITIES:

- Reads initial mode from `localStorage` key `bikerental.operatorLayoutMode`
- Exposes `mode()`, `isMobile()` computed signals
- Provides `setMode()` and `toggle()` mutators; persists changes to `localStorage`
  SOURCE: `projects/shared/src/core/layout-mode.service.ts`
  CALLS:
- NONE
  CALLED_BY:
- OperatorShellWrapperComponent
- ReturnComponent
- LayoutModeToggleComponent

---

COMPONENT_NAME: TariffMapper
TYPE: Utility
PURPOSE: Pure static class that converts between generated API types and domain `Tariff` / `TariffWrite`.
RESPONSIBILITIES:

- `fromResponse(r, equipmentTypes, pricingTypes)` — maps `TariffV2Response` to `Tariff`; resolves slugs against lookup arrays
- `toRequest(w)` — maps `TariffWrite` to `TariffV2Request`; converts `Date` to ISO string via `DateUtil`
  SOURCE: `projects/shared/src/core/mappers/tariff.mapper.ts`
  CALLS:
- NONE (pure static methods)
  CALLED_BY:
- TariffStore

---

COMPONENT_NAME: EquipmentTypeMapper
TYPE: Utility
PURPOSE: Pure static class that converts between generated API types and domain `EquipmentType` / `EquipmentTypeWrite`.
RESPONSIBILITIES:

- `fromResponse(r)` — maps `EquipmentTypeResponse` to `EquipmentType`
- `toCreateRequest(w)` — maps write model to `EquipmentTypeRequest`
- `toUpdateRequest(w)` — maps write model to `EquipmentTypeUpdateRequest`
  SOURCE: `projects/shared/src/core/mappers/equipment-type.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentTypeStore

---

COMPONENT_NAME: EquipmentStatusMapper
TYPE: Utility
PURPOSE: Pure static class that converts between generated API types and domain `EquipmentStatus` / `EquipmentStatusWrite`.
RESPONSIBILITIES:

- `fromResponse(r)` — maps API response to `EquipmentStatus` domain model
- `toCreateRequest(w)` / `toUpdateRequest(w)` — map write models to API request types
  SOURCE: `projects/shared/src/core/mappers/equipment-status.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentStatusStore

---

COMPONENT_NAME: EquipmentMapper
TYPE: Utility
PURPOSE: Pure static class that converts between generated API types and domain `Equipment` / `EquipmentWrite`.
RESPONSIBILITIES:

- `fromResponse(r, types, statuses)` — maps `EquipmentResponse` to `Equipment`; resolves type and status slugs against lookup arrays
- `toRequest(w)` — maps `EquipmentWrite` to `EquipmentRequest`
  SOURCE: `projects/shared/src/core/mappers/equipment.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentStore

---

COMPONENT_NAME: PricingTypeMapper
TYPE: Utility
PURPOSE: Pure static class converting `PricingTypeResponse` to `PricingType` domain model.
RESPONSIBILITIES:

- `fromResponse(r)` — maps a single pricing-type API response to the domain model
  SOURCE: `projects/shared/src/core/mappers/pricing-type.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- PricingTypeStore

---

COMPONENT_NAME: PageMapper
TYPE: Utility
PURPOSE: Generic pure static class that maps paginated API responses to domain page objects.
RESPONSIBILITIES:

- `fromResponse<R, D>(response, mapItem: (R) => D)` — maps `Page<R>` API shape to `Page<D>` domain shape
  SOURCE: `projects/shared/src/core/mappers/page.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- EquipmentStore
- TariffStore

---

COMPONENT_NAME: TariffsService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Tariffs API controller.
RESPONSIBILITIES:

- Provides typed Observable-based methods: `getAllTariffs`, `getTariffById`, `createTariff`, `updateTariff`, `activateTariff`, `deactivateTariff`, `getPricingTypes`, `getActiveTariffForEquipment`, `calculateCost`
- Attaches `CLIENT_CONTEXT_TOKEN_DEFAULT` to each request for interceptor routing
  SOURCE: `projects/shared/src/core/api/generated/services/tariffs.service.ts`
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
  SOURCE: `projects/shared/src/core/api/generated/services/equipment.service.ts`
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
  SOURCE: `projects/shared/src/core/api/generated/services/equipmentTypes.service.ts`
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
  SOURCE: `projects/shared/src/core/api/generated/services/equipmentStatuses.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- EquipmentStatusStore

---

COMPONENT_NAME: CustomersService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Customers API controller.
RESPONSIBILITIES:

- Provides typed methods: `getById(id)`, `updateCustomer(id, request)`, `search(filters)`
  SOURCE: `projects/shared/src/core/api/generated/services/customers.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- NONE (CustomerListComponent is a placeholder; CustomerStore not yet created)

---

COMPONENT_NAME: RentalsService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Rentals API controller.
RESPONSIBILITIES:

- Provides typed methods: `getRentals(pageable, status?, customerId?, equipmentUid?)`, `createRental(request)`, `returnEquipment(request)`
  SOURCE: `projects/shared/src/core/api/generated/services/rentals.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- NONE (RentalHistoryComponent is a placeholder; RentalStore not yet created)

---

COMPONENT_NAME: FinanceService (generated)
TYPE: Service
PURPOSE: Auto-generated Angular HTTP service for the Finance (payments) API controller.
RESPONSIBILITIES:

- Provides typed methods: `recordWithdrawal`, `recordDeposit`, `getBalance`, `getTransactionHistory`
  SOURCE: `projects/shared/src/core/api/generated/services/finance.service.ts`
  CALLS:
- HttpClient — to execute HTTP requests
  CALLED_BY:
- NONE (PaymentHistoryComponent is a placeholder; PaymentStore not yet created)

---

COMPONENT_NAME: DefaultBaseInterceptor (generated)
TYPE: Gateway
PURPOSE: Routes HTTP requests to client-specific interceptors based on `HttpContext` token presence.
RESPONSIBILITIES:

- Checks each request for `CLIENT_CONTEXT_TOKEN_DEFAULT` in `HttpContext`
- If present, chains registered `HTTP_INTERCEPTORS_DEFAULT` interceptors
- If absent, passes request through unchanged
  SOURCE: `projects/shared/src/core/api/generated/utils/base-interceptor.ts`
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
  SOURCE: `projects/shared/src/core/api/generated/utils/date-transformer.ts`
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
SOURCE: `projects/admin/src/app/tariffs/tariff-list.component.ts`

STEP 2: TariffDialogComponent → PricingTypeStore
OPERATION: `pricingTypes()` (read signal)
PURPOSE: Dialog reads available pricing types to populate the pricing-type dropdown
SOURCE: `projects/admin/src/app/tariffs/tariff-dialog.component.ts`

STEP 3: TariffDialogComponent → EquipmentTypeDropdownComponent
OPERATION: reactive form binding via `formControlName="equipmentTypeSlug"`
PURPOSE: Dropdown component reads `EquipmentTypeStore.types()` to populate the equipment-type selector
SOURCE: `projects/admin/src/app/tariffs/tariff-dialog.component.ts`

STEP 4: TariffDialogComponent → TariffStore
OPERATION: `create(tariffWrite)`
PURPOSE: On form submit, dialog delegates persistence to the store
SOURCE: `projects/admin/src/app/tariffs/tariff-dialog.component.ts`

STEP 5: TariffStore → TariffMapper
OPERATION: `TariffMapper.toRequest(write)`
PURPOSE: Store converts `TariffWrite` domain object to `TariffV2Request` API shape
SOURCE: `projects/shared/src/core/state/tariff.store.ts`

STEP 6: TariffStore → TariffsService (generated)
OPERATION: `createTariff(tariffV2Request)`
PURPOSE: Store delegates HTTP POST to the generated service
SOURCE: `projects/shared/src/core/state/tariff.store.ts`

STEP 7: TariffsService (generated) → HttpClient
OPERATION: `POST /tariffs`
PURPOSE: Sends the JSON request body to the backend REST API
SOURCE: `projects/shared/src/core/api/generated/services/tariffs.service.ts`

STEP 8: TariffStore → TariffMapper
OPERATION: `TariffMapper.fromResponse(response, equipmentTypes, pricingTypes)`
PURPOSE: Store maps the API response back to the `Tariff` domain model for in-memory update
SOURCE: `projects/shared/src/core/state/tariff.store.ts`

STEP 9: TariffDialogComponent → MatDialogRef
OPERATION: `close(true)`
PURPOSE: Dialog signals success to its caller
SOURCE: `projects/admin/src/app/tariffs/tariff-dialog.component.ts`

STEP 10: TariffListComponent → TariffStore
OPERATION: `load()` (triggered by `afterClosed()` result `=== true`)
PURPOSE: List component reloads the tariff table to reflect the newly created entry
SOURCE: `projects/admin/src/app/tariffs/tariff-list.component.ts`

---

### Use-Case: Application startup — lookup data pre-loading (Admin app)

STEP 1: Bootstrap → AdminApp
OPERATION: `bootstrapApplication(App, appConfig)`
PURPOSE: Angular bootstraps the admin application and executes all registered providers
SOURCE: `projects/admin/src/main.ts`

STEP 2: appConfig → HealthPollerService
OPERATION: `inject(HealthPollerService)` inside `provideAppInitializer`
PURPOSE: Eagerly instantiates the health poller so backend health is checked immediately
SOURCE: `projects/admin/src/app/app.config.ts`

STEP 3: HealthPollerService → HealthService
OPERATION: `checkHealth()` (once at construction + every 300 000 ms)
PURPOSE: Initiates the first health check against `GET /actuator/health`
SOURCE: `projects/shared/src/core/health/health-poller.service.ts`

STEP 4: HealthService → HttpClient
OPERATION: `GET /actuator/health`
PURPOSE: Fetches current backend health status and component details
SOURCE: `projects/shared/src/core/health/health.service.ts`

STEP 5: appConfig → LookupInitializerFacade
OPERATION: `inject(LookupInitializerFacade)` then `init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: true }).subscribe()`
PURPOSE: Triggers background loading of all lookup entities needed by form dropdowns
SOURCE: `projects/admin/src/app/app.config.ts`

STEP 6: LookupInitializerFacade → EquipmentStatusStore
OPERATION: `load()`
PURPOSE: Fetches all equipment statuses from the backend and populates the store's signal
SOURCE: `projects/shared/src/core/state/lookup-initializer.facade.ts`

STEP 7: LookupInitializerFacade → EquipmentTypeStore
OPERATION: `load()`
PURPOSE: Fetches all equipment types from the backend and populates the store's signal
SOURCE: `projects/shared/src/core/state/lookup-initializer.facade.ts`

STEP 8: LookupInitializerFacade → PricingTypeStore
OPERATION: `load()`
PURPOSE: Fetches all pricing types from the backend and populates the store's signal
SOURCE: `projects/shared/src/core/state/lookup-initializer.facade.ts`

---

## Communication Channels

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/actuator/health` (default: `http://localhost:8080/actuator/health`)
  SOURCE: `projects/shared/src/core/health/health.service.ts`
  NOTES: GET; polled every 300 000 ms; returns Spring Boot Actuator `HealthResponse`

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/actuator/info`
  SOURCE: `projects/shared/src/core/health/health.service.ts`
  NOTES: GET; called once on first successful UP response

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/equipment-types` (and sub-paths)
  SOURCE: `projects/shared/src/core/api/generated/services/equipmentTypes.service.ts`
  NOTES: GET (list), POST (create), PUT /{slug} (update)

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/equipment-statuses` (and sub-paths)
  SOURCE: `projects/shared/src/core/api/generated/services/equipmentStatuses.service.ts`
  NOTES: GET (list), POST (create), PUT /{slug} (update)

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/equipments` (and sub-paths)
  SOURCE: `projects/shared/src/core/api/generated/services/equipment.service.ts`
  NOTES: GET with pagination + filters, GET /{id}, POST, PUT /{id}

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/tariffs` (and sub-paths)
  SOURCE: `projects/shared/src/core/api/generated/services/tariffs.service.ts`
  NOTES: GET (paginated list), GET /{id}, POST, PUT /{id}, PATCH /{id}/activate, PATCH /{id}/deactivate, GET /pricing-types, GET /active, POST /calculate

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/customers` (and sub-paths)
  SOURCE: `projects/shared/src/core/api/generated/services/customers.service.ts`
  NOTES: Not yet wired to any feature component; CustomerStore not created

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/rentals` (and sub-paths)
  SOURCE: `projects/shared/src/core/api/generated/services/rentals.service.ts`
  NOTES: Not yet wired to any feature component; RentalStore not created

- CHANNEL_TYPE: HTTP
  ENDPOINT: `{environment.apiUrl}/finance` (and sub-paths)
  SOURCE: `projects/shared/src/core/api/generated/services/finance.service.ts`
  NOTES: Not yet wired to any feature component; PaymentStore not created

---

## Dependency Registration and Wiring

DI_CONTAINER: Angular built-in DI (Ivy)
REGISTRATION_FILE: Each SPA has its own `app.config.ts` — `projects/admin/src/app/app.config.ts`, `projects/operator/src/app/app.config.ts`, `projects/gateway/src/app/app.config.ts`

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
  LOCATION: `projects/admin/src/app/app.config.ts`, `projects/operator/src/app/app.config.ts`

- LIFETIME: Singleton (root)
  ABSTRACTION: `LookupInitializerFacade`
  CONCRETE: `LookupInitializerFacade`
  SNIPPET:
  ```typescript
  provideAppInitializer(() => {
    const facade = inject(LookupInitializerFacade);
    facade.init({ loadEquipmentStatus: true, loadEquipmentType: true, loadPricingType: true }).subscribe();
    return Promise.resolve();
  })
  ```
  LOCATION: `projects/admin/src/app/app.config.ts`; operator omits `loadPricingType`

- LIFETIME: Singleton (environment)
  ABSTRACTION: `BASE_PATH_DEFAULT` (InjectionToken)
  CONCRETE: `environment.apiUrl` value string
  SNIPPET:
  ```typescript
  provideDefaultClient({ basePath: environment.apiUrl })
  ```
  LOCATION: `projects/admin/src/app/app.config.ts`, `projects/operator/src/app/app.config.ts`

- LIFETIME: Request (function interceptor)
  ABSTRACTION: HTTP interceptor
  CONCRETE: `errorInterceptor` function
  SNIPPET:
  ```typescript
  provideHttpClient(withInterceptors([errorInterceptor]))
  ```
  LOCATION: `projects/admin/src/app/app.config.ts`, `projects/operator/src/app/app.config.ts`

- LIFETIME: Value
  ABSTRACTION: `LOCALE_ID`
  CONCRETE: `environment.defaultLocale` (`'ru'`)
  LOCATION: all three `app.config.ts` files

- LIFETIME: Value
  ABSTRACTION: `APP_BRAND` (InjectionToken)
  CONCRETE: `environment.brand` string (`'Bike Rental'`)
  LOCATION: all three `app.config.ts` files

All stores and services (`EquipmentTypeStore`, `EquipmentStatusStore`, `EquipmentStore`, `TariffStore`, `PricingTypeStore`, `HealthService`, `HealthPollerService`, `LayoutModeService`, `ErrorService`, `LookupInitializerFacade`) use `@Injectable({ providedIn: 'root' })` and are therefore singletons. All generated API services also use `providedIn: 'root'`.

---

## Configuration and Secrets

- SOURCE_TYPE: config file
  KEYS: `production`, `apiUrl`, `healthPollIntervalMs`, `defaultLocale`, `brand`
  SENSITIVE: NO
  LOCATION: `projects/shared/src/environments/environment.ts` (development), `projects/shared/src/environments/environment.prod.ts` (production); consumed by all three apps

- SOURCE_TYPE: environment variable (CI/CD)
  KEYS: `GITHUB_TOKEN` (implicit via GitHub Actions), deployment token for GitHub Pages
  SENSITIVE: YES
  LOCATION: `.github/workflows/build-and-deploy.yml`

- SOURCE_TYPE: config file
  KEYS: `input` (OpenAPI spec URL), `output` (generated code directory), `dateType`, `enumStyle`, `generateServices`
  SENSITIVE: NO
  LOCATION: `projects/shared/config/openapi.config.ts`

- SOURCE_TYPE: browser localStorage
  KEYS: `bikerental.operatorLayoutMode`
  SENSITIVE: NO
  LOCATION: `projects/shared/src/core/layout-mode.service.ts` (runtime browser localStorage)

---

## Persistence and Data Access

DATABASE: NONE — the Angular SPAs have no direct database access
DATA_ACCESS: All data access is via REST HTTP calls to the Spring Boot backend through auto-generated services
MIGRATIONS_PATH: NONE
REPOSITORY_PATTERN: NO

Client-side state is held in signal-based stores (`projects/shared/src/core/state/`) for the lifetime of the browser session. No IndexedDB, WebSQL, or other client-side persistence is used beyond `localStorage` for layout mode.

---

## Patterns and Architecture Notes

- PATTERN: Three-Layer Data Pipeline (API Generated → Mapper → Domain Model → Component)
  EVIDENCE: `projects/shared/src/core/mappers/tariff.mapper.ts`, `projects/shared/src/core/state/tariff.store.ts`, `projects/admin/src/app/tariffs/tariff-list.component.ts`
  SNIPPET:
  ```typescript
  // TariffStore.load()
  map((response) => ({
    items: (response.items ?? []).map((r) =>
      TariffMapper.fromResponse(r, equipmentTypes, pricingTypes)),
  }))
  ```

- PATTERN: Signal-based reactive state (Angular Signals)
  EVIDENCE: `projects/shared/src/core/state/equipment-type.store.ts`
  SNIPPET:
  ```typescript
  private readonly _types = signal<EquipmentType[]>([]);
  readonly types = computed(() => this._types());
  ```

- PATTERN: Admin CRUD via MatDialog (open → afterClosed → reload)
  EVIDENCE: `projects/admin/src/app/tariffs/tariff-list.component.ts`
  SNIPPET:
  ```typescript
  this.dialog.open(TariffDialogComponent, { data: {} })
    .afterClosed().pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(result => { if (result) this.load(); });
  ```

- PATTERN: ControlValueAccessor for reactive-form dropdown integration
  EVIDENCE: `projects/shared/src/shared/components/equipment-type-dropdown/equipment-type-dropdown.component.ts`
  SNIPPET:
  ```typescript
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EquipmentTypeDropdownComponent), multi: true }]
  ```

- PATTERN: Facade for multi-store initialisation
  EVIDENCE: `projects/shared/src/core/state/lookup-initializer.facade.ts`
  SNIPPET:
  ```typescript
  return forkJoin(tasks).pipe(tap(() => console.log('Lookup initialization started...')));
  ```

- PATTERN: Adaptive layout (mobile/desktop) via LayoutModeService signal
  EVIDENCE: `projects/operator/src/app/layout/operator-shell-wrapper.component.ts`
  SNIPPET:
  ```typescript
  @if (layout.isMobile()) { <app-operator-layout> } @else { <app-shell> }
  ```

- PATTERN: Generated API client (ng-openapi) with client-scoped HTTP context token routing
  EVIDENCE: `projects/shared/src/core/api/generated/utils/base-interceptor.ts`, `projects/shared/src/core/api/generated/providers.ts`
  SNIPPET:
  ```typescript
  if (!req.context.has(this.clientContextToken)) { return next.handle(req); }
  ```

- PATTERN: Cross-app navigation via `document.location.href`
  EVIDENCE: `projects/gateway/src/app/home/home.component.ts`
  SNIPPET: Each SPA is an independent bundle with its own router scope; the gateway uses hard URL navigation to `/admin/` and `/operator/` rather than Angular Router.

---

## Security and Operational Considerations

AUTHN_AUTHZ:

- Mechanism: NONE — authentication (TASK002) is intentionally unimplemented; all routes are currently open across all three apps
- Config location: `projects/admin/src/app/app.routes.ts`, `projects/operator/src/app/app.routes.ts` (no route guards present)

KNOWN_RISKS:

- All admin and operator routes are publicly accessible; no route guards or auth interceptors
- `environment.ts` hard-codes `apiUrl: 'http://localhost:8080'`; plain HTTP in development
- `ErrorService` surfaces raw HTTP error messages in snack bar notifications, which may expose internal server details
- `DateInterceptor.transformDates` uses an untyped intermediary during date scanning; acceptable only inside auto-generated code

OBSERVABILITY:

- Logging: `console.log` / `console.error` only; no structured logging framework
- Health endpoint: `HealthService` polls `GET /actuator/health` and exposes status via signals; visualised by `HealthIndicatorComponent` in all three app toolbars/sidebars
- Error surfacing: `ErrorService` signals + `MatSnackBar` notifications for all HTTP errors
- No application-level metrics or distributed tracing

DEPLOYMENT:

- No Dockerfile or docker-compose in the repository
- CI/CD: `.github/workflows/build-and-deploy.yml` — quality (lint + type-check) → test (Vitest per project + coverage merge) → build (gateway + admin + operator) → deploy to GitHub Pages
- Build outputs: `dist/gateway/`, `dist/admin/`, `dist/operator/` (Angular CLI `ng build --project=*`)
- GitHub Actions Node version: 24; package manager: npm with `npm ci`
