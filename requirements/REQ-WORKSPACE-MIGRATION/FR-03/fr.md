# User Story: FR-03 — Gateway Application Extraction

## 1. Description

**As a** developer
**I want to** have a dedicated `gateway` Angular application that serves as a developer landing page with navigation links to the admin and operator apps
**So that** during development I have a single entry point to discover and navigate to all apps, and in production the root URL of the deployed site presents a meaningful landing page

## 2. Context & Business Rules

* **Trigger:** A developer runs `npm start` or `ng serve gateway`
* **Rules Enforced:**
  * Source currently at `src/main.ts`, `src/app/app.ts`, `src/app/app.config.ts`, and `src/app/features/home/` must be relocated to `projects/gateway/`
  * The auth stub (`src/app/features/auth/`) may be relocated to `projects/gateway/` but introduces no new security behaviour (auth is intentionally unimplemented — TASK002)
  * Gateway must NOT lazy-load routes from the `admin` or `operator` application projects
  * Gateway only imports from `@bikerental/shared`; it has no runtime dependency on `admin` or `operator` source code
  * `npm start` must serve the gateway app by default
  * The home page must display navigable links pointing to the admin and operator app URLs

## 3. Non-Functional Requirements (NFRs)

* **Performance:** `ng serve gateway` must start in under 10 seconds on a developer machine
* **Security/Compliance:** No authentication or authorisation logic is added to gateway (TASK002 remains unimplemented)
* **Usability/Other:** Landing page is accessible and renders correctly in a modern desktop browser

## 4. Acceptance Criteria (BDD)

**Scenario 1: Gateway serves independently**

* **Given** the workspace has been migrated
* **When** the developer runs `npm start` or `ng serve gateway`
* **Then** the gateway app starts and is accessible in the browser without requiring `admin` or `operator` to also be running

**Scenario 2: Landing page displays links to other apps**

* **Given** the gateway app is running
* **When** a user opens the root URL
* **Then** the page displays visible navigation links to the admin app and the operator app

**Scenario 3: Gateway does not import from admin or operator**

* **Given** all source files under `projects/gateway/`
* **When** TypeScript compilation runs
* **Then** no import references any file under `projects/admin/` or `projects/operator/`

**Scenario 4: `ng build gateway` produces a deployable artifact**

* **Given** the migrated workspace
* **When** `ng build gateway --configuration production` is run
* **Then** a production build artifact is produced in `dist/gateway/`

## 5. Out of Scope

* Implementing authentication or authorisation in gateway
* Gateway lazy-loading admin or operator routes within its own bundle
* Adding new pages or features beyond what currently exists in `features/home/`
