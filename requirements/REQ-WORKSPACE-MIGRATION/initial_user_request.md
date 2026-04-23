# Initial User Request — Angular Workspace Migration

## Original Request

Migrate the existing single-project Angular SPA (`bikerental-ui`) into an **Angular multi-project workspace**.

### Target workspace structure

| Project    | Type        | Description                                                                      |
|------------|-------------|----------------------------------------------------------------------------------|
| `admin`    | Application | Desktop-first CRUD management area. Currently lives at `src/app/features/admin/` |
| `operator` | Application | Mobile-first rental/return flow. Currently lives at `src/app/features/operator/` |
| `gateway`  | Application | Entry-point shell / landing page / developer portal                              |
| `shared`   | Library     | Shared components, models, mappers, validators, constants, core services.        |

### Scope stated by user

1. Convert `angular.json` to multi-project format
2. Move `admin`, `operator`, `gateway` feature code into `projects/`
3. Extract `src/app/shared/` + `src/app/core/` into an internal Angular library project (`shared`)
4. Configure `tsconfig.json` path aliases so apps import from `@bikerental/shared`
5. Each app gets own `build`, `test`, `serve` targets in `angular.json`
6. `messages.xlf` and `$localize` usage continue to work (single merged XLF)
7. `openapi.config.ts` output path updated to point inside `shared` library
8. Vitest config updated; all existing `*.spec.ts` tests continue to run

### Clarifications captured during gap analysis

- **Deployability**: All 3 apps deployed on single server. Gateway = landing page with links to admin and operator. Each app independently servable in development.
- **Shared library type**: Internal path-alias library only — no ng-packagr overhead.
- **Auth feature**: Gateway is a landing page; no auth/security features in gateway.
- **i18n strategy**: Single merged XLF — current behaviour preserved.
- **CI/CD**: Build all projects. GitHub Pages deployment = single combined site (gateway at root, admin at `/admin/`, operator at `/operator/`).
- **Generated code**: Auto-generated API client can be relocated to `projects/shared/` but remains non-editable.
- **CI/CD continuity**: Existing `build-and-deploy.yml` workflow must be updated (not removed).
