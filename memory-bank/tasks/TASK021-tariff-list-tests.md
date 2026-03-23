# TASK021 - Unit Tests: TariffListComponent

**Status:** Pending  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Depends on:** TASK016 (table shell), TASK017 (status toggle), TASK020 (dialog wiring)  
**Blocks:** None  
**Parent:** TASK008

## Original Request

Write a comprehensive unit test suite for `TariffListComponent` covering:
table rendering, pagination, status toggle (activate/deactivate), and dialog opening.

## Thought Process

Follow the same testing patterns established in `equipment-list.component.spec.ts`. Use `TestBed` with
`provideHttpClientTesting`.

Tests work with **`Tariff` domain objects** (from `core/domain/`). The `TariffService` mock returns
`Observable<Page<Tariff>>` directly — not `TariffV2Response`. This is correct because in tests the
service is fully mocked; the real mapper logic is not involved here (tested separately in the mapper
unit tests).

### Test cases

#### Rendering
- renders the component without errors
- displays tariff rows from mocked `TariffService.getAll()` response
- shows loading spinner while `loading` signal is `true`
- displays `Date` values for validFrom column via `DatePipe`

#### Pagination
- calls `loadTariffs()` with updated `pageIndex` when paginator `page` event fires
- calls `loadTariffs()` with updated `pageSize` when page size changes

#### Status toggle
- calls `TariffService.deactivate(id)` when toggle clicked on ACTIVE tariff
- calls `TariffService.activate(id)` when toggle clicked on INACTIVE tariff
- reloads list after successful toggle
- shows snackbar message after successful toggle
- shows error snackbar when toggle call fails

#### Dialog
- opens `TariffDialogComponent` via `MatDialog` when Create button is clicked
- passes `{}` as dialog data in create mode (no `tariff`, no `types`)
- opens dialog with `{ tariff }` when Edit button is clicked on a row — `tariff` is `Tariff` domain type
- reloads list when dialog closes with `true`
- does NOT reload list when dialog closes with `undefined` / `false`

### Mock helpers

```typescript
// Note: uses Tariff domain type (core/domain/) — not TariffV2Response
const mockTariff: Tariff = {
  id: 1,
  name: 'Test Tariff',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 100 },
  validFrom: new Date('2026-01-01'),
  status: 'ACTIVE',
};

const mockPage: Page<Tariff> = { items: [mockTariff], totalItems: 1 };
// No mockTypes — TariffListComponent does not load equipment types;
// EquipmentTypeDropdown is self-contained (tested in TASK024)
```

### Setup

```typescript
TestBed.configureTestingModule({
  imports: [TariffListComponent, NoopAnimationsModule],
  providers: [
    provideHttpClient(),
    provideHttpClientTesting(),
    { provide: TariffService, useValue: tariffServiceSpy },
    // No EquipmentTypeService — list component no longer injects it
    { provide: MatDialog, useValue: dialogSpy },
    { provide: MatSnackBar, useValue: snackBarSpy },
  ],
});
```

## Implementation Plan

### Files to create

1. **`src/app/features/admin/tariffs/tariff-list.component.spec.ts`** (new):
   - Service spies: `TariffService`, `EquipmentTypeService`, `MatDialog`, `MatSnackBar`
   - `TariffService.getAll` returns `of(mockPage)` — `Page<Tariff>` directly
   - `TariffService.activate` / `deactivate` return `of(mockTariff)` / `throwError()`
   - `MatDialog.open` returns fake dialog ref with configurable `afterClosed` Observable
   - Test groups: rendering, pagination, status toggle, dialog wiring

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID    | Description                                            | Status      | Updated    | Notes |
|-------|--------------------------------------------------------|-------------|------------|-------|
| 21.1  | TestBed setup + mocks (Tariff domain mocks)            | Not Started | 2026-03-23 |       |
| 21.2  | Rendering tests (table rows, loading spinner, DatePipe)| Not Started | 2026-03-23 |       |
| 21.3  | Pagination tests (page event → reload)                 | Not Started | 2026-03-23 |       |
| 21.4  | Status toggle tests (activate, deactivate, error)      | Not Started | 2026-03-23 |       |
| 21.5  | Dialog open / close + reload tests                     | Not Started | 2026-03-23 |       |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Follow equipment-list.component.spec.ts patterns for consistency
- Mock data uses `Tariff` domain type with `Date` objects — confirms domain isolation works
