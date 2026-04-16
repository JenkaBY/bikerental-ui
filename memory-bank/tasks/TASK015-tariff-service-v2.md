# TASK015 - Update TariffService & Models to v2 API + Domain Layer

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Depends on:** TASK003 (admin shell complete)  
**Blocks:** TASK016, TASK017, TASK018, TASK019, TASK020, TASK021, TASK022  
**Parent:** TASK008

## Original Request

Update the existing `TariffService` and related TypeScript models to use the new `/api/tariffs` base URL,
v2 schema shapes (`TariffV2Request`, `TariffV2Response`, `PricingParams`, `PricingType`), **and** introduce
the domain/mapper layer so that all UI code uses the clean `Tariff` domain object instead of raw response types.

## Architecture

This task establishes the full conversion pipeline for the tariff domain:

```
Backend → TariffV2Response → TariffMapper.fromResponse() → Tariff → UI Components
UI Components → TariffWrite → TariffMapper.toRequest() → TariffV2Request → Backend
```

### Layer responsibilities

| Layer                              | File                              | Types exposed           |
|------------------------------------|-----------------------------------|-------------------------|
| API types (raw)                    | `core/models/tariff.model.ts`     | `TariffV2Request`, `TariffV2Response`, `PricingParams`, `PricingType` |
| Domain model (UI-facing)           | `core/domain/tariff.model.ts`     | `Tariff`, `TariffWrite` |
| Mapper (conversion)                | `core/mappers/tariff.mapper.ts`   | `TariffMapper`          |
| HTTP service (boundary)            | `core/api/tariff.service.ts`      | accepts/returns `Tariff` / `TariffWrite` / `Page<Tariff>` |

## v2 API endpoints

| Method | Path                           | Description             |
|--------|--------------------------------|-------------------------|
| GET    | `/api/tariffs`                 | Paginated list          |
| POST   | `/api/tariffs`                 | Create tariff           |
| GET    | `/api/tariffs/{id}`            | Get by ID               |
| PUT    | `/api/tariffs/{id}`            | Update tariff           |
| PATCH  | `/api/tariffs/{id}/activate`   | Activate tariff         |
| PATCH  | `/api/tariffs/{id}/deactivate` | Deactivate tariff       |
| GET    | `/api/tariffs/active`          | Active tariffs by type  |
| GET    | `/api/tariffs/selection`       | Tariff selection        |
| GET    | `/api/tariffs/pricing-types`   | Available pricing types |
| GET    | `/api/tariffs/calculate`       | Cost calculation        |

## New API type shapes (core/models/)

**`PricingType`** — `'DEGRESSIVE_HOURLY' | 'FLAT_HOURLY' | 'DAILY' | 'FLAT_FEE' | 'SPECIAL'`

**`PricingParams`** — all fields optional, relevant subset populated per type:
- `DEGRESSIVE_HOURLY`: `firstHourPrice`, `hourlyDiscount`, `minimumHourlyPrice`
- `FLAT_HOURLY`: `hourlyPrice`
- `DAILY`: `dailyPrice`, `overtimeHourlyPrice`
- `FLAT_FEE`: `issuanceFee`, `minimumDurationMinutes`, `minimumDurationSurcharge`
- `SPECIAL`: *(empty object — no fields)*

**`TariffV2Request`** (required: `name`, `pricingType`, `params`, `validFrom`)

**`TariffV2Response`**: `id`, `name`, `description`, `equipmentType`, `pricingType`, `params`,
`validFrom`, `validTo`, `version`, `status`

## Domain model (core/domain/)

```typescript
// core/domain/tariff.model.ts
import { PricingParams, PricingType, TariffStatus } from '../models';

export interface Tariff {
  id: number;
  name: string;
  description?: string;
  equipmentType?: string;
  pricingType: PricingType;
  params: PricingParams;
  validFrom: Date;       // Date object — NOT an ISO string
  validTo?: Date;
  version?: string;
  status: TariffStatus;
}

export interface TariffWrite {
  name: string;
  description?: string;
  equipmentTypeSlug?: string;
  pricingType: PricingType;
  params: PricingParams;
  validFrom: Date;
  validTo?: Date;
}
```

## Mapper (core/mappers/)

```typescript
// core/mappers/tariff.mapper.ts
export class TariffMapper {
  static fromResponse(r: TariffV2Response): Tariff {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      equipmentType: r.equipmentType,
      pricingType: r.pricingType,
      params: { ...r.params },
      validFrom: new Date(r.validFrom),
      validTo: r.validTo ? new Date(r.validTo) : undefined,
      version: r.version,
      status: r.status ?? 'INACTIVE',
    };
  }

  static toRequest(w: TariffWrite): TariffV2Request {
    return {
      name: w.name,
      description: w.description,
      equipmentTypeSlug: w.equipmentTypeSlug,
      pricingType: w.pricingType,
      params: { ...w.params },
      validFrom: toIsoDate(w.validFrom),           // from shared/utils/date.util
      validTo: w.validTo ? toIsoDate(w.validTo) : undefined,
    };
  }
}
```

## Updated TariffService method signatures (core/api/)

```text
getAll(pageable?: Pageable): Observable<Page<Tariff>>        // maps items via fromResponse
getById(id: number): Observable<Tariff>
getActive(equipmentType: string): Observable<Tariff[]>
create(write: TariffWrite): Observable<Tariff>              // toRequest → POST → fromResponse
update(id: number, write: TariffWrite): Observable<Tariff>  // toRequest → PUT  → fromResponse
activate(id: number): Observable<Tariff>                    // PATCH → fromResponse
deactivate(id: number): Observable<Tariff>                  // PATCH → fromResponse
```

## Implementation Plan

### Files to create

1. **`src/app/core/domain/tariff.model.ts`** — `Tariff` + `TariffWrite` interfaces
2. **`src/app/core/domain/index.ts`** — re-exports
3. **`src/app/core/mappers/tariff.mapper.ts`** — `TariffMapper` class
4. **`src/app/core/mappers/index.ts`** — re-exports

### Files to modify

5. **`src/app/core/models/tariff.model.ts`**
   - Keep `TariffStatus`, `TariffPeriod`, `TariffRequest`, `TariffResponse`, `TariffSelectionResponse` (legacy — used by rental/operator flows)
   - Add `PricingType`, `PricingParams`, `TariffV2Request`, `TariffV2Response`

6. **`src/app/core/models/index.ts`** — add exports for new types

7. **`src/app/core/api/tariff.service.ts`**
  - Change `baseUrl` → `/api/tariffs`
   - Update all method signatures to domain types
   - Apply `TariffMapper` internally

8. **`src/app/core/api/tariff.service.spec.ts`**
   - Update `BASE_URL` constant
   - Update mock data to use `Tariff` domain shape (Date objects)
   - Keep response fixture as `TariffV2Response` in the HTTP mock flush only

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID    | Description                                    | Status      | Updated    | Notes |
|-------|------------------------------------------------|-------------|------------|-------|
| 15.1  | Add PricingType + PricingParams to tariff.model.ts (models/) | Not Started | 2026-03-23 | |
| 15.2  | Add TariffV2Request + TariffV2Response         | Not Started | 2026-03-23 |       |
| 15.3  | Export new API types from models/index.ts      | Not Started | 2026-03-23 |       |
| 15.4  | Create Tariff + TariffWrite in core/domain/tariff.model.ts | Not Started | 2026-03-23 | |
| 15.5  | Create core/domain/index.ts                    | Not Started | 2026-03-23 |       |
| 15.6  | Create TariffMapper in core/mappers/tariff.mapper.ts | Not Started | 2026-03-23 | |
| 15.7  | Create core/mappers/index.ts                   | Not Started | 2026-03-23 |       |
| 15.8  | Update TariffService: baseUrl + domain types + mapper | Not Started | 2026-03-23 | |
| 15.9  | Update tariff.service.spec.ts                  | Not Started | 2026-03-23 |       |

## Progress Log


### 2026-03-23

- Implemented v2 API types in `src/app/core/models/tariff.model.ts` (`PricingType`, `PricingParams`, `TariffV2Request`, `TariffV2Response`).
- Created domain models `Tariff` and `TariffWrite` in `src/app/core/domain/tariff.model.ts` and exported via `core/domain/index.ts`.
- Implemented `TariffMapper` in `src/app/core/mappers/tariff.mapper.ts` (fromResponse / toRequest) using `toIsoDate()` for dates; exported via `core/mappers/index.ts`.
- Updated `TariffService` (`src/app/core/api/tariff.service.ts`) to use base URL `/api/tariffs`, return domain types (`Tariff`, `TariffSelection`), and apply mapper conversions internally.
- Updated and fixed unit tests in `src/app/core/api/tariff.service.spec.ts` to use v2 fixtures and assert mapped domain objects; resolved lint/type errors and ensured strict null-safety in tests.
- Ran the full test suite: all tests pass locally (306 tests).

Notes:

- Legacy v1 types (`TariffRequest`/`TariffResponse`) were preserved in `core/models/tariff.model.ts` for backward compatibility where needed.
- The `selectTariff` endpoint now maps `TariffSelectionResponse` (v2) to domain `TariffSelection` (`tariff: Tariff`, `totalCost`, `calculationBreakdown`).

