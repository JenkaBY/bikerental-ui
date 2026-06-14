---
name: angular-data-flow-orchestrator
description: This skill must be used when new ui model, mapper or store to be created.
---

## Phase 1: Model Definition (The Blueprint)

1. Identify the DTO: Locate the auto-generated DTO in `src/app/core/api/generated/models`. Never modify this.

2. Create UI Model: Define a clean TypeScript interface in `src/app/core/models`.

- Convert all ISO strings to Date or string formatted for the UI.
- Flatten nested objects if beneficial for the UI.
- Add functional flags (e.g., isSelectable: boolean, statusColor: string).

## Phase 2: Mapper Implementation (The Bridge)

1. Create a pure function in `src/app/core/mappers`.
2. Name pattern: map[Entity]DtoToUi.
3. Use strict typing: (dto: EntityDto, lookups?: any): EntityUI.
4. Constraint: No side effects. No class-based logic. Only pure object transformation.

## Phase 3: Store Implementation (The Engine)

1. Use a Service with `providedIn: 'root'` (Global) or local provider.
2. State Pattern:

- Define a `private _state = signal<StateInterface>(initialState)`.
- Use inject(ApiService) to fetch data.

3. The Enrichment Loop:

- Inject required LookupStores (e.g., `EquipmentStatusStore`).
- Create a `readonly items = computed(() => ...)` signal.

- Inside computed, iterate through the raw data and call the Mapper, passing items from LookupStores to resolve slugs/IDs into full metadata.

4. Pagination Logic:

- Maintain pageIndex, pageSize, and totalCount signals.
- On create or delete actions, trigger a full reload and reset pageIndex to 0.

## Phase 4: Component Integration (The View)

1. Smart Component:

- Inject the Store.
- Do not subscribe to Observables; use Signal-based getters.
- Pass signals directly to Dumb Components using the () syntax.

2. Dumb Component:

- Use `input()` and `output()` signals.
- Bind UI flags (colors, icons, disabled states) directly from the enriched UI Model.
