# System Design: FR-03 — Gateway Application Extraction

## 1. Architectural Overview

This story extracts the root application shell and home feature into a self-contained `gateway` application project under `projects/gateway/`. The gateway is a lightweight developer portal and production landing page — it has its own bootstrap entry point, application configuration, and routing table, but it carries no feature logic of its own beyond rendering navigation cards.

At runtime, gateway operates as an independent SPA. It does not lazy-load or embed `admin` or `operator` application code. Instead, it links to those apps as external URLs (relative paths on the same host in production, or separate `ng serve` ports in development). The gateway's import boundary is strictly `@bikerental/shared`; no source files from `projects/admin/` or `projects/operator/` may be referenced.

## 2. Impacted Components

* **`App` (Root Component — relocated to `projects/gateway/`):** The root `App` component hosting the primary router outlet is moved from `src/app/app.ts` to `projects/gateway/src/app/app.ts`. It retains its single `<router-outlet>`.

* **`AppConfig` (Application Configuration — relocated):** `app.config.ts` is moved to `projects/gateway/src/app/`. Providers are trimmed to only what gateway needs: router, HTTP client, error interceptor, locale, health poller, and `APP_BRAND`. The `LookupInitializerFacade` initializer that pre-loads admin/operator lookup data is removed from gateway's config (each app initialises its own lookups). `provideDefaultClient` remains, as gateway's health indicator requires HTTP access.

* **`HomeComponent` (Landing Page — relocated):** Moved from `src/app/features/home/` to `projects/gateway/src/app/features/home/`. Navigation card targets change from Angular router paths (`/admin`, `/operator`) to absolute or root-relative URLs (`/admin/`, `/operator/`) that point to the independently deployed apps.

* **`LoginComponent` (Auth Stub — relocated):** Moved from `src/app/features/auth/` to `projects/gateway/src/app/features/auth/`. Remains a placeholder with no business logic (TASK002).

* **`gateway` Bootstrap Entry Point:** `projects/gateway/src/main.ts` bootstraps `App` with `appConfig`. Mirrors the existing `src/main.ts` structure.

* **`shared` (Library Project):** Consumed by gateway for `DashboardCardComponent`, `HealthPollerService`, `HealthIndicatorComponent`, and `$localize` label constants. No changes to shared internals.

## 3. Abstract Data Schema Changes

* **No persistent data entities are added or modified.** Gateway has no data store of its own. The `HomeComponent` reads no API data; it renders static navigation tiles.

## 4. Component Contracts & Payloads

* **Interaction: `gateway` → `shared` (via `@bikerental/shared`)**
  * **Protocol:** TypeScript path alias (compile-time)
  * **Payload Changes:** Gateway consumes `DashboardCardComponent`, `HealthPollerService`, `APP_BRAND` token, and label constants. No new exports required from shared.

* **Interaction: `HomeComponent` → `admin` app (navigation link)**
  * **Protocol:** HTML anchor / browser navigation (runtime)
  * **Payload Changes:** Previously an Angular router `routerLink` to `/admin`. Now a root-relative URL `/admin/` (or configurable absolute URL). No in-process data is passed; navigation crosses application boundary.

* **Interaction: `HomeComponent` → `operator` app (navigation link)**
  * **Protocol:** HTML anchor / browser navigation (runtime)
  * **Payload Changes:** Same pattern as above — root-relative URL `/operator/`.

* **Interaction: `gateway` → `bikerental-backend` (health check)**
  * **Protocol:** HTTP GET
  * **Payload Changes:** Unchanged from baseline. `HealthPollerService` polls `/actuator/health`; result is displayed via `HealthIndicatorComponent`.

## 5. Updated Interaction Sequence

**Happy Path — Developer starts gateway:**

1. Developer runs `npm start` (mapped to `ng serve gateway`).
2. Angular CLI resolves the `gateway` project and starts the dev server.
3. Browser loads the gateway bundle.
4. Router renders `HomeComponent` at the root route `''`.
5. Health poller initialises and begins polling `/actuator/health`.

**Happy Path — User navigates from gateway to admin:**

1. User sees the landing page with navigation cards.
2. User clicks the Admin card.
3. Browser follows the `/admin/` URL.
4. In development: browser navigates to `http://localhost:<admin-port>/`.
5. In production: browser navigates to `https://<host>/admin/` where the admin SPA is deployed.
6. Gateway's JavaScript is no longer active; admin's bootstrap takes over.

**Happy Path — `ng build gateway` in production:**

1. CI invokes `ng build gateway --configuration production`.
2. esbuild compiles `projects/gateway/` sources and all transitively imported `@bikerental/shared` code.
3. Both `ru` and `en` locale bundles are emitted to `dist/gateway/browser/`.
4. No code from `projects/admin/` or `projects/operator/` is included in the bundle.

**Unhappy Path — Gateway attempts to import from admin:**

1. A developer adds an import from `projects/admin/` inside a gateway source file.
2. TypeScript resolves the cross-project import.
3. `ng build gateway` succeeds at the TS level but violates the architectural constraint.
4. A lint rule (or manual review) must flag this as a boundary violation.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No authentication or session logic is introduced. The auth stub (`LoginComponent`) remains a visual placeholder only. Gateway routes are all publicly accessible (consistent with TASK002 deferral).

* **Scale & Performance:** Gateway's bundle size is minimal — it contains only the home page, auth stub, shared UI primitives, and the health poller. No feature code from admin or operator is included, keeping the initial load lightweight. The dev server for gateway starts independently, reducing cold-start time compared to the pre-migration single SPA.
