# User Story: FR-01 — Workspace Configuration

## 1. Description

**As a** developer
**I want to** have `angular.json` declare `gateway`, `admin`, and `operator` as separate application projects and `shared` as a library project
**So that** each project can be independently built, served, tested, and linted without affecting the others

## 2. Context & Business Rules

* **Trigger:** The developer runs any Angular CLI command targeting a specific project (e.g., `ng build admin`)
* **Rules Enforced:**
  * `newProjectRoot` must be set to `projects`
  * Exactly 4 projects declared: `gateway` (app), `admin` (app), `operator` (app), `shared` (library)
  * Every application project must have `build`, `serve`, `test`, and `lint` architect targets
  * The `shared` project must have `build` and `lint` targets only (no `serve`)
  * No NgModules may be introduced by this configuration change
  * The Angular CLI schema version remains `1`

## 3. Non-Functional Requirements (NFRs)

* **Performance:** No regression in build time for individual projects vs. the previous single-project build
* **Security/Compliance:** N/A
* **Usability/Other:** Running `ng build <project>` for any of the 3 app projects must complete without errors on a clean checkout

## 4. Acceptance Criteria (BDD)

**Scenario 1: Build each application project independently**

* **Given** the workspace has been migrated and `npm ci` completed
* **When** the developer runs `ng build gateway`, `ng build admin`, or `ng build operator`
* **Then** each command succeeds and produces a build artifact in `dist/<project>/`

**Scenario 2: Serve each application project independently**

* **Given** the workspace has been migrated
* **When** the developer runs `ng serve gateway`, `ng serve admin`, or `ng serve operator`
* **Then** each app starts on its own configurable port without conflict

**Scenario 3: angular.json is schema-valid**

* **Given** the migrated `angular.json`
* **When** validated against the Angular CLI JSON schema
* **Then** no schema errors are reported and all 4 projects are listed under `projects`

**Scenario 4: Lint target available per project**

* **Given** the migrated `angular.json`
* **When** the developer runs `ng lint <project>` for any of the 4 projects
* **Then** the lint command completes without configuration errors

## 5. Out of Scope

* Migrating source files — source file moves are covered in FR-02 through FR-05
* Setting up path aliases — covered in FR-02
* Updating npm scripts — covered in FR-06
* Adding any new routing or features to any project
