# TASK029 - OpenAPI Generator Setup (ng-openapi-gen)

**Status:** Pending  
**Added:** 2026-04-18  
**Updated:** 2026-04-18

## Original Request

Enable openapi generator based on the provided `docs/api-docs/all.json` swagger file using `ng-openapi-gen`. Generated API classes should be separated by modules (tags).

## Thought Process

The project currently maintains hand-written raw API models in `core/models/` and services in `core/api/`. The goal is to auto-generate the API layer from the OpenAPI spec so that it stays in sync with the backend contract.

`ng-openapi-gen` is the Angular-native OpenAPI code generator that produces:

- Tag-separated `ApiModule`s (one per OpenAPI tag)
- Typed request/response models
- Angular `HttpClient`-based services

The generated code should live in a dedicated folder (e.g., `src/app/core/api/generated/`) and be regenerated on demand. Existing hand-written models and mappers remain in place — the generated layer replaces only the raw HTTP calls, while the mapper layer adapts between generated models and domain types.

## Implementation Plan

- [ ] Install `ng-openapi-gen` as a dev dependency
- [ ] Add `ng-openapi-gen` config file (`ng-openapi-gen.json`) pointing to `docs/api-docs/all.json`, output to `src/app/core/api/generated/`, with tag-based module splitting enabled (`"useTags": true`)
- [ ] Add an npm script `generate:api` to `package.json` that runs `ng-openapi-gen`
- [ ] Run `npm run generate:api` to produce generated files
- [ ] Register the generated `ApiModule` (or individual tag modules) in `app.config.ts` providers
- [ ] Update existing `core/api/` services to use generated service classes instead of direct `HttpClient` calls, delegating to mappers as before
- [ ] Update `core/models/` — remove types now covered by generated models (or keep both during transition)
- [ ] Verify all existing tests still pass

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID   | Description                                         | Status      | Updated    | Notes                                 |
|------|-----------------------------------------------------|-------------|------------|---------------------------------------|
| 29.1 | Install ng-openapi-gen dev dependency               | Not Started | 2026-04-18 |                                       |
| 29.2 | Create ng-openapi-gen.json config with useTags:true | Not Started | 2026-04-18 | Output: `src/app/core/api/generated/` |
| 29.3 | Add `generate:api` npm script                       | Not Started | 2026-04-18 |                                       |
| 29.4 | Run generator and commit generated files            | Not Started | 2026-04-18 |                                       |
| 29.5 | Register generated modules in app.config.ts         | Not Started | 2026-04-18 |                                       |
| 29.6 | Migrate core/api services to use generated services | Not Started | 2026-04-18 | Keep mapper layer intact              |
| 29.7 | Clean up superseded hand-written models             | Not Started | 2026-04-18 | Gradual, per-service                  |
| 29.8 | Verify tests pass                                   | Not Started | 2026-04-18 |                                       |

## Progress Log

### 2026-04-18

- Task created. Approach: use `ng-openapi-gen` with `useTags: true` to produce tag-separated service modules, output to a dedicated `generated/` subfolder to keep manual code isolated.
