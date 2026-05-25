# System Design: FR-06 — CI/CD Feature Flag Override

## 1. Architectural Overview

This story extends the existing CI/CD pipeline with one additional build-time substitution step that resolves the `timeTravelEnabled` flag in the production environment file before the Angular compiler runs. The mechanism is identical to the already-established `BIKE_API_PLACEHOLDER` → `BIKE_RENTAL_API` substitution pattern, ensuring operational consistency and requiring no new pipeline infrastructure.

The only artefacts modified by this story are `build-and-deploy.yml` (the pipeline workflow) and the production environment configuration file (`environment.prod.ts`). No application source code, no component, and no service is changed by this story beyond what FR-01 already specifies for the environment file content.

---

## 2. Impacted Components

* **`GitHub Actions CI/CD Pipeline` (`build-and-deploy.yml`):**
  The build workflow must be extended with one additional `sed` substitution command placed immediately after the existing `BIKE_API_PLACEHOLDER` substitution line within the same shell step. The new command replaces the literal string `BIKE_TIME_TRAVEL_PLACEHOLDER` in `projects/shared/src/environments/environment.prod.ts` with the value of the `BIKE_TIME_TRAVEL_ENABLED` repository variable. The substitution must run before the Angular build step so that the TypeScript compiler sees a valid boolean literal.

* **`EnvironmentConfig` — Production File (`environment.prod.ts`):**
  As specified in FR-01, this file stores `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')` as the value for the `timeTravelEnabled` field. When the placeholder is replaced by `sed`, the expression resolves to the correct boolean. When unreplaced, it evaluates to `false`, disabling the feature without a build failure. This story formalises the CI/CD counterpart that makes that placeholder resolvable at build time.

* **Repository Deployment Documentation (README or runbook):**
  Must be updated to record the `BIKE_TIME_TRAVEL_ENABLED` repository variable: its purpose, allowed values (`true` / `false`), and the consequence of leaving it unset (build failure). This is consistent with how the `BIKE_RENTAL_API` variable is documented.

---

## 3. Abstract Data Schema Changes

No domain entities, data stores, or API payloads are modified by this story. The only artefact is a configuration value (`timeTravelEnabled`) in a static environment file that becomes a compiled constant in the SPA bundle.

---

## 4. Component Contracts & Payloads

* **Interaction: `GitHub Actions Runner` → `environment.prod.ts`**
  * **Protocol:** Shell `sed` substitution (file mutation before compilation)
  * **Payload Changes:** The pipeline reads the `BIKE_TIME_TRAVEL_ENABLED` environment variable (sourced from the repository variable of the same name) and substitutes all occurrences of `BIKE_TIME_TRAVEL_PLACEHOLDER` in `environment.prod.ts` with its value. The resulting file contains `timeTravelEnabled: true` or `timeTravelEnabled: false` — a valid TypeScript boolean literal — before the Angular CLI build step begins.

* **Interaction: `environment.prod.ts` → Angular Compiler**
  * **Protocol:** TypeScript compilation (static inclusion)
  * **Payload Changes:** The Angular build consumes the substituted `environment.prod.ts`. The compiled SPA bundle contains a boolean constant for `timeTravelEnabled`. If the placeholder was not replaced (variable missing), the string comparison expression evaluates to `false`; the TypeScript compiler sees a valid `boolean` value and the build succeeds with the feature disabled.

---

## 5. Updated Interaction Sequence

**Happy path — flag overridden to `false` (standard production):**

1. A developer or release manager ensures the GitHub Actions repository variable `BIKE_TIME_TRAVEL_ENABLED` is set to `false`.
2. The CI/CD pipeline is triggered (push or manual run).
3. The pipeline executes the environment substitution shell step:
   a. First substitution: replaces `BIKE_API_PLACEHOLDER` with the value of `BIKE_RENTAL_API`.
   b. Second substitution (new): replaces `BIKE_TIME_TRAVEL_PLACEHOLDER` with the value of `BIKE_TIME_TRAVEL_ENABLED` (`false`).
4. `environment.prod.ts` now contains `timeTravelEnabled: false` as a boolean literal.
5. Angular CLI compiles the Admin and Operator production bundles; TypeScript validates the boolean type successfully.
6. The deployed SPAs have `timeTravelEnabled: false`; no time-travel UI is rendered.

**Happy path — flag overridden to `true` (staging / demo):**

1. `BIKE_TIME_TRAVEL_ENABLED` is set to `true` in repository variables.
2. Same pipeline flow as above; substitution produces `timeTravelEnabled: true`.
3. Compiled bundles contain `timeTravelEnabled: true`; the time-travel widget is visible in both Admin and Operator.

**Unhappy path — variable not defined:**

1. `BIKE_TIME_TRAVEL_ENABLED` is absent from repository variables.
2. The `sed` command runs but finds no matching value; the placeholder string remains in `environment.prod.ts`.
3. Angular CLI invokes the TypeScript compiler.
4. The compiler evaluates `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')` as `false` — a valid `boolean` literal.
5. The build succeeds; the deployed SPA has `timeTravelEnabled: false` and no time-travel widget is rendered.

---

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** `BIKE_TIME_TRAVEL_ENABLED` controls a UI feature flag only — it does not gate a security boundary, encrypt data, or manage credentials. Storing it as a plain GitHub Actions repository variable (not a secret) is appropriate: its value (`true` or `false`) is not sensitive and may be audited freely. The existing `BIKE_RENTAL_API` variable follows the same pattern.

* **Scale & Performance:** One additional `sed` command adds negligible overhead (sub-millisecond) to the build pipeline. No caching strategy is affected. The substitution step is idempotent when the variable is defined; running the pipeline multiple times with the same variable value produces the same result.
