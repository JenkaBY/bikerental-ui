# User Story: FR-06 — Build, Test, i18n & CI/CD Continuity

## 1. Description

**As a** developer and CI pipeline
**I want to** have all existing npm scripts, Vitest tests, i18n extraction, and the GitHub Actions deployment workflow continue to function correctly after the workspace migration
**So that** no existing development workflow, test coverage, or deployment process is broken by the migration

## 2. Context & Business Rules

* **Trigger:** Any developer runs an npm script, or a commit is pushed to `main`/`master` triggering the CI pipeline
* **Rules Enforced:**
  * All 8 npm scripts must remain functional or have documented replacements with equivalent behaviour:
    `npm start`, `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run fix`, `npm run generate:api`, `npm run i18n:extract`, `npm run lint`
  * `npm start` must serve the `gateway` project
  * `npm test` must run Vitest across all 4 projects (gateway, admin, operator, shared)
  * `npm run generate:api` must output the generated API client to the new location inside `projects/shared/`
  * `npm run i18n:extract` must extract `$localize` strings from all 3 app projects and produce a single merged `messages.xlf`
  * Coverage reporting must exclude the auto-generated API client in its new location (`projects/shared/**/api/generated/**`)
  * The existing `build-and-deploy.yml` GitHub Actions workflow must be updated — not removed — to build all 3 apps and combine their outputs into a single GitHub Pages deployment
  * GitHub Pages deployment structure: gateway at the root (`/`), admin at `/admin/`, operator at `/operator/`
  * The root redirect to `/en/` and `404.html` SPA routing support must continue to work for each deployed app
  * The `BIKE_RENTAL_API` environment variable injection step must apply to all 3 app production builds
  * Pre-commit hooks (Husky, lint-staged, commitlint) must remain functional without reconfiguration

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Total CI pipeline duration must not exceed 1.5× the pre-migration duration
* **Security/Compliance:** The `BIKE_RENTAL_API` secret injection must apply to every app build, not just gateway
* **Usability/Other:** Coverage report artifact uploaded in CI must cover all 4 projects

## 4. Acceptance Criteria (BDD)

**Scenario 1: All npm scripts execute without error**

* **Given** the workspace has been migrated and `npm ci` completed
* **When** each of the 8 npm scripts is executed in sequence on a clean checkout
* **Then** each command exits with code 0

**Scenario 2: Tests run across all projects**

* **Given** the migrated workspace
* **When** `npm test` is run
* **Then** Vitest discovers and executes `*.spec.ts` files from all 4 projects and reports results

**Scenario 3: Coverage excludes generated code in new location**

* **Given** `npm run test:coverage` is run
* **Then** files matching `projects/shared/**/api/generated/**` are excluded from coverage metrics

**Scenario 4: i18n extraction produces single merged XLF**

* **Given** `$localize` strings exist in gateway, admin, and operator source files
* **When** `npm run i18n:extract` is run
* **Then** a single `messages.xlf` is produced containing strings from all 3 apps; no strings are lost vs. pre-migration

**Scenario 5: CI pipeline builds all apps and deploys to GitHub Pages**

* **Given** a commit is pushed to `main`
* **When** the `build-and-deploy.yml` workflow runs
* **Then** all 3 apps are built, their artifacts are combined, and the deployment places gateway at `/`, admin at `/admin/`, and operator at `/operator/` on GitHub Pages

**Scenario 6: API environment variable injection applied to all apps**

* **Given** the `BIKE_RENTAL_API` repository variable is set
* **When** the CI build step runs for each app
* **Then** the API URL is injected into each app's production environment file

**Scenario 7: `ru` locale build succeeds for each app**

* **Given** `messages.ru.xlf` is present
* **When** `ng build <project> --configuration production` is run with `localize: ["ru", "en"]`
* **Then** both locale builds succeed for all 3 apps

## 5. Out of Scope

* Introducing per-project separate XLF files or per-project i18n workflows
* Adding new CI jobs beyond what is already defined (quality, test, build, ci, deploy)
* Setting up Nx or any dependency graph tool for affected-only builds
* Changing the GitHub Pages custom domain or repository-level Pages configuration
