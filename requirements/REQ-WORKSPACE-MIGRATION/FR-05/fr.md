# User Story: FR-05 — Operator Application Extraction

## 1. Description

**As a** developer
**I want to** have the operator rental flow as a standalone `operator` Angular application under `projects/operator/`
**So that** the operator app can be developed, built, tested, and served independently without loading admin or gateway code

## 2. Context & Business Rules

* **Trigger:** A developer runs `ng serve operator` or `ng build operator`
* **Rules Enforced:**
  * All source currently under `src/app/features/operator/` must be relocated to `projects/operator/src/`
  * The operator app must have its own `main.ts`, root `AppComponent`, `app.config.ts`, and root routing
  * The operator app may only import from `@bikerental/shared` — no imports from `admin` or `gateway`
  * All existing operator routes (multi-step stepper rental flow + QR scanner return) must remain navigable
  * The mobile-first layout behaviour is preserved unchanged
  * The operator app connects to the same backend API via the shared `provideDefaultClient` configuration

## 3. Non-Functional Requirements (NFRs)

* **Performance:** No regression in operator page load time vs. the current single-project build
* **Security/Compliance:** N/A (auth is unimplemented — TASK002)
* **Usability/Other:** All existing operator UI functionality works identically after extraction; QR scanner integration (`html5-qrcode`) remains functional

## 4. Acceptance Criteria (BDD)

**Scenario 1: Operator app serves independently**

* **Given** the workspace has been migrated
* **When** the developer runs `ng serve operator`
* **Then** the operator app starts, is accessible in the browser, and does not require gateway or admin to be running

**Scenario 2: All existing operator routes are accessible**

* **Given** the operator app is running
* **When** the user navigates to each existing operator route
* **Then** each route renders the expected page without errors

**Scenario 3: Operator app only imports from shared**

* **Given** all source files under `projects/operator/`
* **When** TypeScript compilation runs
* **Then** no import references any file under `projects/admin/` or `projects/gateway/`

**Scenario 4: `ng build operator` produces a deployable artifact**

* **Given** the migrated workspace
* **When** `ng build operator --configuration production` is run
* **Then** a production build artifact is produced in `dist/operator/` without errors

**Scenario 5: Existing operator unit tests pass**

* **Given** all `*.spec.ts` files relocated to `projects/operator/`
* **When** `ng test operator` or `npm test` is run
* **Then** all previously passing operator tests continue to pass

## 5. Out of Scope

* Adding new operator routes or features
* Changing the visual design or layout of any operator page
* Implementing authentication guards on operator routes (TASK002)
