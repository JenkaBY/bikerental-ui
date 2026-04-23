# System Design: FR-04 — Admin Application Extraction

## 1. Architectural Overview

This story extracts the admin feature area from the monolithic `src/app/features/admin/` subtree into a self-contained `admin` application project at `projects/admin/`. The admin app gains its own bootstrap entry point, application configuration, and root routing table. All admin CRUD pages, layout shell, dialogs, and stores are moved without functional change.

The admin app is a direct consumer of `@bikerental/shared` for all cross-cutting concerns (domain models, mappers, generated API services, shared UI components, stores). No imports from `projects/gateway/` or `projects/operator/` are permitted. The backend API connection is established via `provideDefaultClient` sourced from `@bikerental/shared`, pointing to the same `environment.apiUrl`.

## 2. Impacted Components

* **`AdminLayoutComponent` (relocated to `projects/admin/`):** Moved from `src/app/features/admin/layout/`. Continues to render `ShellComponent`, `HealthIndicatorComponent`, and `LogoutButtonComponent` — all sourced from `@bikerental/shared`. Nav items and sidenav state management are unchanged.

* **All Admin Feature Components (relocated):** The following are moved to `projects/admin/src/app/`:
  * `EquipmentListComponent`, `EquipmentDialogComponent`
  * `EquipmentTypeListComponent`, `EquipmentTypeDialogComponent`
  * `EquipmentStatusListComponent`, `EquipmentStatusDialogComponent`
  * `TariffListComponent`, `TariffDialogComponent`
  * `CustomersListComponent`, `CustomerDialogComponent`
  * `RentalHistoryListComponent`
  * `PaymentHistoryListComponent`
  * `UsersPlaceholderComponent`
    All components retain identical logic, templates, and test coverage.

* **`admin` Bootstrap Entry Point:** `projects/admin/src/main.ts` bootstraps the admin root component with its own `appConfig`. Config includes: router with admin routes at root (`/`), HTTP client with error interceptor, locale, `provideDefaultClient`, lookup initializer (equipment types, statuses, pricing types), and `APP_BRAND`.

* **Admin Root Routing:** `projects/admin/src/app/app.routes.ts` declares the admin sub-routes (`tariffs`, `equipment`, `equipment-types`, `equipment-statuses`, `customers`, `rental-history`, `payment-history`, `users`) as the root-level routes of the admin app (not prefixed with `/admin`). The admin app is not aware of gateway or operator routes.

* **`shared` (Library Project):** All stores (`EquipmentStore`, `EquipmentTypeStore`, `EquipmentStatusStore`, `TariffStore`, etc.), mappers, models, and generated API services consumed by admin remain in `@bikerental/shared`. No changes to shared internals.

## 3. Abstract Data Schema Changes

* **No persistent data entities are added or modified.** All domain entities (Equipment, EquipmentType, EquipmentStatus, Tariff, Customer, Rental, Payment) remain unchanged in structure and are owned by the shared library.

## 4. Component Contracts & Payloads

* **Interaction: `admin` → `shared` (via `@bikerental/shared`)**
  * **Protocol:** TypeScript path alias (compile-time)
  * **Payload Changes:** Admin consumes stores, generated services, models, mappers, shared UI components, and constants. No new exports required from shared beyond what currently exists.

* **Interaction: `admin` → `bikerental-backend` (all CRUD operations)**
  * **Protocol:** HTTP REST (via `HttpClient` + generated services from `@bikerental/shared`)
  * **Payload Changes:** Unchanged. All request/response payloads are identical to pre-migration.

* **Interaction: `admin` → `bikerental-backend` (health check)**
  * **Protocol:** HTTP GET `/actuator/health`
  * **Payload Changes:** Unchanged. `HealthPollerService` from `@bikerental/shared` is used.

## 5. Updated Interaction Sequence

**Happy Path — Developer serves admin independently:**

1. Developer runs `ng serve admin`.
2. Angular CLI resolves `projects/admin/` and starts the dev server.
3. Browser loads the admin bundle.
4. `AdminLayoutComponent` renders the sidenav shell.
5. Router renders the default admin route.
6. Stores initialise; lookup data is loaded from the backend.

**Happy Path — Admin CRUD dialog flow:**

1. User navigates to an admin list page (e.g., Equipment).
2. `EquipmentListComponent` reads from `EquipmentStore` (in `@bikerental/shared`).
3. User clicks "Add" or a row edit action.
4. `EquipmentListComponent` opens `EquipmentDialogComponent` via `MatDialog`.
5. User submits the form.
6. Dialog calls `EquipmentStore.create()` or `EquipmentStore.update()`.
7. Store calls the generated API service (from `@bikerental/shared`).
8. On success: dialog closes with `true`; list component triggers store reload.
9. On error: `MatSnackBar` surfaces the error; dialog remains open.

**Happy Path — `ng build admin` in production:**

1. CI invokes `ng build admin --configuration production`.
2. esbuild compiles `projects/admin/` and all transitively imported `@bikerental/shared` code.
3. Both `ru` and `en` locale bundles emitted to `dist/admin/browser/`.
4. No gateway or operator code included in the bundle.

**Happy Path — Admin unit tests pass post-migration:**

1. CI runs `ng test admin` (or Vitest discovers `projects/admin/**/*.spec.ts`).
2. All relocated `*.spec.ts` files execute in jsdom environment.
3. All previously passing tests continue to pass.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No authentication guards are added (TASK002 deferred). All admin routes remain open. The admin app is a standalone SPA — access control is a deployment-level concern until TASK002 is implemented.

* **Scale & Performance:** The admin bundle includes only admin feature code and the used subset of `@bikerental/shared`. Tree-shaking at build time removes unused shared exports. No code from gateway or operator is included, reducing bundle size compared to the pre-migration monolithic SPA.
