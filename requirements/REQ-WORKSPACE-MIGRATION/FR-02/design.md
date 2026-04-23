# System Design: FR-02 — Shared Internal Library Extraction

## 1. Architectural Overview

This story restructures the internal source topology by consolidating all cross-cutting code — UI components, services, domain models, mappers, validators, constants, and the auto-generated API client — into a single library project root (`projects/shared/`). The library exposes its surface through a public API barrel file. Application projects reference the library exclusively through a workspace-level path alias (`@bikerental/shared`), enforced by the TypeScript compiler configuration.

The auto-generated API client is physically relocated inside `projects/shared/` but retains its non-editable, regeneration-driven lifecycle. The `openapi.config.ts` output path is updated to point to the new location. All existing granular path aliases (`@api-models`, `@ui-models`, `@store.*`) are re-rooted to resolve inside `projects/shared/`, preserving backwards compatibility for files that use them.

## 2. Impacted Components

* **`shared` (New Library Project):** Gains all source currently under `src/app/core/` and `src/app/shared/`. Defines a `public-api.ts` barrel that re-exports everything application projects need. Has no imports from `gateway`, `admin`, or `operator`. The auto-generated API client lives at `projects/shared/src/core/api/generated/` and is regenerated in-place by `npm run generate:api`.

* **`gateway` (Application Project):** All imports that previously pointed to `src/app/core/**` or `src/app/shared/**` are updated to reference `@bikerental/shared` or the retained granular aliases. No functional change to the gateway component.

* **`admin` (Application Project):** Same import path update as gateway. All admin feature components and stores that consumed `@api-models`, `@ui-models`, `@store.*`, or direct relative paths into `core/` or `shared/` now resolve through the updated aliases.

* **`operator` (Application Project):** Same import path update as gateway and admin.

* **`openapi.config.ts` (API Generation Configuration):** The `output` field is updated from `../app/core/api/generated` to the new path inside `projects/shared/`. The rest of the configuration is unchanged.

* **`tsconfig.json` (Workspace TypeScript Configuration):** Three changes:
  * New alias: `@bikerental/shared` → `projects/shared/src/public-api.ts`
  * `@api-models` re-rooted → `projects/shared/src/core/api/generated/models/index.ts`
  * `@ui-models` re-rooted → `projects/shared/src/core/models/index.ts`
  * `@store.*` re-rooted → `projects/shared/src/core/state/*`

## 3. Abstract Data Schema Changes

* **No domain data entities are added or modified.** The relocation moves existing models without altering their structure, attributes, or relationships. The auto-generated API types retain identical shapes post-move.

## 4. Component Contracts & Payloads

* **Interaction: `admin` → `shared` (via `@bikerental/shared`)**
  * **Protocol:** TypeScript path alias (compile-time resolution)
  * **Payload Changes:** No payload structure changes. The alias now resolves through `projects/shared/src/public-api.ts`. All previously available exports must remain available.

* **Interaction: `operator` → `shared` (via `@bikerental/shared`)**
  * **Protocol:** TypeScript path alias (compile-time resolution)
  * **Payload Changes:** Same as above.

* **Interaction: `gateway` → `shared` (via `@bikerental/shared`)**
  * **Protocol:** TypeScript path alias (compile-time resolution)
  * **Payload Changes:** Same as above.

* **Interaction: `openapi.config.ts` → `projects/shared/src/core/api/generated/`**
  * **Protocol:** File system write (code generation tool output)
  * **Payload Changes:** Output directory updated. Generated file structure and content are identical to pre-migration output.

## 5. Updated Interaction Sequence

**Happy Path — Application project consumes shared service:**

1. Developer writes `import { EquipmentStore } from '@bikerental/shared'` in an admin component.
2. TypeScript compiler resolves `@bikerental/shared` → `projects/shared/src/public-api.ts`.
3. `public-api.ts` re-exports `EquipmentStore` from its internal path.
4. Compilation succeeds; no import error.
5. At runtime, the bundler includes the shared module in the app bundle.

**Happy Path — Regenerate API client:**

1. Developer runs `npm run generate:api`.
2. `ng-openapi` reads `src/config/openapi.config.ts`.
3. Config specifies output path as `projects/shared/src/core/api/generated/`.
4. Generator fetches the OpenAPI spec and writes generated files to the new path.
5. Existing files at the old path (`src/app/core/api/generated/`) are no longer present (removed as part of migration).
6. Application projects continue to import generated types through `@api-models` and `@bikerental/shared` aliases.

**Unhappy Path — Circular import from shared into an app:**

1. A developer attempts to import a symbol from `projects/admin/` inside `projects/shared/`.
2. TypeScript compiler resolves the import and detects a cross-boundary reference.
3. If a linting rule or CI check for circular dependencies is active, it reports a violation.
4. Build fails or lint reports an error; the import must be removed.

**Happy Path — Granular alias resolves post-migration:**

1. An existing file uses `import { RentalResponse } from '@api-models'`.
2. TypeScript resolves `@api-models` → `projects/shared/src/core/api/generated/models/index.ts`.
3. Compilation succeeds without any change to the importing file.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The public API barrel file controls what is exported from the shared library. Internal implementation details that should not be consumed by apps must not be re-exported from `public-api.ts`. The generated API client models are re-exported only through the `@api-models` alias, not directly via `@bikerental/shared`, preserving the existing three-layer data pipeline boundary.

* **Scale & Performance:** No separate compilation step is introduced for the shared library (no `ng-packagr`). All source is compiled inline with each consuming application's build, preserving tree-shaking at the application level. The path alias resolution adds zero runtime overhead.
