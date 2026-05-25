# User Story: FR-06 — CI/CD Feature Flag Override

## 1. Description

**As a** DevOps engineer or release manager
**I want to** control the `timeTravelEnabled` flag for production builds via a GitHub Actions variable without touching source code
**So that** the feature can be turned on in a staging or demo deployment while remaining off in the live production deployment, using the same mechanism already in place for the API URL

## 2. Context & Business Rules

* **Trigger:** The CI/CD build job runs and needs to resolve the correct value for `timeTravelEnabled` before compiling the production bundle
* **Rules Enforced:**
  * The existing mechanism: `environment.prod.ts` contains the string literal `BIKE_API_PLACEHOLDER` for `apiUrl`; the build workflow replaces it with the real URL via `sed -i "s|BIKE_API_PLACEHOLDER|${BIKE_RENTAL_API}|g"`
  * The same pattern is applied to `timeTravelEnabled`: `environment.prod.ts` stores the expression `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')` as the value for `timeTravelEnabled`
  * The CI/CD workflow (`build-and-deploy.yml`) adds a `sed` replacement step immediately after the existing API URL replacement: `sed -i "s|BIKE_TIME_TRAVEL_PLACEHOLDER|${BIKE_TIME_TRAVEL_ENABLED}|g" projects/shared/src/environments/environment.prod.ts`
  * `BIKE_TIME_TRAVEL_ENABLED` is a GitHub Actions repository variable (not a secret); its allowed values are `true` or `false`
  * When `BIKE_TIME_TRAVEL_ENABLED` is not set in the repository variables, the `sed` command leaves the placeholder string unreplaced; the expression `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')` evaluates to `false` and the feature is silently disabled — the build succeeds and no time-travel widget is rendered
  * The variable must be documented in the repository's deployment runbook or README so that new team members know it exists

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — one extra `sed` line in the build script; negligible overhead
* **Security/Compliance:** The variable controls a UI feature flag only, not a security boundary; it is appropriate to store as a plain repository variable rather than an encrypted secret
* **Usability/Other:** The GitHub Actions variable name `BIKE_TIME_TRAVEL_ENABLED` must follow the existing naming convention (`BIKE_` prefix used by all project-level variables)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Flag overridden to true in CI**

* **Given** the GitHub Actions repository variable `BIKE_TIME_TRAVEL_ENABLED` is set to `true`
* **When** the build workflow runs and compiles the production bundle
* **Then** the built SPA has `timeTravelEnabled: true` in its compiled environment and the time-travel widget is visible

**Scenario 2: Flag overridden to false in CI**

* **Given** `BIKE_TIME_TRAVEL_ENABLED` is set to `false`
* **When** the build workflow runs
* **Then** the built SPA has `timeTravelEnabled: false` and the widget is absent

**Scenario 3: Missing variable defaults feature to disabled**

* **Given** `BIKE_TIME_TRAVEL_ENABLED` is not defined in repository variables
* **When** the build workflow runs and compiles the production bundle
* **Then** the placeholder string is not replaced, the expression `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')` evaluates to `false`, the build succeeds, and the time-travel widget is absent from the deployed SPA

**Scenario 4: sed step positioned correctly in workflow**

* **Given** the `build-and-deploy.yml` workflow file
* **When** a developer reads it
* **Then** the `BIKE_TIME_TRAVEL_PLACEHOLDER` replacement step appears in the same shell step as, and immediately after, the `BIKE_API_PLACEHOLDER` replacement

## 5. Out of Scope

* Per-environment (staging vs production) variable differentiation — that is handled by GitHub Environments configuration outside this story
* Runtime feature flag toggling without a rebuild
* Encrypting the variable as a secret
