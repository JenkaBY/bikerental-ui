# System Design: FR-06 — Build, Test, i18n & CI/CD Continuity

## 1. Architectural Overview

This story ensures that all developer tooling, automated test execution, internationalisation workflows, and the GitHub Actions CI/CD pipeline remain fully operational after the workspace migration. No new capabilities are introduced; the focus is exclusively on adapting existing tooling configuration to the new four-project workspace topology.

The GitHub Actions deployment strategy changes from a single-app build to a three-app sequential build whose artifacts are assembled into one combined directory tree before upload. The combined site structure mirrors the production URL layout: gateway at the root, admin at `/admin/`, operator at `/operator/`. All locale sub-directories, 404 fallbacks, and root redirects are reproduced for each app.

## 2. Impacted Components

* **`package.json` (npm scripts):** The following script targets are updated:
  * `start` → `ng serve gateway --configuration development`
  * `test` → Vitest workspace-aware invocation covering `projects/gateway`, `projects/admin`, `projects/operator`, and `projects/shared`
  * `test:watch` → same as `test` with watch mode enabled
  * `test:coverage` → same as `test` with coverage enabled; exclude glob updated to `projects/shared/**/core/api/generated/**`
  * `generate:api` → output path in `src/config/openapi.config.ts` already updated by FR-02; script invocation unchanged
  * `i18n:extract` → updated to extract from all three app projects and merge into a single `src/locale/messages.xlf`
  * `lint` → runs `ng lint` for all four projects
  * `fix` → ESLint fix + Prettier, scope updated to `projects/**`

* **`build-and-deploy.yml` (GitHub Actions Workflow):** The `build` job is restructured:
  * Step 1: Inject `BIKE_RENTAL_API` into each app's environment file (repeated for gateway, admin, operator).
  * Step 2: Build `gateway` with `--base-href /<repo>/` → output to `dist/gateway/browser/`.
  * Step 3: Build `admin` with `--base-href /<repo>/admin/` → output to `dist/admin/browser/`.
  * Step 4: Build `operator` with `--base-href /<repo>/operator/` → output to `dist/operator/browser/`.
  * Step 5: Assemble combined artifact — copy `dist/gateway/browser/` to staging root; copy `dist/admin/browser/` to `staging/admin/`; copy `dist/operator/browser/` to `staging/operator/`.
  * Step 6: Create root `index.html` redirect to `/en/` (same as current).
  * Step 7: Add `404.html` for each app's locale directories.
  * Step 8: Upload staging directory as GitHub Pages artifact.
  * The `quality`, `test`, `ci`, and `deploy` jobs are structurally unchanged.

* **Vitest Configuration:** Updated `include` glob patterns to discover `*.spec.ts` files across all four project roots. The `coverageExclude` pattern is updated from `src/app/core/api/generated/**` to `projects/shared/**/core/api/generated/**`.

* **`openapi.config.ts`:** Output path updated (driven by FR-02). No change to the npm script invocation.

* **i18n Extract Configuration:** The `i18n:extract` script is updated to invoke `ng extract-i18n` for each of the three app projects and merge the resulting XLF files into a single `src/locale/messages.xlf`. The `src/locale/messages.ru.xlf` translation file remains the single reference translation.

* **`shared` (Library Project):** No i18n extraction is run against the shared library directly — `$localize` calls in shared components are extracted as part of the consuming app's extraction pass.

## 3. Abstract Data Schema Changes

* **No persistent data entities are affected.** All changes in this story are to build tooling, CI pipeline configuration, and script definitions.

## 4. Component Contracts & Payloads

* **Interaction: CI `build` job → `gateway`, `admin`, `operator` build targets**
  * **Protocol:** Angular CLI architect invocation (sequential steps in one job)
  * **Payload Changes:** Each app is built with its own `--base-href`. The `BIKE_RENTAL_API` environment variable is injected into each app's `environment.prod.ts` before its build step runs.

* **Interaction: CI `build` job → GitHub Pages artifact**
  * **Protocol:** `actions/upload-pages-artifact@v4`
  * **Payload Changes:** Artifact path changes from `dist/bikerental-ui/browser` to the assembled staging directory. The staging directory has the structure: `/ (gateway)`, `/admin/ (admin)`, `/operator/ (operator)`.

* **Interaction: Vitest → all `*.spec.ts` files**
  * **Protocol:** Vitest workspace runner
  * **Payload Changes:** Include glob updated to `projects/**/*.spec.ts`. Coverage exclude updated to `projects/shared/**/core/api/generated/**`.

* **Interaction: `i18n:extract` → `src/locale/messages.xlf`**
  * **Protocol:** Angular CLI `extract-i18n` (sequential per app, then merge)
  * **Payload Changes:** Three separate extraction passes are merged into one output file. All existing message IDs are preserved; no translations are lost.

## 5. Updated Interaction Sequence

**Happy Path — Full CI pipeline on push to main:**

1. Push triggers `build-and-deploy.yml`.
2. `quality` job: runs Prettier check, ESLint for all 4 projects, TypeScript `noEmit` check.
3. `test` job: runs Vitest across all 4 projects with coverage; uploads coverage artifact.
4. `build` job (needs `quality` + `test`):
   a. `npm ci` installs dependencies.
   b. `BIKE_RENTAL_API` injected into `gateway`, `admin`, `operator` environment files.
   c. `ng build gateway --configuration production --base-href /<repo>/` → `dist/gateway/browser/`.
   d. `ng build admin --configuration production --base-href /<repo>/admin/` → `dist/admin/browser/`.
   e. `ng build operator --configuration production --base-href /<repo>/operator/` → `dist/operator/browser/`.
   f. Staging assembly: gateway files copied to root; admin to `staging/admin/`; operator to `staging/operator/`.
   g. Root `index.html` redirect created.
   h. `404.html` created for each locale directory of each app.
   i. Pages artifact uploaded from staging directory.
5. `ci` job: verifies all prior jobs succeeded.
6. `deploy` job: deploys to GitHub Pages.

**Happy Path — Developer runs `npm test` locally:**

1. Developer runs `npm test`.
2. Vitest discovers `*.spec.ts` files in `projects/gateway/`, `projects/admin/`, `projects/operator/`, `projects/shared/`.
3. All tests execute; results reported per project.
4. Exit code 0 if all pass.

**Happy Path — i18n extraction:**

1. Developer runs `npm run i18n:extract`.
2. `ng extract-i18n gateway` writes `gateway.xlf` to a temp location.
3. `ng extract-i18n admin` writes `admin.xlf` to a temp location.
4. `ng extract-i18n operator` writes `operator.xlf` to a temp location.
5. Merge step combines all three XLF files into `src/locale/messages.xlf`.
6. Developer updates `src/locale/messages.ru.xlf` with any new message IDs.

**Unhappy Path — One app build fails in CI:**

1. `ng build admin` exits with non-zero code.
2. The `build` job fails.
3. `ci` job evaluates `needs.build.result != 'success'` → exits with error.
4. `deploy` job does not run (depends on `ci`).
5. PR or push is marked as failed.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The `BIKE_RENTAL_API` secret is injected via `sed` into each app's environment file before that app's build step. The secret must not be logged; the existing `env:` block approach (no `echo` of the value) is retained for all three injection steps. Coverage artifacts do not contain source maps or secrets.

* **Scale & Performance:** Sequential app builds within a single CI job avoid GitHub Actions concurrency limits on free-tier runners. Total CI duration is bounded by the sum of three app build times plus the pre-existing quality and test job durations. The staging assembly step is a filesystem copy operation and adds negligible time. Vitest's parallel test runner operates across all projects in a single invocation, keeping test job duration proportional to the total test count rather than multiplicative per project.
