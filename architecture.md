# bikerental-ui — Angular 21 multi-project POS workspace for a bike rental shop

## Summary

- Angular 21 workspace containing three deployable SPAs (`gateway`, `admin`, `operator`) and one shared library (`shared`); no SSR
- `gateway` is the landing shell (port 4200 in dev); `admin` is desktop-first CRUD management (port 4201); `operator` is mobile-first rental flow (port 4202)
- All three SPAs communicate with one external REST backend (`http://localhost:8080`) via a shared auto-generated OpenAPI client in `projects/shared/`
- All state is managed with Angular Signals; no NgRx, no NgModules
- Deployment model: three static SPA bundles deployed to GitHub Pages via GitHub Actions CI/CD (`/`, `/admin/`, `/operator/`)

## Technology Stack

- CATEGORY: Runtime
  TECHNOLOGY: Angular 21.2.x
  USED_BY: gateway, admin, operator, shared

- CATEGORY: UI Framework
  TECHNOLOGY: Angular Material 21.2.x + Tailwind CSS 4.x
  USED_BY: gateway, admin, operator, shared

- CATEGORY: State Management
  TECHNOLOGY: Angular Signals (`signal()`, `computed()`, `linkedSignal()`)
  USED_BY: gateway, admin, operator, shared

- CATEGORY: API Client Generation
  TECHNOLOGY: ng-openapi 0.2.x (source: `http://localhost:8080/v3/api-docs/all`)
  USED_BY: shared (output: `projects/shared/src/core/api/generated/`)

- CATEGORY: i18n
  TECHNOLOGY: @angular/localize 21.2.x (XLF, source locale: `en-US`, translations: `ru`)
  USED_BY: gateway, admin, operator, shared

- CATEGORY: HTTP Client
  TECHNOLOGY: Angular HttpClient with functional interceptors
  USED_BY: admin, operator (via shared interceptors)

- CATEGORY: QR Scanning
  TECHNOLOGY: html5-qrcode 2.3.x
  USED_BY: operator (return flow QrScannerComponent in shared)

- CATEGORY: Testing
  TECHNOLOGY: Vitest 4.x + @vitest/coverage-v8 + jsdom
  USED_BY: gateway, admin, operator, shared

- CATEGORY: Linting/Formatting
  TECHNOLOGY: ESLint (angular-eslint 21.x) + Prettier 3.x
  USED_BY: gateway, admin, operator, shared

- CATEGORY: Build System
  TECHNOLOGY: Angular CLI 21.2.x / @angular/build (esbuild); ng-packagr for shared library
  USED_BY: gateway, admin, operator, shared

- CATEGORY: Task Runner
  TECHNOLOGY: concurrently 9.x (parallel dev serving of all three apps)
  USED_BY: root workspace (npm start)

- CATEGORY: Pre-commit Hooks
  TECHNOLOGY: Husky 9.x + lint-staged 16.x + commitlint 20.x
  USED_BY: root workspace

- CATEGORY: CI/CD
  TECHNOLOGY: GitHub Actions (`.github/workflows/build-and-deploy.yml`)
  USED_BY: root workspace; deploys to GitHub Pages

## Services

SERVICE_NAME: gateway
TYPE: Frontend
PURPOSE: Landing-page SPA served at the repo root path; displays navigation cards to Admin and Operator areas.
OVERVIEW_REF: NONE
ENTRY_POINT: `projects/gateway/src/main.ts`
EXPOSES:

- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: / (root route, GitHub Pages root)
  DESCRIPTION: Compiled static bundle; links to /admin/ and /operator/
  CONSUMES:
- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /admin (dev proxy → port 4201)
  FROM_SERVICE: admin
  DESCRIPTION: Dev-server proxy routes /admin/* to admin app during local development

---

SERVICE_NAME: admin
TYPE: Frontend
PURPOSE: Desktop-first SPA for CRUD management of equipment types, statuses, equipment, tariffs, customers, rentals, payments, and users.
OVERVIEW_REF: NONE
ENTRY_POINT: `projects/admin/src/main.ts`
EXPOSES:

- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /admin/ (baseHref, GitHub Pages sub-path; port 4201 in dev)
  DESCRIPTION: Compiled static bundle for the Admin POS area
  CONSUMES:
- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /api/equipment-types, /api/equipment-statuses, /api/equipment, /api/tariffs, /api/customers, /api/rentals, /api/finance
  FROM_SERVICE: bikerental-backend
  DESCRIPTION: All domain CRUD operations via shared generated API client

---

SERVICE_NAME: operator
TYPE: Frontend
PURPOSE: Mobile-first SPA for rental creation (multi-step stepper), QR-scanner equipment return, and active-rentals dashboard.
OVERVIEW_REF: NONE
ENTRY_POINT: `projects/operator/src/main.ts`
EXPOSES:

- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /operator/ (baseHref, GitHub Pages sub-path; port 4202 in dev)
  DESCRIPTION: Compiled static bundle for the Operator POS area
  CONSUMES:
- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /api/equipment-types, /api/equipment-statuses, /api/equipment, /api/tariffs, /api/customers, /api/rentals
  FROM_SERVICE: bikerental-backend
  DESCRIPTION: Rental lifecycle operations via shared generated API client

---

SERVICE_NAME: shared
TYPE: Other
PURPOSE: Angular library providing the generated API client, domain mappers, domain models, signal-based stores, shared UI components, i18n constants, interceptors, and health monitoring.
OVERVIEW_REF: NONE
ENTRY_POINT: `projects/shared/src/public-api.ts`
EXPOSES:

- PROTOCOL: Other
  ENDPOINT_OR_TOPIC: public-api.ts barrel exports
  DESCRIPTION: Re-exports all library symbols consumed by gateway, admin, and operator
  CONSUMES:
- PROTOCOL: NONE

---

SERVICE_NAME: bikerental-backend
TYPE: API
PURPOSE: External Spring Boot REST backend that exposes the OpenAPI spec consumed by this workspace.
OVERVIEW_REF: NONE
ENTRY_POINT: http://localhost:8080 (external, not in this repo)
EXPOSES:

- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /v3/api-docs/all
  DESCRIPTION: OpenAPI spec used to regenerate `projects/shared/src/core/api/generated/`
- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /api/equipment-types, /api/equipment-statuses, /api/equipment, /api/tariffs, /api/customers, /api/rentals, /api/finance
  DESCRIPTION: Domain REST endpoints consumed by generated Angular services in admin and operator
- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /actuator/health
  DESCRIPTION: Health check endpoint polled by HealthPollerService every 5 minutes
  CONSUMES:
- PROTOCOL: NONE

## Service Communication Map

INTERACTION_ID: 1
FROM_SERVICE: admin
TO_SERVICE: bikerental-backend
PROTOCOL: HTTP
CHANNEL: /api/equipment-types, /api/equipment-statuses, /api/equipment, /api/tariffs, /api/customers, /api/rentals, /api/finance
DIRECTION: Request-Response
PURPOSE: CRUD operations for all domain entities managed by the admin area
CONTRACT_REF: `projects/shared/src/core/api/generated/` (auto-generated from OpenAPI spec)

INTERACTION_ID: 2
FROM_SERVICE: operator
TO_SERVICE: bikerental-backend
PROTOCOL: HTTP
CHANNEL: /api/equipment-types, /api/equipment-statuses, /api/equipment, /api/tariffs, /api/customers, /api/rentals
DIRECTION: Request-Response
PURPOSE: Rental lifecycle operations: rental creation, equipment return, active-rentals dashboard
CONTRACT_REF: `projects/shared/src/core/api/generated/` (auto-generated from OpenAPI spec)

INTERACTION_ID: 3
FROM_SERVICE: admin
TO_SERVICE: bikerental-backend
PROTOCOL: HTTP
CHANNEL: /actuator/health
DIRECTION: Request-Response
PURPOSE: Poll backend health status every 5 min; result surfaced via health-indicator component in admin toolbar
CONTRACT_REF: `projects/shared/src/core/health/health.model.ts`

INTERACTION_ID: 4
FROM_SERVICE: operator
TO_SERVICE: bikerental-backend
PROTOCOL: HTTP
CHANNEL: /actuator/health
DIRECTION: Request-Response
PURPOSE: Poll backend health status every 5 min; result surfaced via health-indicator component in operator toolbar
CONTRACT_REF: `projects/shared/src/core/health/health.model.ts`

INTERACTION_ID: 5
FROM_SERVICE: gateway
TO_SERVICE: admin
PROTOCOL: HTTP
CHANNEL: /admin (dev proxy; `proxy.conf.json`)
DIRECTION: Request-Response
PURPOSE: Dev-server only — gateway dev server proxies /admin/* requests to the admin dev server on port 4201
CONTRACT_REF: `proxy.conf.json`

INTERACTION_ID: 6
FROM_SERVICE: gateway
TO_SERVICE: operator
PROTOCOL: HTTP
CHANNEL: /operator (dev proxy; `proxy.conf.json`)
DIRECTION: Request-Response
PURPOSE: Dev-server only — gateway dev server proxies /operator/* requests to the operator dev server on port 4202
CONTRACT_REF: `proxy.conf.json`

## Shared Infrastructure

INFRA_NAME: shared Angular Library
TYPE: Other
USED_BY_SERVICES: gateway, admin, operator
PURPOSE: Single source of truth for the generated API client, domain models, signal-based stores, shared UI components, and i18n constants; consumed as an internal path-mapped library (no npm publish)
CONFIG_REF: `projects/shared/src/public-api.ts`, `angular.json` (project: shared)

INFRA_NAME: OpenAPI Generated Client
TYPE: Other
USED_BY_SERVICES: admin, operator (via shared library)
PURPOSE: Type-safe HTTP wrappers auto-generated from backend OpenAPI spec; never edited manually
CONFIG_REF: `projects/shared/config/openapi.config.ts`

INFRA_NAME: Dev Proxy
TYPE: Gateway
USED_BY_SERVICES: gateway, admin, operator
PURPOSE: Angular CLI proxy config that unifies all three dev servers under the gateway origin (port 4200) during local development
CONFIG_REF: `proxy.conf.json`

INFRA_NAME: GitHub Actions CI/CD Pipeline
TYPE: Other
USED_BY_SERVICES: gateway, admin, operator, shared
PURPOSE: Quality (lint + type-check), test (Vitest per project + coverage merge), build, and GitHub Pages deployment pipeline
CONFIG_REF: `.github/workflows/build-and-deploy.yml`

## Folder Structure

- PATH: `projects/gateway/`
  ROLE: Service
  PURPOSE: Standalone Angular application — landing page shell with navigation cards to Admin and Operator

- PATH: `projects/gateway/src/main.ts`
  ROLE: Config
  PURPOSE: Bootstrap entry point for the gateway application

- PATH: `projects/admin/`
  ROLE: Service
  PURPOSE: Standalone Angular application — desktop-first CRUD management area for all domain entities

- PATH: `projects/admin/src/main.ts`
  ROLE: Config
  PURPOSE: Bootstrap entry point for the admin application

- PATH: `projects/operator/`
  ROLE: Service
  PURPOSE: Standalone Angular application — mobile-first rental creation stepper, QR-scanner return flow, active-rentals dashboard

- PATH: `projects/operator/src/main.ts`
  ROLE: Config
  PURPOSE: Bootstrap entry point for the operator application

- PATH: `projects/shared/`
  ROLE: Library
  PURPOSE: Angular library (ng-packagr) shared by gateway, admin, and operator

- PATH: `projects/shared/src/public-api.ts`
  ROLE: Config
  PURPOSE: Public barrel export — all symbols accessible to consuming applications

- PATH: `projects/shared/src/core/api/generated/`
  ROLE: Library
  PURPOSE: Auto-generated Angular services and models from backend OpenAPI spec; must never be edited manually

- PATH: `projects/shared/src/core/mappers/`
  ROLE: Library
  PURPOSE: Pure static mapper classes (`XyzMapper.fromResponse` / `XyzMapper.toRequest`) — the only code that imports generated types and produces domain models

- PATH: `projects/shared/src/core/models/`
  ROLE: Library
  PURPOSE: UI domain model interfaces (`Tariff`, `Equipment`, `EquipmentType`, `EquipmentStatus`, …) — the only types components import

- PATH: `projects/shared/src/core/state/`
  ROLE: Library
  PURPOSE: Signal-based stores (`equipment-type.store.ts`, `tariff.store.ts`, `pricing-type.store.ts`, etc.) and `LookupInitializerFacade` for background lookup loading via `APP_INITIALIZER`

- PATH: `projects/shared/src/core/health/`
  ROLE: Library
  PURPOSE: `HealthService` (HTTP call to `/actuator/health`) and `HealthPollerService` (interval-based poller started in `APP_INITIALIZER`)

- PATH: `projects/shared/src/core/interceptors/`
  ROLE: Library
  PURPOSE: Functional HTTP interceptors; `errorInterceptor` handles global HTTP errors; `ErrorService` surfaces errors to components

- PATH: `projects/shared/src/core/layout-mode.service.ts`
  ROLE: Library
  PURPOSE: Signal-based service for toggling between admin and operator layout modes

- PATH: `projects/shared/src/shared/components/`
  ROLE: Library
  PURPOSE: Reusable standalone UI components: shell, sidebar, app-toolbar, app-brand, bottom-nav, button, toggle-button, logout-button, cancel-button, save-button, sidebar-nav-item, dashboard-card, equipment-type-dropdown, qr-scanner, health-indicator, layout-mode-toggle

- PATH: `projects/shared/src/shared/constant/labels.ts`
  ROLE: Library
  PURPOSE: All UI-visible `$localize` string constants

- PATH: `projects/shared/src/shared/validators/`
  ROLE: Library
  PURPOSE: `form-error-messages.ts` — i18n form validation error strings; `slug-validators.ts` — custom validators

- PATH: `projects/shared/src/shared/pipes/`
  ROLE: Library
  PURPOSE: `truncate.pipe.ts` — reusable text truncation pipe

- PATH: `projects/shared/src/shared/utils/`
  ROLE: Library
  PURPOSE: `date.util.ts` — shared date formatting utilities

- PATH: `projects/shared/config/openapi.config.ts`
  ROLE: Config
  PURPOSE: ng-openapi code generation config pointing to backend spec URL; output target: `projects/shared/src/core/api/generated/`

- PATH: `projects/shared/src/environments/`
  ROLE: Config
  PURPOSE: `environment.ts` / `environment.prod.ts` — `apiUrl`, `healthPollIntervalMs`, `defaultLocale`, `brand`

- PATH: `projects/shared/src/locale/`
  ROLE: Config
  PURPOSE: Extracted XLF translation files (`messages.xlf` — English, `messages.ru.xlf` — Russian)

- PATH: `proxy.conf.json`
  ROLE: Config
  PURPOSE: Angular CLI proxy config — routes `/admin` → port 4201 and `/operator` → port 4202 during local development

- PATH: `public/`
  ROLE: Config
  PURPOSE: Static assets served by all three applications (shared asset glob in `angular.json`)

- PATH: `docs/`
  ROLE: Config
  PURPOSE: Legacy architecture and flow documentation

- PATH: `memory-bank/`
  ROLE: Config
  PURPOSE: AI-agent context files: task index (`tasks/_index.md`), active context, system patterns, progress notes

- PATH: `requirements/`
  ROLE: Config
  PURPOSE: Functional requirements per feature (REQ-WORKSPACE-MIGRATION and others)

- PATH: `.github/`
  ROLE: Config
  PURPOSE: Copilot instructions, skill definitions, prompt templates, and GitHub Actions workflows

- PATH: `scripts/`
  ROLE: Tool
  PURPOSE: `merge-xlf.mjs` — merges per-project XLF files into a single translation file

- PATH: `coverage/`
  ROLE: Test
  PURPOSE: Per-project Vitest coverage output (`admin/`, `gateway/`, `operator/`, `shared/`) and merged LCOV report

## Architectural Patterns

- PATTERN: Multi-Application Workspace (Micro-Frontend by deployment)
  SCOPE: Entire workspace
  EVIDENCE: `angular.json` declares `gateway`, `admin`, `operator` as independent application projects; each builds to a separate bundle with its own `baseHref`; served on separate ports in dev

- PATTERN: Layered Data Pipeline (Three-Layer)
  SCOPE: admin, operator (via shared library)
  EVIDENCE: `projects/shared/src/core/api/generated/` → `projects/shared/src/core/mappers/` → `projects/shared/src/core/models/` → feature components

- PATTERN: Smart / Dumb Components
  SCOPE: Admin and Operator feature areas
  EVIDENCE: `*-list.component.ts` (smart, owns data) + `*-dialog.component.ts` (receives data via `MAT_DIALOG_DATA`)

- PATTERN: Signal-Based State Management
  SCOPE: Entire workspace (via shared library)
  EVIDENCE: `projects/shared/src/core/state/*.store.ts` using `signal()` / `computed()`

- PATTERN: Facade
  SCOPE: Lookup initialization
  EVIDENCE: `projects/shared/src/core/state/lookup-initializer.facade.ts` orchestrates multiple stores from `APP_INITIALIZER`

- PATTERN: Functional Interceptors
  SCOPE: HTTP layer (admin, operator)
  EVIDENCE: `projects/shared/src/core/interceptors/error.interceptor.ts` registered via `withInterceptors()`

- PATTERN: Code Generation
  SCOPE: API integration layer (shared library)
  EVIDENCE: `projects/shared/config/openapi.config.ts` + `npm run generate:api` regenerates `projects/shared/src/core/api/generated/`

- PATTERN: Dev-Server Gateway Proxy
  SCOPE: Local development
  EVIDENCE: `proxy.conf.json` + `npm start` (concurrently) — gateway at port 4200 proxies `/admin` and `/operator` to their dedicated dev servers

## Security Topology

- AUTHN_AUTHZ: Not implemented (TASK002 deferred). All routes in all three applications are currently open with no guards.
- TRUST_BOUNDARIES: admin/operator ↔ bikerental-backend — enforced only by CORS on the backend; no token/session on the frontend yet.
- KNOWN_RISKS:
  - No authentication guards on any route across any application
  - No CSRF protection on the frontend
  - `apiUrl` is hardcoded to `http://localhost:8080` in development environment (plain HTTP)
  - All three SPA bundles on GitHub Pages are publicly accessible with no access control

## Deployment Topology

- DEPLOYMENT_MODEL: Multi-Application (three independent static SPA bundles deployed together)
- CONTAINER_RUNTIME: NONE
- ORCHESTRATION: GitHub Actions CI/CD (`.github/workflows/build-and-deploy.yml`)
- SERVICES_AND_PORTS:
  - `gateway` dev server: port 4200 (Angular CLI `ng serve --project=gateway --proxy-config proxy.conf.json`)
  - `admin` dev server: port 4201 (Angular CLI `ng serve --project=admin`)
  - `operator` dev server: port 4202 (Angular CLI `ng serve --project=operator`)
  - `bikerental-backend`: port 8080 (external, not in this repo)
- PRODUCTION_URLS (GitHub Pages):
  - gateway: `https://jenkaby.github.io/bike-rental/` (baseHref: `/`)
  - admin: `https://jenkaby.github.io/bike-rental/admin/` (baseHref: `/admin/`)
  - operator: `https://jenkaby.github.io/bike-rental/operator/` (baseHref: `/operator/`)
- CONFIG_REFS:
  - `angular.json` — Angular workspace and build configuration for all four projects
  - `projects/shared/src/environments/environment.prod.ts` — production environment overrides
  - `.github/workflows/build-and-deploy.yml` — CI/CD pipeline (quality → test → build → deploy)

## Assumptions

- ASSUMPTION: The backend (`bikerental-backend`) is a separate Spring Boot service not present in this repository.
  BASIS: `projects/shared/config/openapi.config.ts` references `http://localhost:8080/v3/api-docs/all`; no backend source is found in the workspace.

- ASSUMPTION: The `shared` library is consumed via TypeScript path mapping only (not published to npm).
  BASIS: No `package.json` publish config or npm registry reference found; `angular.json` library project uses ng-packagr for build but apps reference shared symbols via `@angular/localize` path aliases in `tsconfig.json`.

- ASSUMPTION: Playwright E2E tests are planned but not yet set up.
  BASIS: `.github/instructions/playwright-typescript.instructions.md` describes a `tests/` directory convention, but no `playwright.config.ts` or `tests/` directory was found in the workspace.

- ASSUMPTION: The `docs/architecture.md` file reflects an earlier planned workspace layout (`projects/shared-lib/`, `projects/admin-app/`) that differs from the implemented layout; it is not authoritative.
  BASIS: `angular.json` declares projects as `shared`, `admin`, `operator`, `gateway` — not the names in `docs/architecture.md`.

