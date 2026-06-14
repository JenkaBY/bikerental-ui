---
description: Migrate a service to the project's signal-store + mapper + domain-model pipeline, decoupling UI models from generated API models.
argument-hint: "[service or entity name, e.g. customer]"
---

Target: `$ARGUMENTS` (the service/entity to migrate, e.g. `customer`). If empty, ask which service.

Apply the project's three-layer data pipeline and signal-store pattern (see the `angular-signals`,
`angular-http`, and `angular-data-flow-orchestrator` skills, plus CLAUDE.md "Signal Store pattern"):

1. Migrate usage of models from `src/app/core/api/generated/models` to the UI domain models in
   `src/app/core/models`.
2. Create mapper functions in `src/app/core/mappers`. If an object contains a reference to a lookup
   entity (e.g. a field name containing `slug` or `type`), inject the proper lookup store and map the
   object itself instead of carrying the reference.
3. Migrate to a global state store persisted in `src/app/core/state`. Create the mapper in
   `src/app/core/mappers` and the models in `src/app/core/models` to decouple UI models from API
   models. Add and use a `loading` state while loading the entity list, and a `saving` state while
   creating or updating an entity.
4. Use the import aliases defined in `tsconfig.json`:
   - `@api-models` → `src/app/core/api/generated/models/index.ts`
   - `@ui-models` → `src/app/core/models/index.ts`
   - `@store` → `src/app/core/state/`

Verify with `npm run build` and `npm test` when done.
