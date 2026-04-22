# TASK029 - OpenAPI Generator Setup (ng-openapi)

**Status:** In Progress  
**Added:** 2026-04-18  
**Updated:** 2026-04-18

## Original Request

Enable openapi generator based on the provided `http://localhost:8080/v3/api-docs/all` url using `ng-openapi`. Generated API classes should be separated by modules (tags).

## Thought Process

The project currently maintains hand-written raw API models in `core/models/` and services in `core/api/`. The goal is to auto-generate the API layer from the OpenAPI spec so that it stays in sync with the backend contract.

`ng-openapi` is the Angular-native OpenAPI code generator that produces:

- TypeScript interfaces/types in `models/`
- Angular `HttpClient`-based services in `services/` (one per OpenAPI tag)
- Injection tokens in `tokens/`
- Utilities: date transformer interceptor, file download helper, HTTP params builder
- `providers.ts` with `provideDefaultClient({ basePath })` for easy `app.config.ts` setup
- `index.ts` as main barrel export

Services are naturally tag-separated — one service file per OpenAPI tag (Tariffs, Equipment, EquipmentTypes, EquipmentStatuses, Customers, Rentals, Finance).

The generated code lives in `src/app/core/api/generated/` and is regenerated on demand via `npm run generate:api`. Existing hand-written models and mappers remain in place during the transition; the generated layer will eventually replace the raw HTTP calls while mappers adapt between generated types and domain types.

## Implementation Plan

- [x] Install `ng-openapi` as a dev dependency
- [x] Create `openapi.config.ts` pointing to `http://localhost:8080/v3/api-docs/all`, output `src/app/core/api/generated/`
- [x] Add `generate:api` npm script (`ng-openapi -c openapi.config.ts`)
- [x] Run generator to produce generated files
- [x] Register `provideDefaultClient({ basePath: environment.apiUrl })` in `app.config.ts`
- [ ] Migrate `core/api/` services to delegate to generated service classes (keep mapper layer intact)
- [ ] Clean up superseded hand-written models from `core/models/` (gradual, per-service)
- [x] Verify all existing tests still pass

## Progress Tracking

**Overall Status:** In Progress — 60%

### Subtasks

| ID   | Description                                          | Status      | Updated    | Notes                                            |
|------|------------------------------------------------------|-------------|------------|--------------------------------------------------|
| 29.1 | Install ng-openapi dev dependency                    | Complete    | 2026-04-18 |                                                  |
| 29.2 | Create openapi.config.ts with tag-separated services | Complete    | 2026-04-18 | Output: `src/app/core/api/generated/`            |
| 29.3 | Add `generate:api` npm script                        | Complete    | 2026-04-18 | `ng-openapi -c openapi.config.ts`                |
| 29.4 | Run generator and commit generated files             | Complete    | 2026-04-18 | 7 tag services + models + utils + providers      |
| 29.5 | Register generated provider in app.config.ts         | Complete    | 2026-04-18 | `provideDefaultClient({ basePath: env.apiUrl })` |
| 29.6 | Migrate core/api services to use generated services  | Not Started | 2026-04-18 | Keep mapper layer intact                         |
| 29.7 | Clean up superseded hand-written models              | Not Started | 2026-04-18 | Gradual, per-service                             |
| 29.8 | Verify tests pass                                    | Complete    | 2026-04-18 | 410 tests pass                                   |

## Progress Log

### 2026-04-18

- Task created. Used `ng-openapi` with the url (https://github.com/ng-openapi/ng-openapi):
  - Uninstalled `ng-openapi-gen`, removed old generated files
  - Installed `ng-openapi` as devDependency
  - Created `openapi.config.ts` (TypeScript config, not JSON)
  - Added `generate:api` npm script
  - Ran generator: produced 7 tag-separated services (Tariffs, Equipment, EquipmentTypes, EquipmentStatuses, Customers, Rentals, Finance) + models + tokens + utils + providers.ts
  - Registered `provideDefaultClient({ basePath: environment.apiUrl })` in `app.config.ts`
  - All 410 tests pass
