# TASK022 - Unit Tests: TariffDialogComponent

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-24  
**Depends on:** TASK018 (base form), TASK019 (pricing params), TASK020 (dialog wiring)  
**Blocks:** None  
**Parent:** TASK008

## Original Request

Write a unit test suite for `TariffDialogComponent` covering: form initialisation, create mode, edit mode,
pricing type switching (params validators), form validation errors, save success, and save error handling.

## Thought Process

Follow patterns from `equipment-dialog.component.spec.ts` and `equipment-status-dialog.component.spec.ts`.
The key unique aspect here is the dynamic pricing params: tests must verify that switching `pricingType`
enables/disables the correct param fields and their `required` validators.

Tests work with **domain types**:

- `MAT_DIALOG_DATA.tariff` is a `Tariff` domain object (from `core/models/`) — **not** `TariffV2Response`
- Service spy assertions verify that `TariffService.create(write: TariffWrite)` is called with a
  `TariffWrite` domain object — **not** `TariffV2Request`

The mapper (`TariffMapper`) is not tested here — it has its own unit tests in `core/mappers/`.

### Test cases

#### Create mode
- form initialises with empty/default values
- title shows "Create"
- Save button disabled when form is invalid
- form becomes valid after filling all required fields for chosen pricingType
- `TariffService.create(write: TariffWrite)` called with correct `TariffWrite` on save
- dialog closes with `true` on successful save

#### Edit mode (`data.tariff: Tariff` provided)
- title shows "Edit"
- form is pre-filled with `Tariff` domain values (`Date` objects for `validFrom`/`validTo`)
- params pre-filled from `data.tariff.params`
- `TariffService.update(id, write: TariffWrite)` called on save
- dialog closes with `true` on successful update

#### Pricing type switching
- selecting `FLAT_HOURLY` shows `hourlyPrice` field and marks it required
- selecting `DEGRESSIVE_HOURLY` shows `firstHourPrice`, `hourlyDiscount`, `minimumHourlyPrice` as required
- selecting `DAILY` shows `dailyPrice` as required; `overtimeHourlyPrice` optional
- selecting `FLAT_FEE` shows `issuanceFee`, `minimumDurationMinutes` as required
- selecting `SPECIAL` shows no param fields; form is valid without any params (sends `params: {}`)
- switching pricingType clears validators on previously selected type's fields

#### Param field constraint validation
- `firstHourPrice` with value `0` → `min` error shown
- `hourlyDiscount` with value `-1` → `min` error shown
- `minimumHourlyPrice` with value `0` → `min` error shown
- `minimumHourlyPrice` greater than `firstHourPrice` → `minimumExceedsFirst` error on params group
- `minimumHourlyPrice` equal to `firstHourPrice` → no cross-field error (boundary valid)
- `minimumHourlyPrice` less than `firstHourPrice` → no cross-field error
- `issuanceFee` with value `-1` → `min` error shown (zero is allowed)
- `issuanceFee` with value `0` → no error
- `minimumDurationMinutes` with value `0` → `min` error shown (must be ≥ 1)
- `hourlyPrice` with value `0` → `min` error; Save button disabled
- `dailyPrice` with value `0` → `min` error; Save button disabled
- `overtimeHourlyPrice` with value `-1` (optional) → `min` error shown
- `minimumDurationSurcharge` with value `-1` (optional) → `min` error shown

#### Validation
- `name` field required — error shown when blank
- `name` max 200 chars — error shown when exceeded
- `validFrom` required — Save disabled without it

#### Error handling
- snackbar shown when `TariffService.create()` errors
- snackbar shown when `TariffService.update()` errors
- `saving` signal reset to `false` after error

### Mock helpers

```typescript
// EquipmentType from core/models/ (after TASK023) — not EquipmentTypeResponse
const mockTypes: EquipmentType[] = [{ slug: 'bike', name: 'Bike' }];

// Edit mode uses Tariff domain type (core/models/) — Date objects, NOT ISO strings
const mockTariff: Tariff = {
  id: 1,
  name: 'T1',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 100 },
  validFrom: new Date('2026-01-01'),
  status: 'ACTIVE',
};

// Stub for EquipmentTypeDropdownComponent to avoid real HTTP in dialog unit tests
@Component({ selector: 'app-equipment-type-dropdown', standalone: true, template: '' })
class EquipmentTypeDropdownStub implements ControlValueAccessor {
  writeValue() {}
  registerOnChange() {}
  registerOnTouched() {}
}
```

### Setup

```typescript
TestBed.configureTestingModule({
  imports: [TariffDialogComponent, NoopAnimationsModule],
  providers: [
    provideHttpClient(),
    provideHttpClientTesting(),
    { provide: MAT_DIALOG_DATA, useValue: {} },           // create mode — no tariff, no types
    { provide: MatDialogRef, useValue: dialogRefSpy },
    { provide: TariffService, useValue: tariffServiceSpy },
    { provide: MatSnackBar, useValue: snackBarSpy },
  ],
})
.overrideComponent(TariffDialogComponent, {
  remove: { imports: [EquipmentTypeDropdownComponent] },
  add:    { imports: [EquipmentTypeDropdownStub] },
});
```

For edit mode tests, override `MAT_DIALOG_DATA` with `{ tariff: mockTariff }` (no `types` field).

## Implementation Plan

### Files to create

1. **`src/app/features/admin/tariffs/tariff-dialog.component.spec.ts`** (new):
   - Tests: create mode, edit mode (with `Tariff` domain mock), pricingType switching, validation, save success
   - Constraint tests: `min` errors per field, cross-field `minimumExceedsFirst`, boundary cases

2. **`src/app/features/admin/tariffs/tariff-dialog.error.spec.ts`** (new):
   - Tests: save error scenarios, saving signal reset after error

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID   | Description                                          | Status   | Updated    | Notes |
|------|------------------------------------------------------|----------|------------|-------|
| 22.1 | TestBed setup + mocks (Tariff domain mocks)          | Complete | 2026-03-24 |       |
| 22.2 | Create mode tests + TariffWrite assertion            | Complete | 2026-03-24 |       |
| 22.3 | Edit mode pre-fill tests (from Tariff, Date objects) | Complete | 2026-03-24 |       |
| 22.4 | PricingType switching → validator tests              | Complete | 2026-03-24 |       |
| 22.5 | Validation error display tests                       | Complete | 2026-03-24 |       |
| 22.6 | Error handling spec (tariff-dialog.error.spec.ts)    | Complete | 2026-03-24 |       |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Dynamic pricing params validator tests are the key differentiator from other dialog test suites
- Split into main spec + error spec following project convention
- Mock data uses `Tariff` (domain) not `TariffV2Response` — confirms correct layer separation
- Save assertions check `TariffWrite` (domain) not `TariffV2Request` — mapper is tested separately

### 2026-03-24

- Implemented full test suite in two files:
  - `tariff-dialog.component.spec.ts` — 39 tests across 6 describe blocks: create mode, edit
    mode, pricing type switching, cross-field validator (minimumExceedsFirst), param min
    constraints, and top-level form validation.
  - `tariff-dialog.error.spec.ts` — 5 tests for save error scenarios (create/update failure,
    saving signal reset, fallback message when error has no `.message` property).
- Used `overrideComponent` to swap `EquipmentTypeDropdownComponent` with a `ControlValueAccessor`
  stub to avoid real HTTP calls in unit tests.
- Used `TestBed.resetTestingModule()` in `beforeEach` to ensure test isolation across
  `describe` blocks using the `async setup()` call-per-test pattern.
- All 60 test files, 382 tests pass.
