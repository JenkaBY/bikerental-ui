# System Design: FR-05 — Operator Application Extraction

## 1. Architectural Overview

This story extracts the operator feature area from `src/app/features/operator/` into a self-contained `operator` application project at `projects/operator/`. The operator app gains its own bootstrap entry point, application configuration, and root routing table. All operator rental flow pages, QR scanner integration, layout shell, and related components are moved without functional change.

Like the admin app, operator is a direct consumer of `@bikerental/shared` for all cross-cutting concerns. No imports from `projects/gateway/` or `projects/admin/` are permitted. The operator app is mobile-first and is served on its own port in development and deployed at `/operator/` in production.

## 2. Impacted Components

* **`OperatorShellWrapperComponent` (relocated to `projects/operator/`):** Moved from `src/app/features/operator/layout/`. Continues to switch between `OperatorLayoutComponent` (mobile) and `ShellComponent` (desktop) based on `LayoutModeService` from `@bikerental/shared`. No logic changes.

* **`OperatorLayoutComponent` (relocated):** Moved from `src/app/features/operator/layout/`. Continues to render `AppToolbarComponent`, `BottomNavComponent`, `HealthIndicatorComponent`, and `LogoutButtonComponent` — all sourced from `@bikerental/shared`.

* **All Operator Feature Components (relocated):** The following are moved to `projects/operator/src/app/`:
  * Multi-step rental creation stepper components
  * Equipment QR scanner return flow components (using `html5-qrcode` via `QrScannerComponent` from `@bikerental/shared`)
  * Operator dashboard component
    All components retain identical logic, templates, and test coverage.

* **`operator` Bootstrap Entry Point:** `projects/operator/src/main.ts` bootstraps the operator root component with its own `appConfig`. Config includes: router with operator routes at root (`/`), HTTP client with error interceptor, locale, `provideDefaultClient`, lookup initializer, and `APP_BRAND`.

* **Operator Root Routing:** `projects/operator/src/app/app.routes.ts` declares the operator sub-routes as root-level routes (not prefixed with `/operator`). The operator app is not aware of gateway or admin routes.

* **`shared` (Library Project):** `LayoutModeService`, `QrScannerComponent`, stores, models, mappers, and generated API services consumed by operator remain in `@bikerental/shared`. No changes to shared internals.

## 3. Abstract Data Schema Changes

* **No persistent data entities are added or modified.** All domain entities related to the operator flow (Rental, Equipment, Customer) remain unchanged and are owned by the shared library.

## 4. Component Contracts & Payloads

* **Interaction: `operator` → `shared` (via `@bikerental/shared`)**
  * **Protocol:** TypeScript path alias (compile-time)
  * **Payload Changes:** Operator consumes `LayoutModeService`, `QrScannerComponent`, stores, generated API services, models, and shared UI components. No new exports required from shared.

* **Interaction: `operator` → `bikerental-backend` (rental and equipment operations)**
  * **Protocol:** HTTP REST (via `HttpClient` + generated services from `@bikerental/shared`)
  * **Payload Changes:** Unchanged. All rental creation, equipment lookup, and return flow payloads are identical to pre-migration.

* **Interaction: `operator` → `bikerental-backend` (health check)**
  * **Protocol:** HTTP GET `/actuator/health`
  * **Payload Changes:** Unchanged.

* **Interaction: `QrScannerComponent` → device camera (QR scan)**
  * **Protocol:** Browser MediaDevices API (`html5-qrcode`)
  * **Payload Changes:** Unchanged. Decoded equipment UID string is passed to the parent rental return flow component.

## 5. Updated Interaction Sequence

**Happy Path — Developer serves operator independently:**

1. Developer runs `ng serve operator`.
2. Angular CLI resolves `projects/operator/` and starts the dev server on its configured port.
3. Browser loads the operator bundle.
4. `OperatorShellWrapperComponent` evaluates `LayoutModeService.isMobile()`.
5. Appropriate layout (mobile or desktop) is rendered.
6. Router renders the default operator route.

**Happy Path — Rental creation flow:**

1. Operator navigates to the rental creation entry point.
2. Multi-step stepper component renders Step 1.
3. Operator selects a customer and equipment item using lookup data from `@bikerental/shared` stores.
4. Operator advances through stepper steps.
5. On final step, stepper calls the rental creation service (generated, in `@bikerental/shared`).
6. Backend processes the request and returns the new rental record.
7. Operator is redirected to confirmation or dashboard route.

**Happy Path — QR scanner equipment return:**

1. Operator navigates to the return flow route.
2. `QrScannerComponent` (from `@bikerental/shared`) activates the device camera.
3. Camera decodes the equipment UID from the QR code.
4. UID is passed to the return flow component.
5. Return flow component calls the equipment return service.
6. Backend processes the return; operator sees confirmation.

**Happy Path — `ng build operator` in production:**

1. CI invokes `ng build operator --configuration production`.
2. esbuild compiles `projects/operator/` and all transitively imported `@bikerental/shared` code.
3. Both `ru` and `en` locale bundles emitted to `dist/operator/browser/`.
4. No gateway or admin code included in the bundle.

**Happy Path — Operator unit tests pass post-migration:**

1. CI runs `ng test operator` (or Vitest discovers `projects/operator/**/*.spec.ts`).
2. All relocated `*.spec.ts` files execute in jsdom environment.
3. All previously passing tests continue to pass.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No authentication guards are added (TASK002 deferred). All operator routes remain open. Camera access for QR scanning requires the browser to grant `MediaDevices` permission — this is a client-side permission prompt, not a server-side security control, and is unchanged from pre-migration.

* **Scale & Performance:** The operator bundle contains only operator feature code and the used subset of `@bikerental/shared`. The `html5-qrcode` dependency is included only in the operator bundle, not in gateway or admin, reducing their bundle sizes compared to the pre-migration monolith.
