# User Story: FR-02 — Shared Internal Library Extraction

## 1. Description

**As a** developer
**I want to** have all shared code (components, services, models, validators, constants, core logic, and the auto-generated API client) in a single `shared` library project importable via `@bikerental/shared`
**So that** all three application projects can consume shared code through a single, well-defined entry point without duplicating code

## 2. Context & Business Rules

* **Trigger:** A developer imports any shared component, service, model, or utility in any application project
* **Rules Enforced:**
  * Source currently at `src/app/shared/` and `src/app/core/` must be relocated to `projects/shared/src/`
  * The auto-generated API client (currently at `src/app/core/api/generated/`) must be relocated into `projects/shared/` — it remains auto-generated and must never be manually edited
  * `tsconfig.json` must declare the path alias `@bikerental/shared` pointing to the library's public API barrel file
  * Existing path aliases `@api-models`, `@ui-models`, and `@store.*` must be updated to resolve inside the shared library
  * The `shared` library must have zero imports from `gateway`, `admin`, or `operator` projects (no circular dependencies)
  * The library is internal only — no `ng-packagr` build step, no separate `package.json` for the library

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Importing from `@bikerental/shared` must not add measurable overhead vs. current direct path imports
* **Security/Compliance:** The relocated generated API client retains the same regeneration behaviour — `npm run generate:api` overwrites it in its new location
* **Usability/Other:** IDE auto-import must resolve `@bikerental/shared` correctly via the `tsconfig.json` path alias

## 4. Acceptance Criteria (BDD)

**Scenario 1: Shared import resolves in all application projects**

* **Given** a component in `admin`, `operator`, or `gateway`
* **When** the developer writes `import { X } from '@bikerental/shared'`
* **Then** TypeScript resolves the import without error and the component is available at runtime

**Scenario 2: No circular dependency from shared to apps**

* **Given** the shared library source
* **When** a static import analysis is run
* **Then** no import from `projects/shared/**` references any file under `projects/admin/`, `projects/operator/`, or `projects/gateway/`

**Scenario 3: Generated API client is regenerated to the new location**

* **Given** the backend OpenAPI spec is available
* **When** the developer runs `npm run generate:api`
* **Then** the auto-generated files are written to the new path inside `projects/shared/` and the previous location at `src/app/core/api/generated/` no longer contains the generated files

**Scenario 4: Existing path aliases still resolve**

* **Given** a file that uses `@api-models`, `@ui-models`, or `@store.*`
* **When** TypeScript compilation runs
* **Then** all three aliases resolve to their updated locations inside `projects/shared/` without error

**Scenario 5: No existing import paths are broken**

* **Given** all source files in `admin`, `operator`, and `gateway`
* **When** `ng build` is run for each app
* **Then** zero TypeScript import errors are reported

## 5. Out of Scope

* Publishing the shared library to npm
* Adding an `ng-packagr` build step for the shared library
* Adding new shared components or services beyond what currently exists
* Changing the public API surface of any shared component or service
