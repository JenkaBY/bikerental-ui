# bikerental-ui — Angular 21 POS application for a bike rental shop

## Summary

- Single-page Angular 21 application (no SSR) serving two user personas: Admin (management) and Operator (field staff)
- Two lazy-loaded feature areas: `/admin/**` (desktop-first CRUD) and `/operator/**` (mobile-first rental flow)
- Communicates with one external REST backend (`http://localhost:8080`) via an auto-generated OpenAPI client
- All state is managed with Angular Signals; no NgRx, no NgModules
- Deployment model: static SPA (GitHub Pages or any static host)

## Technology Stack

- CATEGORY: Runtime
  TECHNOLOGY: Angular 21.2.x
  USED_BY: bikerental-ui

- CATEGORY: UI Framework
  TECHNOLOGY: Angular Material 21.2.x + Tailwind CSS 4.x
  USED_BY: bikerental-ui

- CATEGORY: State Management
  TECHNOLOGY: Angular Signals (`signal()`, `computed()`, `linkedSignal()`)
  USED_BY: bikerental-ui

- CATEGORY: API Client Generation
  TECHNOLOGY: ng-openapi 0.2.x (from `http://localhost:8080/v3/api-docs/all`)
  USED_BY: bikerental-ui (output: `src/app/core/api/generated/`)

- CATEGORY: i18n
  TECHNOLOGY: @angular/localize 21.2.x (XLF, runtime default: `ru`)
  USED_BY: bikerental-ui

- CATEGORY: HTTP Client
  TECHNOLOGY: Angular HttpClient with functional interceptors
  USED_BY: bikerental-ui

- CATEGORY: QR Scanning
  TECHNOLOGY: html5-qrcode 2.3.x
  USED_BY: operator feature (return flow)

- CATEGORY: Testing
  TECHNOLOGY: Vitest 4.x + @vitest/coverage-v8 + jsdom
  USED_BY: bikerental-ui

- CATEGORY: Linting/Formatting
  TECHNOLOGY: ESLint (angular-eslint 21.x) + Prettier 3.x
  USED_BY: bikerental-ui

- CATEGORY: Build System
  TECHNOLOGY: Angular CLI 21.2.x / @angular/build (esbuild)
  USED_BY: bikerental-ui

- CATEGORY: Pre-commit Hooks
  TECHNOLOGY: Husky 9.x + lint-staged 16.x + commitlint 20.x
  USED_BY: bikerental-ui

## Services

SERVICE_NAME: bikerental-ui
TYPE: Frontend
PURPOSE: Standalone Angular SPA — the only deployable unit in this repository.
OVERVIEW_REF: NONE
ENTRY_POINT: `src/main.ts`
EXPOSES:

- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: / (SPA routes)
  DESCRIPTION: Serves the compiled SPA bundle; all navigation is client-side
  CONSUMES:
- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: http://localhost:8080 (OpenAPI REST)
  FROM_SERVICE: bikerental-backend (external, not in this repo)
  DESCRIPTION: All CRUD and business operations via auto-generated API client

---

SERVICE_NAME: bikerental-backend
TYPE: API
PURPOSE: External Spring Boot REST backend that exposes the OpenAPI spec consumed by this UI.
OVERVIEW_REF: NONE
ENTRY_POINT: http://localhost:8080 (external)
EXPOSES:

- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /v3/api-docs/all
  DESCRIPTION: OpenAPI spec used to regenerate `src/app/core/api/generated/`
- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /api/equipment-types, /api/equipment-statuses, /api/equipment, /api/tariffs, /api/customers, /api/rentals, /api/finance
  DESCRIPTION: Domain REST endpoints consumed by generated Angular services
- PROTOCOL: HTTP
  ENDPOINT_OR_TOPIC: /actuator/health
  DESCRIPTION: Health check endpoint polled by HealthPollerService every 5 minutes
  CONSUMES:
- PROTOCOL: NONE

## Service Communication Map

INTERACTION_ID: 1
FROM_SERVICE: bikerental-ui
TO_SERVICE: bikerental-backend
PROTOCOL: HTTP
CHANNEL: /api/equipment-types, /api/equipment-statuses, /api/equipment, /api/tariffs, /api/customers, /api/rentals, /api/finance
DIRECTION: Request-Response
PURPOSE: CRUD operations for all domain entities (equipment, tariffs, customers, rentals, payments)
CONTRACT_REF: `src/app/core/api/generated/` (auto-generated from OpenAPI spec)

INTERACTION_ID: 2
FROM_SERVICE: bikerental-ui (HealthPollerService)
TO_SERVICE: bikerental-backend
PROTOCOL: HTTP
CHANNEL: /actuator/health
DIRECTION: Request-Response
PURPOSE: Poll backend health status every 5 min; result surfaced in UI via health-indicator component
CONTRACT_REF: `src/app/core/health/health.model.ts`

## Shared Infrastructure

INFRA_NAME: OpenAPI Generated Client
TYPE: Other
USED_BY_SERVICES: bikerental-ui (all feature areas)
PURPOSE: Type-safe HTTP wrappers auto-generated from backend OpenAPI spec; never edited manually
CONFIG_REF: `src/config/openapi.config.ts`

## Folder Structure

- PATH: `src/main.ts`
  ROLE: Config
  PURPOSE: Angular bootstrap entry point

- PATH: `src/app/app.config.ts`
  ROLE: Config
  PURPOSE: Root ApplicationConfig — providers: router, HttpClient, interceptors, locale, APP_INITIALIZER, generated API client base path

- PATH: `src/app/app.routes.ts`
  ROLE: Config
  PURPOSE: Top-level lazy routes: `/` (home), `/login`, `/admin`, `/operator`

- PATH: `src/app/core/api/generated/`
  ROLE: Library
  PURPOSE: Auto-generated Angular services and models from backend OpenAPI spec; must never be edited manually

- PATH: `src/app/core/mappers/`
  ROLE: Library
  PURPOSE: Pure static mapper classes (`XyzMapper.fromResponse` / `XyzMapper.toRequest`) — the only code that imports generated types and produces domain models

- PATH: `src/app/core/models/`
  ROLE: Library
  PURPOSE: UI domain model interfaces (`Tariff`, `Equipment`, `Customer`, …) with `Date` fields; the only types components import

- PATH: `src/app/core/state/`
  ROLE: Library
  PURPOSE: Signal-based stores (`equipment-type.store.ts`, `tariff.store.ts`, etc.) and `LookupInitializerFacade` for background lookup loading on app init

- PATH: `src/app/core/health/`
  ROLE: Library
  PURPOSE: `HealthService` (HTTP call to `/actuator/health`) and `HealthPollerService` (interval-based poller started in APP_INITIALIZER)

- PATH: `src/app/core/interceptors/`
  ROLE: Library
  PURPOSE: Functional HTTP interceptors; `errorInterceptor` handles global HTTP errors

- PATH: `src/app/features/admin/`
  ROLE: Service
  PURPOSE: Desktop-first Admin feature area — CRUD pages for equipment types, statuses, equipment, tariffs, customers, rentals, payments, users

- PATH: `src/app/features/operator/`
  ROLE: Service
  PURPOSE: Mobile-first Operator feature area — dashboard, rental-create stepper, and QR-scanner return flow

- PATH: `src/app/features/auth/`
  ROLE: Service
  PURPOSE: Login page placeholder (auth unimplemented; all routes are currently open)

- PATH: `src/app/features/home/`
  ROLE: Service
  PURPOSE: Landing/home page component

- PATH: `src/app/shared/components/`
  ROLE: Library
  PURPOSE: Reusable standalone UI components: shell, buttons, dropdowns, dashboard-card, qr-scanner, health-indicator, sidebar-nav-item, layout-mode-toggle

- PATH: `src/app/shared/constant/`
  ROLE: Library
  PURPOSE: `labels.ts` — all UI-visible `$localize` string constants

- PATH: `src/app/shared/validators/`
  ROLE: Library
  PURPOSE: `form-error-messages.ts` — i18n form validation error strings

- PATH: `src/config/`
  ROLE: Config
  PURPOSE: `openapi.config.ts` — ng-openapi code generation config pointing to backend spec URL

- PATH: `src/environments/`
  ROLE: Config
  PURPOSE: `environment.ts` / `environment.prod.ts` — `apiUrl`, `healthPollIntervalMs`, `defaultLocale`, `brand`

- PATH: `src/locale/`
  ROLE: Config
  PURPOSE: Extracted XLF translation files (`messages.xlf`)

- PATH: `docs/`
  ROLE: Config
  PURPOSE: Legacy architecture and flow documentation (pre-dates current single-project structure)

- PATH: `memory-bank/`
  ROLE: Config
  PURPOSE: AI-agent context files: task index, active context, system patterns, progress notes

- PATH: `tests/`
  ROLE: Test
  PURPOSE: Playwright E2E test files (if present)

- PATH: `.github/`
  ROLE: Config
  PURPOSE: Copilot instructions, skill definitions, prompt templates, and GitHub Actions workflows

## Architectural Patterns

- PATTERN: Layered Data Pipeline (Three-Layer)
  SCOPE: Entire application
  EVIDENCE: `src/app/core/api/generated/` → `src/app/core/mappers/` → `src/app/core/models/` → feature components

- PATTERN: Smart / Dumb Components
  SCOPE: Admin and Operator feature areas
  EVIDENCE: `*-list.component.ts` (smart, owns data) + `*-dialog.component.ts` (receives data via `MAT_DIALOG_DATA`)

- PATTERN: Signal-Based State Management
  SCOPE: Entire application
  EVIDENCE: `src/app/core/state/*.store.ts` using `signal()` / `computed()`

- PATTERN: Facade
  SCOPE: Lookup initialization
  EVIDENCE: `src/app/core/state/lookup-initializer.facade.ts` orchestrates multiple stores from `APP_INITIALIZER`

- PATTERN: Functional Interceptors
  SCOPE: HTTP layer
  EVIDENCE: `src/app/core/interceptors/error.interceptor.ts` registered via `withInterceptors()`

- PATTERN: Lazy Loading
  SCOPE: Router
  EVIDENCE: `src/app/app.routes.ts` — `loadChildren` for admin and operator; `loadComponent` for login and home

- PATTERN: Code Generation
  SCOPE: API integration layer
  EVIDENCE: `src/config/openapi.config.ts` + `npm run generate:api` regenerates `src/app/core/api/generated/`

## Security Topology

- AUTHN_AUTHZ: Not implemented (TASK002 deferred). All routes are currently open with no guards.
- TRUST_BOUNDARIES: bikerental-ui ↔ bikerental-backend — enforced only by CORS on the backend; no token/session on the frontend yet.
- KNOWN_RISKS:
  - No authentication guards on any route
  - No CSRF protection on the frontend
  - `apiUrl` is hardcoded to `http://localhost:8080` in development environment (plain HTTP)

## Deployment Topology

- DEPLOYMENT_MODEL: Modular Monolith (single SPA with lazy-loaded feature modules)
- CONTAINER_RUNTIME: NONE
- ORCHESTRATION: NONE
- SERVICES_AND_PORTS:
  - `bikerental-ui` dev server: port 4200 (Angular CLI `ng serve`)
  - `bikerental-backend`: port 8080 (external, not in this repo)
- CONFIG_REFS:
  - `angular.json` — Angular workspace and build configuration
  - `src/environments/environment.prod.ts` — production environment overrides

## Assumptions

- ASSUMPTION: The backend (`bikerental-backend`) is a separate Spring Boot service not present in this repository.
  BASIS: `src/config/openapi.config.ts` references `http://localhost:8080/v3/api-docs/all`; no backend source is found in the workspace.

- ASSUMPTION: The `tests/` directory is the intended location for Playwright E2E tests per `.github/instructions/playwright-typescript.instructions.md`, but no test files were confirmed present at analysis time.
  BASIS: Playwright instructions reference `tests/` as the target directory; no `playwright.config.ts` was found in the workspace root.

- ASSUMPTION: The existing `docs/architecture.md` reflects an earlier planned multi-project workspace layout that was never implemented; the actual project is a single Angular workspace.
  BASIS: `angular.json` declares a single project `bikerental-ui`; there are no `projects/admin-app` or `projects/operator-app` directories.

