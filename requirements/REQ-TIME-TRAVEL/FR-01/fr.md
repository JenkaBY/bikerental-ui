# User Story: FR-01 — Feature Flag Configuration

## 1. Description

**As a** developer
**I want to** control the entire time-travel feature via a single boolean flag in the shared environment files
**So that** the widget is unconditionally visible in local development, unconditionally hidden in production builds, and the default can be changed without modifying source files for a specific environment

## 2. Context & Business Rules

* **Trigger:** Any build or deployment that targets dev or prod environments
* **Rules Enforced:**
  * The flag is named `timeTravelEnabled` and placed in the shared `environment.ts` and `environment.prod.ts` files alongside the existing `apiUrl`, `healthPollIntervalMs`, `defaultLocale`, and `brand` fields
  * Default value in `environment.ts` (development): `true`
  * Default value in `environment.prod.ts` (production): the placeholder literal `BIKE_TIME_TRAVEL_PLACEHOLDER` (overwritten before the build by the CI/CD pipeline — see FR-06; the effective default when no override is applied is `false`)
  * All time-travel UI (toolbar widget and dialog) must be completely absent from the DOM when the flag evaluates to `false` — not merely hidden via CSS
  * No other mechanism (route guard, user permission, etc.) is needed to control visibility; the flag alone is the single source of truth

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — flag is read once at bootstrap; no runtime overhead
* **Security/Compliance:** The `/api/dev/time` endpoint is a developer utility; ensuring the flag is `false` in production prevents accidental exposure of time-manipulation controls to end users
* **Usability/Other:** The flag must be a plain TypeScript `boolean` (not a string) in the compiled app so that `@if (timeTravelEnabled)` template guards work without type coercion

## 4. Acceptance Criteria (BDD)

**Scenario 1: Widget visible in development**

* **Given** `environment.timeTravelEnabled` is `true`
* **When** any page that hosts `AppToolbarComponent` is loaded
* **Then** the server-time display is present in the toolbar DOM

**Scenario 2: Widget absent in production**

* **Given** `environment.timeTravelEnabled` is `false`
* **When** any page that hosts `AppToolbarComponent` is loaded
* **Then** no time-travel element exists in the toolbar DOM

**Scenario 3: Flag defaults are correct in source files**

* **Given** the source file `environment.ts`
* **When** a developer opens it
* **Then** `timeTravelEnabled` is `true`

* **Given** the source file `environment.prod.ts`
* **When** a developer opens it
* **Then** `timeTravelEnabled` is the expression `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')`; when the placeholder is not replaced by CI/CD, the expression evaluates to `false` and the feature is disabled

## 5. Out of Scope

* Per-user or role-based toggling of the feature
* Runtime toggling without a rebuild
* Feature flags for other features
