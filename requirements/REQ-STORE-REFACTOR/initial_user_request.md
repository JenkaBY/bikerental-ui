# REQ-STORE-REFACTOR — Store Architecture & Model Hardening

## Origin

Captured from the architecture review in
[`docs/store-architecture-review.md`](../../docs/store-architecture-review.md) (branch
`feature/improve-stores`, 2026-06-14). The review found the rental/customer store cluster hard to
extend due to uncontrolled state mutation, contradictory balance logic, inconsistent import paths,
and presentation/state concerns leaking into the domain-model layer.

## Goal

Make the store and model layers safe to extend through **incremental, behavior-preserving** refactors.
No rewrite. Each Functional Requirement below is independently shippable and ordered by impact.

## Functional Requirements

| FR | Title | Phase | Severity |
|----|-------|-------|----------|
| [FR-01](FR-01/fr.md) | Correctness quick wins (`isLoading` bug, cross-project import, dead template branch) | 0 | High |
| [FR-02](FR-02/fr.md) | Encapsulate `RentalStore` state mutations (private `patchState`) | 1 | High |
| [FR-03](FR-03/fr.md) | Single source of truth for balance sufficiency | 1 | High |
| [FR-04](FR-04/fr.md) | Standardize shared import paths + lint guard | 2 | High |
| [FR-05](FR-05/fr.md) | Relocate store-state shapes; strip presentation from domain models | 3 | Medium |
| [FR-06](FR-06/fr.md) | Remove dead `BatchRentalPropertyStore` API; consolidate batch-fetch & summary view-models | 3 | Medium |

`FR-07` (split `RentalStore` into create/detail stores) is **proposed but deferred** — see the review,
Phase 4. It is intentionally not specified yet; revisit only if create/detail divergence keeps causing churn.

## Constraints (inherited from AGENTS.md / CLAUDE.md)

- Standalone components, `OnPush`, `inject()`, signals; no `any`, no NgModules, no NgRx.
- Domain types live in `core/models`; generated DTOs in `core/api/generated`; conversion in `core/mappers`.
- All behavior must be preserved and covered by the existing Vitest suite (`npm test`); add tests where a fix changes a previously-untested path.
- Run `npm run fix` before committing.
