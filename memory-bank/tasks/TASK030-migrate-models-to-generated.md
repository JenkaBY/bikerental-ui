# TASK030 - Migrate core/models to use generated API models

**Status:** Completed  
**Added:** 2026-04-20  
**Updated:** 2026-04-20

## Original Request

Migrate models from `src/app/core/models` directory to use the generated models from
`src/app/core/api/generated/models/index.ts`. Delete `src/app/core/domain/tariff.model.ts` (did
not exist) and update all direct imports.

## Thought Process

The project had two overlapping layers of model definitions:

1. **Hand-written `core/models/*.model.ts`** — both raw API shapes (`*Request`/`*Response`) and UI
   domain types (`Tariff`, `EquipmentType`, `TariffWrite`, etc.)
2. **Generated `core/api/generated/models/index.ts`** — auto-generated from OpenAPI spec; covers
   most `*Request`/`*Response` shapes

Goal: raw API shapes come exclusively from generated models; UI domain types stay in `core/models/`.

### Key Structural Differences Handled

| Aspect                              | Hand-written                            | Generated                                                       |
|-------------------------------------|-----------------------------------------|-----------------------------------------------------------------|
| Date fields                         | `string` (ISO)                          | `Date` (typed; runtime is still string from JSON)               |
| Field optionality                   | Mostly required                         | Mostly optional                                                 |
| `PricingParams`                     | Had index signature                     | No index signature (removed)                                    |
| `TariffV2Request.equipmentTypeSlug` | Required                                | Optional                                                        |
| `Page<T>`                           | Generic                                 | Specific pages only — kept generic locally                      |
| `BreakdownCostDetails`              | Required fields                         | Optional fields                                                 |
| `PaymentMethod` union               | 3 values                                | 6 values (expanded to match)                                    |
| `CreateRentalRequest`               | `equipmentId: number, duration: string` | `equipmentIds: number[], duration: number, operatorId required` |
| `ReturnEquipmentRequest`            | No `operatorId`                         | `operatorId: string` required                                   |

### What Stayed in `core/models/`

- `Tariff`, `TariffWrite`, `TariffSelection` — UI domain types
- `PricingType` — type alias
- `EquipmentType`, `EquipmentTypeWrite` — UI domain types
- `Page<T>` — generic wrapper (no generated equivalent)
- `RentalStatus`, `PatchOp`, `PaymentMethod` — type aliases
- `CostBreakdown`, `Money`, `PaymentInfo`, `RecordPrepaymentRequest`, `PrepaymentResponse` — not in generated
- `RecordPaymentRequest`, `RecordPaymentResponse`, `PaymentResponse` — not in generated

### Date Field Handling

Generated types declare `Date` for date fields, but `HttpClient` returns JSON strings at runtime.
Casts used in mappers and dialogs:

- `TariffMapper.fromResponse`: `r.validFrom as unknown as string` + `'T00:00:00'` for local-time parsing
- `TariffMapper.toRequest`: `toIsoDate(w.validFrom) as unknown as Date` — sends ISO date string
- `EquipmentDialogComponent`: `equipment.commissionedAt as unknown as string` for `parseDate()`
- `EquipmentRequest.commissionedAt`: `toIsoDate(...) as unknown as Date` in save()

## Implementation Plan

1. ✅ Check/remove `src/app/core/domain/tariff.model.ts` — did not exist
2. ✅ Refactor `common.model.ts` — re-export ProblemDetail/Pageable/PageRequest; keep `Page<T>`
3. ✅ Refactor `customer.model.ts` — re-export all from generated
4. ✅ Refactor `equipment.model.ts` — re-export all from generated
5. ✅ Refactor `equipment-type.model.ts` — re-export API types; keep EquipmentType/EquipmentTypeWrite
6. ✅ Refactor `equipment-status.model.ts` — re-export Request/UpdateRequest/Response from generated
7. ✅ Refactor `tariff.model.ts` — re-export API shapes; keep domain types; remove TariffSelectionResponse (now TariffSelectionV2Response)
8. ✅ Refactor `rental.model.ts` — re-export API shapes; keep local-only types; expand PaymentMethod union
9. ✅ Update `tariff.mapper.ts` — handle optional/Date fields; casts for runtime string dates
10. ✅ Update `equipment-type.mapper.ts` — handle optional fields in generated EquipmentTypeResponse
11. ✅ Update `tariff.service.ts` — use PageTariffV2Response + TariffSelectionV2Response; handle optional fields
12. ✅ Update `rental.service.ts` — remove RentalStatus from imports; widen status param to `string`
13. ✅ Update `equipment-status-list.component.ts` — `slug` is now optional, use `?? ''`
14. ✅ Update `equipment-status-dialog.component.ts` — `slug` is now optional, use `?? ''`
15. ✅ Update `equipment-dialog.component.ts` — date field casts for commissionedAt
16. ✅ Update `equipment-dialog.component.spec.ts` — cast string date mock to `unknown as Date`
17. ✅ Update `tariff.service.spec.ts` — use TariffSelectionV2Response; cast string validFrom
18. ✅ Update `rental.service.spec.ts` — align CreateRentalRequest + ReturnEquipmentRequest to generated shapes
19. ✅ Export PageTariffV2Response + PageRentalSummaryResponse from models index

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID    | Description                                | Status   | Updated    | Notes                                     |
|-------|--------------------------------------------|----------|------------|-------------------------------------------|
| 30.1  | Check/remove `core/domain/tariff.model.ts` | Complete | 2026-04-20 | Did not exist                             |
| 30.2  | Refactor `tariff.model.ts`                 | Complete | 2026-04-20 |                                           |
| 30.3  | Refactor `common.model.ts`                 | Complete | 2026-04-20 | Kept `Page<T>`                            |
| 30.4  | Refactor `equipment-type.model.ts`         | Complete | 2026-04-20 |                                           |
| 30.5  | Refactor `equipment-status.model.ts`       | Complete | 2026-04-20 | Added EquipmentStatusUpdateRequest export |
| 30.6  | Refactor `equipment.model.ts`              | Complete | 2026-04-20 |                                           |
| 30.7  | Refactor `customer.model.ts`               | Complete | 2026-04-20 |                                           |
| 30.8  | Refactor `rental.model.ts`                 | Complete | 2026-04-20 | Many local-only types retained            |
| 30.9  | Update mappers                             | Complete | 2026-04-20 | Date field casting handled                |
| 30.10 | Update services and components             | Complete | 2026-04-20 |                                           |
| 30.11 | Run tests and fix regressions              | Complete | 2026-04-20 | 410/410 tests pass                        |

## Progress Log

### 2026-04-20

- Task created and implemented in a single session
- `src/app/core/domain/tariff.model.ts` did not exist — no action needed for step 1
- All `*Request`/`*Response` API shapes migrated to re-exports from generated models
- `Page<T>` generic kept locally (generated only has specific page types)
- `TariffSelectionResponse` renamed to `TariffSelectionV2Response` per generated naming
- Mapper casts added for runtime string-vs-Date mismatch on date fields
- Fixed 6 downstream type errors in components, specs, and services
- All 410 tests pass, zero TypeScript errors

