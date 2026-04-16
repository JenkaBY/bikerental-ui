# TASK008 - Admin: Tariffs CRUD (Parent Tracker)

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-03-23  
**Depends on:** TASK003  
**Blocks:** None

## Original Request

Build Tariff management in the admin module: paginated table with all tariff fields, create/edit dialog with price
fields, and activate/deactivate toggle buttons in the table row actions.

## Decomposition (2026-03-23)

TASK008 has been decomposed into 8 focused subtasks. This file is the parent tracker.
Each subtask has its own dedicated task file.

### Architecture: Backend → Response → Mapper → Domain → UI

```
Backend API
  └── TariffV2Response  (core/models/)
        └── TariffMapper.fromResponse()  (core/mappers/)
              └── Tariff  (core/domain/)
                    └── TariffListComponent, TariffDialogComponent  (features/admin/tariffs/)

UI Form
  └── TariffWrite  (core/domain/)
        └── TariffMapper.toRequest()  (core/mappers/)
              └── TariffV2Request  (core/models/)
                    └── Backend API
```

### Subtask dependency chain

```
TASK005 (complete) → TASK023 (EquipmentType domain + mapper)
                           └──────────────────────────────────────────────────────┐
TASK015 (v2 API models + domain Tariff/TariffWrite + TariffMapper)               │
  ├── TASK016 (list table shell — uses Tariff domain type)                        │
  │     ├── TASK017 (status toggle — toggleStatus(row: Tariff))                  │
  │     └── TASK020 (dialog wiring) ←─ TASK018 (dialog base form, TariffWrite) ←─┘
  │           │                              └── TASK019 (pricing params)
  │           └── TASK021 (list tests — mock Page<Tariff>, EquipmentType[])
  └── TASK022 (dialog tests — mock Tariff with Date, EquipmentType[]) ←── TASK019
```

### Subtask index

| Task    | Title                                                  | Depends on                        |
|---------|--------------------------------------------------------|-----------------------------------|
| TASK023 | EquipmentType domain model + mapper + shareReplay      | TASK005 (done), TASK015           |
| TASK024 | EquipmentTypeDropdownComponent (shared, CVA, cached)   | TASK023                           |
| TASK015 | v2 API models + Tariff domain + TariffMapper           | TASK003                           |
| TASK016 | TariffListComponent — paginated table shell            | TASK015                           |
| TASK017 | TariffListComponent — status toggle                    | TASK016                           |
| TASK018 | TariffDialogComponent — base form (TariffWrite)        | TASK015, TASK024                  |
| TASK019 | TariffDialogComponent — pricing params                 | TASK018                           |
| TASK020 | Wire TariffDialog into TariffList                      | TASK016, TASK018, TASK019         |
| TASK021 | Unit tests: TariffListComponent                        | TASK016, TASK017, TASK020         |
| TASK022 | Unit tests: TariffDialogComponent                      | TASK018, TASK019, TASK020         |

## API (updated to v2)

Base URL: `/api/tariffs`

| Method | Path                           | Description              |
|--------|--------------------------------|--------------------------|
| GET    | `/api/tariffs`                 | Paginated list           |
| POST   | `/api/tariffs`                 | Create tariff            |
| GET    | `/api/tariffs/{id}`            | Get by ID                |
| PUT    | `/api/tariffs/{id}`            | Update tariff            |
| PATCH  | `/api/tariffs/{id}/activate`   | Activate                 |
| PATCH  | `/api/tariffs/{id}/deactivate` | Deactivate               |
| GET    | `/api/tariffs/active`          | Active by equipment type |
| GET    | `/api/tariffs/selection`       | Tariff selection         |

## v2 Model Overview

**`PricingType`**: `DEGRESSIVE_HOURLY | FLAT_HOURLY | DAILY | FLAT_FEE | SPECIAL`

**`TariffV2Request`**: `name` (req), `description`, `equipmentTypeSlug`, `pricingType` (req),
`params: PricingParams` (req), `validFrom` (req), `validTo`

**`TariffV2Response`**: `id`, `name`, `description`, `equipmentType`, `pricingType`, `params`,
`validFrom`, `validTo`, `version`, `status`

**`PricingParams`** (all optional, relevant subset populated per pricing type):
- `DEGRESSIVE_HOURLY` → `firstHourPrice`, `hourlyDiscount`, `minimumHourlyPrice`
- `FLAT_HOURLY` → `hourlyPrice`, `minimumDurationMinutes`, `minimumDurationSurcharge`
- `DAILY` → `dailyPrice`, `overtimeHourlyPrice`
- `FLAT_FEE` → `issuanceFee`
- `SPECIAL` → `empty object`

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID      | Description                                  | Status      | Updated    | Notes |
|---------|----------------------------------------------|-------------|------------|-------|
| TASK015 | Update TariffService & Models to v2 API      | Not Started | 2026-03-23 | See TASK015 file |
| TASK016 | TariffListComponent — table shell            | Not Started | 2026-03-23 | See TASK016 file |
| TASK017 | TariffListComponent — status toggle          | Not Started | 2026-03-23 | See TASK017 file |
| TASK018 | TariffDialogComponent — base form            | Not Started | 2026-03-23 | See TASK018 file |
| TASK019 | TariffDialogComponent — pricing params       | Not Started | 2026-03-23 | See TASK019 file |
| TASK020 | Wire dialog into list                        | Not Started | 2026-03-23 | See TASK020 file |
| TASK021 | Unit tests: TariffListComponent              | Not Started | 2026-03-23 | See TASK021 file |
| TASK022 | Unit tests: TariffDialogComponent            | Not Started | 2026-03-23 | See TASK022 file |

## Progress Log

### 2026-02-28

- Task created with full tariff CRUD design (v1 API)

### 2026-03-23

- Decomposed into 8 subtasks (TASK015–TASK022)
- Updated all subtask descriptions to use `/api/tariffs`
- v2 model schema differs significantly from v1: `pricingType` enum + `PricingParams` object replaces flat price fields
- Added mapper/domain layer: `core/domain/tariff.model.ts` (`Tariff`, `TariffWrite`) + `core/mappers/tariff.mapper.ts` (`TariffMapper`)
- `status` is no longer set in the create/edit form — controlled via activate/deactivate toggle only
- All UI components work exclusively with `Tariff` / `TariffWrite` domain types — never with raw API types
- Architecture: `Backend → TariffV2Response → TariffMapper → Tariff → UI` / `UI → TariffWrite → TariffMapper → TariffV2Request → Backend`
