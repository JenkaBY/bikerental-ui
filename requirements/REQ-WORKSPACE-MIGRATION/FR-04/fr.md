# User Story: FR-04 — Admin Application Extraction

## 1. Description

**As a** developer
**I want to** have the admin CRUD feature area as a standalone `admin` Angular application under `projects/admin/`
**So that** the admin app can be developed, built, tested, and served independently without loading operator or gateway code

## 2. Context & Business Rules

* **Trigger:** A developer runs `ng serve admin` or `ng build admin`
* **Rules Enforced:**
  * All source currently under `src/app/features/admin/` must be relocated to `projects/admin/src/`
  * The admin app must have its own `main.ts`, root `AppComponent`, `app.config.ts`, and root routing
  * The admin app may only import from `@bikerental/shared` — no imports from `operator` or `gateway`
  * All existing admin routes (`/tariffs`, `/equipment`, `/customers`, `/rental-history`, `/payment-history`, `/users`) must remain navigable
  * The desktop-first layout (≥22" 1080p, `MatDialog` forms) behaviour is preserved unchanged
  * The admin app connects to the same backend API via the shared `provideDefaultClient` configuration

## 3. Non-Functional Requirements (NFRs)

* **Performance:** No regression in admin page load time vs. the current single-project build
* **Security/Compliance:** N/A (auth is unimplemented — TASK002)
* **Usability/Other:** All existing admin UI functionality works identically after extraction

## 4. Acceptance Criteria (BDD)

**Scenario 1: Admin app serves independently**

* **Given** the workspace has been migrated
* **When** the developer runs `ng serve admin`
* **Then** the admin app starts, is accessible in the browser, and does not require gateway or operator to be running

**Scenario 2: All existing admin routes are accessible**

* **Given** the admin app is running
* **When** the user navigates to each existing admin route
* **Then** each route renders the expected page without errors

**Scenario 3: Admin app only imports from shared**

* **Given** all source files under `projects/admin/`
* **When** TypeScript compilation runs
* **Then** no import references any file under `projects/operator/` or `projects/gateway/`

**Scenario 4: `ng build admin` produces a deployable artifact**

* **Given** the migrated workspace
* **When** `ng build admin --configuration production` is run
* **Then** a production build artifact is produced in `dist/admin/` without errors

**Scenario 5: Existing admin unit tests pass**

* **Given** all `*.spec.ts` files relocated to `projects/admin/`
* **When** `ng test admin` or `npm test` is run
* **Then** all previously passing admin tests continue to pass

## 5. Out of Scope

* Adding new admin routes or features
* Changing the visual design or layout of any admin page
* Implementing authentication guards on admin routes (TASK002)
