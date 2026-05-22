# Task 001: Extend the Environment Injection Step in `build-and-deploy.yml`

> **Applied Skill:** `github-actions-ci-cd-best-practices.instructions.md` — env variables scoped to the step that uses them; `sed` substitution runs before Angular CLI build; identical pattern to the existing `BIKE_API_PLACEHOLDER` substitution

## 1. Objective

Extend the existing `Inject Bike Rental API host into all apps` build step to also substitute `BIKE_TIME_TRAVEL_PLACEHOLDER` in `environment.prod.ts` with the value of the `BIKE_TIME_TRAVEL_ENABLED` repository variable, before any Angular build target runs.

## 2. File to Modify / Create

* **File Path:** `.github/workflows/build-and-deploy.yml`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```yaml
# No new imports — YAML workflow file modification only
```

**Code to Add/Replace:**

* **Location:** Inside the `build` job, find the step named `Inject Bike Rental API host into all apps`. Extend its `env` block with the new variable and append the second `sed` command to the `run` block.

* **Snippet (Replace):**

```yaml
      - name: Inject Bike Rental API host into all apps
        env:
          BIKE_RENTAL_API: ${{ vars.BIKE_RENTAL_API }}
          BIKE_TIME_TRAVEL_ENABLED: ${{ vars.BIKE_TIME_TRAVEL_ENABLED }}
        run: |
          sed -i "s|BIKE_API_PLACEHOLDER|${BIKE_RENTAL_API}|g" projects/shared/src/environments/environment.prod.ts
          sed -i "s|BIKE_TIME_TRAVEL_PLACEHOLDER|${BIKE_TIME_TRAVEL_ENABLED}|g" projects/shared/src/environments/environment.prod.ts
```

**Key Rules:**

* `BIKE_TIME_TRAVEL_ENABLED` is declared in the step's `env` block (not the job-level `env`) — consistent with how `BIKE_RENTAL_API` is scoped.
* The new `sed` command is placed **immediately after** the existing API URL substitution so both substitutions happen in a single atomic shell step before any build target runs (FR acceptance criterion 4).
* When `BIKE_TIME_TRAVEL_ENABLED` is not set as a repository variable, GitHub Actions expands `${{ vars.BIKE_TIME_TRAVEL_ENABLED }}` to an empty string. The `sed` command then replaces `BIKE_TIME_TRAVEL_PLACEHOLDER` with an empty string, producing `timeTravelEnabled: ('' === 'true')` which TypeScript compiles as `false`. The build succeeds and the feature is silently disabled.

## 4. Validation Steps

skip