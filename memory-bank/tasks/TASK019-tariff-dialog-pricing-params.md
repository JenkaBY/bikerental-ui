# TASK019 - TariffDialogComponent: Dynamic Pricing Params Section

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-24  
**Depends on:** TASK018 (base form)  
**Blocks:** TASK020, TASK022  
**Parent:** TASK008

## Original Request

Extend `TariffDialogComponent` with a dynamic pricing params section. When the user selects a `pricingType`,
the relevant numeric fields from `PricingParams` are shown and pre-filled (in edit mode from the `Tariff`
domain object). Fields for other pricing types are hidden.

## Thought Process

Each `PricingType` maps to a distinct subset of `PricingParams` fields. The UI shows only the relevant fields
based on the current `pricingType` form control value. Pre-fill comes from `data.tariff.params` — the
`Tariff` domain object carries a `PricingParams` with `number` values (already parsed from JSON, no
transformation needed). The `save()` method fills `params` in the `TariffWrite` it builds; the mapper
handles the rest.

### Field mapping per PricingType

| PricingType          | Visible params fields                                                  |
|----------------------|------------------------------------------------------------------------|
| `DEGRESSIVE_HOURLY`  | `firstHourPrice` (req), `hourlyDiscount` (req), `minimumHourlyPrice` (req) |
| `FLAT_HOURLY`        | `hourlyPrice` (req)                                                    |
| `DAILY`              | `dailyPrice` (req), `overtimeHourlyPrice` (opt)                        |
| `FLAT_FEE`           | `issuanceFee` (req), `minimumDurationMinutes` (req), `minimumDurationSurcharge` (opt) |
| `SPECIAL`            | *(none — sends `params: {}`)*                                          |

### Field constraints

| Field                    | Constraint                                | Angular validator                         |
|--------------------------|-------------------------------------------|-------------------------------------------|
| `firstHourPrice`         | positive (> 0)                            | `Validators.min(0.01)`                    |
| `hourlyDiscount`         | positive (> 0)                            | `Validators.min(0.01)`                    |
| `minimumHourlyPrice`     | positive (> 0) AND ≤ `firstHourPrice`     | `Validators.min(0.01)` + cross-field      |
| `hourlyPrice`            | positive (> 0)                            | `Validators.min(0.01)`                    |
| `dailyPrice`             | positive (> 0)                            | `Validators.min(0.01)`                    |
| `overtimeHourlyPrice`    | positive if provided (> 0)                | `Validators.min(0.01)` (optional field)   |
| `issuanceFee`            | zero or positive (≥ 0)                    | `Validators.min(0)`                       |
| `minimumDurationMinutes` | positive integer (≥ 1)                    | `Validators.min(1)`                       |
| `minimumDurationSurcharge` | positive if provided (> 0)              | `Validators.min(0.01)` (optional field)   |

**Cross-field constraint**: `minimumHourlyPrice ≤ firstHourPrice` — validated at the `params`
FormGroup level via a custom `ValidatorFn`. Applied only when `pricingType` is `DEGRESSIVE_HOURLY`.

### Form structure for params

```typescript
params: new FormGroup({
  firstHourPrice:           new FormControl<number | null>(null, [Validators.min(0.01)]),
  hourlyDiscount:           new FormControl<number | null>(null, [Validators.min(0.01)]),
  minimumHourlyPrice:       new FormControl<number | null>(null, [Validators.min(0.01)]),
  hourlyPrice:              new FormControl<number | null>(null, [Validators.min(0.01)]),
  dailyPrice:               new FormControl<number | null>(null, [Validators.min(0.01)]),
  overtimeHourlyPrice:      new FormControl<number | null>(null, [Validators.min(0.01)]),
  issuanceFee:              new FormControl<number | null>(null, [Validators.min(0)]),
  minimumDurationMinutes:   new FormControl<number | null>(null, [Validators.min(1)]),
  minimumDurationSurcharge: new FormControl<number | null>(null, [Validators.min(0.01)]),
  // no `price` control — SPECIAL sends params: {} with no fields
})
```

Note: `min` validators are always present on the controls — they prevent invalid values regardless of
which pricing type is active. `required` validators are applied/removed dynamically by `applyParamValidators`.

### Cross-field validator function

Defined as a private constant in the component file:

```typescript
const minimumHourlyPriceValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const g = group as FormGroup<{ firstHourPrice: FormControl; minimumHourlyPrice: FormControl }>;
  const first = g.controls.firstHourPrice.value as number | null;
  const min   = g.controls.minimumHourlyPrice.value as number | null;
  if (first != null && min != null && min > first) {
    return { minimumExceedsFirst: true };
  }
  return null;
};
```

### Dynamic validator wiring

```typescript
private applyParamValidators(type: PricingType): void {
  const paramsGroup = this.form.controls.params;
  const p = paramsGroup.controls;

  // Clear required validators and group-level validators; keep min validators
  Object.values(p).forEach(c => {
    const minVal = c.hasValidator(Validators.min(0)) ? Validators.min(0)
                 : c.hasValidator(Validators.min(1)) ? Validators.min(1)
                 : Validators.min(0.01);
    c.setValidators([minVal]);               // reset to min-only
    c.updateValueAndValidity({ emitEvent: false });
  });
  paramsGroup.clearValidators();

  const posPrice  = [Validators.required, Validators.min(0.01)];
  const posInt    = [Validators.required, Validators.min(1)];
  const nonNeg    = [Validators.required, Validators.min(0)];

  switch (type) {
    case 'DEGRESSIVE_HOURLY':
      p.firstHourPrice.setValidators(posPrice);
      p.hourlyDiscount.setValidators(posPrice);
      p.minimumHourlyPrice.setValidators(posPrice);
      paramsGroup.setValidators(minimumHourlyPriceValidator);   // cross-field
      break;
    case 'FLAT_HOURLY':
      p.hourlyPrice.setValidators(posPrice);
      break;
    case 'DAILY':
      p.dailyPrice.setValidators(posPrice);
      // overtimeHourlyPrice is optional — min(0.01) already set, no required added
      break;
    case 'FLAT_FEE':
      p.issuanceFee.setValidators(nonNeg);
      p.minimumDurationMinutes.setValidators(posInt);
      // minimumDurationSurcharge is optional — min(0.01) already set
      break;
    case 'SPECIAL':
      break;   // no validators — params: {}
  }

  Object.values(p).forEach(c => c.updateValueAndValidity({ emitEvent: false }));
  paramsGroup.updateValueAndValidity();
}
```

Subscribe to `pricingType.valueChanges` in the constructor and call `applyParamValidators`.
Also call once during `ngOnInit` if editing an existing tariff (to apply validators for its current type).

### Pre-fill in edit mode

```typescript
if (this.data.tariff) {
  const p = this.data.tariff.params;
  this.form.controls.params.patchValue({
    firstHourPrice:           p.firstHourPrice ?? null,
    hourlyDiscount:           p.hourlyDiscount ?? null,
    minimumHourlyPrice:       p.minimumHourlyPrice ?? null,
    hourlyPrice:              p.hourlyPrice ?? null,
    dailyPrice:               p.dailyPrice ?? null,
    overtimeHourlyPrice:      p.overtimeHourlyPrice ?? null,
    issuanceFee:              p.issuanceFee ?? null,
    minimumDurationMinutes:   p.minimumDurationMinutes ?? null,
    minimumDurationSurcharge: p.minimumDurationSurcharge ?? null,
  });
}
```

### Update save() to include params (in TariffWrite)

```typescript
const write: TariffWrite = {
  ...baseFields,
  params: {
    firstHourPrice:           this.form.value.params?.firstHourPrice ?? undefined,
    hourlyDiscount:           this.form.value.params?.hourlyDiscount ?? undefined,
    minimumHourlyPrice:       this.form.value.params?.minimumHourlyPrice ?? undefined,
    hourlyPrice:              this.form.value.params?.hourlyPrice ?? undefined,
    dailyPrice:               this.form.value.params?.dailyPrice ?? undefined,
    overtimeHourlyPrice:      this.form.value.params?.overtimeHourlyPrice ?? undefined,
    issuanceFee:              this.form.value.params?.issuanceFee ?? undefined,
    minimumDurationMinutes:   this.form.value.params?.minimumDurationMinutes ?? undefined,
    minimumDurationSurcharge: this.form.value.params?.minimumDurationSurcharge ?? undefined,
  },
};
```

### Template addition (inside `<form>`)

All price inputs use `type="number" min="0.01" step="0.01"`.  
`minimumDurationMinutes` uses `type="number" min="1" step="1"`.  
`issuanceFee` uses `type="number" min="0" step="0.01"`.

```html
<div formGroupName="params" class="col-span-2 grid grid-cols-2 gap-4">
  @switch (form.controls.pricingType.value) {

    @case ('DEGRESSIVE_HOURLY') {
      <!-- firstHourPrice -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.FirstHourPrice }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="firstHourPrice" />
        @if (params.firstHourPrice.hasError('required')) { <mat-error>{{ errors.required }}</mat-error> }
        @if (params.firstHourPrice.hasError('min')) { <mat-error>{{ errors.mustBePositive }}</mat-error> }
      </mat-form-field>

      <!-- hourlyDiscount -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.HourlyDiscount }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="hourlyDiscount" />
        @if (params.hourlyDiscount.hasError('required')) { <mat-error>{{ errors.required }}</mat-error> }
        @if (params.hourlyDiscount.hasError('min')) { <mat-error>{{ errors.mustBePositive }}</mat-error> }
      </mat-form-field>

      <!-- minimumHourlyPrice — also shows cross-field error -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.MinimumHourlyPrice }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="minimumHourlyPrice" />
        @if (params.minimumHourlyPrice.hasError('required')) { <mat-error>{{ errors.required }}</mat-error> }
        @if (params.minimumHourlyPrice.hasError('min')) { <mat-error>{{ errors.mustBePositive }}</mat-error> }
        @if (form.controls.params.hasError('minimumExceedsFirst')) {
          <mat-error>{{ errors.minimumExceedsFirstHour }}</mat-error>
        }
      </mat-form-field>
    }

    @case ('FLAT_HOURLY') {
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.HourlyPrice }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="hourlyPrice" />
        @if (params.hourlyPrice.hasError('required')) { <mat-error>{{ errors.required }}</mat-error> }
        @if (params.hourlyPrice.hasError('min')) { <mat-error>{{ errors.mustBePositive }}</mat-error> }
      </mat-form-field>
    }

    @case ('DAILY') {
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.DailyPrice }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="dailyPrice" />
        @if (params.dailyPrice.hasError('required')) { <mat-error>{{ errors.required }}</mat-error> }
        @if (params.dailyPrice.hasError('min')) { <mat-error>{{ errors.mustBePositive }}</mat-error> }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.OvertimeHourlyPrice }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="overtimeHourlyPrice" />
        @if (params.overtimeHourlyPrice.hasError('min')) { <mat-error>{{ errors.mustBePositive }}</mat-error> }
      </mat-form-field>
    }

    @case ('FLAT_FEE') {
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.IssuanceFee }}</mat-label>
        <input matInput type="number" min="0" step="0.01" formControlName="issuanceFee" />
        @if (params.issuanceFee.hasError('required')) { <mat-error>{{ errors.required }}</mat-error> }
        @if (params.issuanceFee.hasError('min')) { <mat-error>{{ errors.mustBeNonNegative }}</mat-error> }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.MinimumDurationMinutes }}</mat-label>
        <input matInput type="number" min="1" step="1" formControlName="minimumDurationMinutes" />
        @if (params.minimumDurationMinutes.hasError('required')) { <mat-error>{{ errors.required }}</mat-error> }
        @if (params.minimumDurationMinutes.hasError('min')) { <mat-error>{{ errors.mustBeAtLeastOne }}</mat-error> }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.MinimumDurationSurcharge }}</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="minimumDurationSurcharge" />
        @if (params.minimumDurationSurcharge.hasError('min')) { <mat-error>{{ errors.mustBePositive }}</mat-error> }
      </mat-form-field>
    }

    @case ('SPECIAL') {
      <p class="col-span-2 text-sm text-slate-500" i18n>No additional parameters required.</p>
    }

  }
</div>
```

Getter shorthand for cleaner templates:
```typescript
get params() { return this.form.controls.params.controls; }
```

### New Labels entries (add to `shared/constant/labels.ts`)

| Key                      | English value               |
|--------------------------|-----------------------------|
| `FirstHourPrice`         | `First Hour Price`          |
| `HourlyDiscount`         | `Hourly Discount`           |
| `MinimumHourlyPrice`     | `Minimum Hourly Price`      |
| `HourlyPrice`            | `Hourly Price`              |
| `DailyPrice`             | `Daily Price`               |
| `OvertimeHourlyPrice`    | `Overtime Hourly Price`     |
| `IssuanceFee`            | `Issuance Fee`              |
| `MinimumDurationMinutes` | `Minimum Duration (min)`    |
| `MinimumDurationSurcharge` | `Minimum Duration Surcharge` |

### New FormErrorMessages entries (add to `shared/validators/form-error-messages.ts`)

| Key                       | English value                                    |
|---------------------------|--------------------------------------------------|
| `mustBePositive`          | `Value must be greater than zero`                |
| `mustBeNonNegative`       | `Value must be zero or greater`                  |
| `mustBeAtLeastOne`        | `Value must be at least 1`                       |
| `minimumExceedsFirstHour` | `Cannot exceed first hour price`                 |

## Implementation Plan

### Files to modify

1. **`src/app/features/admin/tariffs/tariff-dialog.component.ts`**
   - Add `params` FormGroup with **9 controls**, each pre-wired with its `min` validator
   - Define `minimumHourlyPriceValidator` as a file-level `const ValidatorFn`
   - Subscribe to `pricingType.valueChanges` → `applyParamValidators()` (adds/removes `required` + cross-field)
   - Initial call to `applyParamValidators` for edit mode (current pricingType)
   - Add `get params()` getter for template shorthand
   - `@switch` template block with all fields, min/required/cross-field errors
   - Update `save()` to build full `TariffWrite.params`

2. **`src/app/shared/constant/labels.ts`**
   - Add 9 new params field label entries

3. **`src/app/shared/validators/form-error-messages.ts`**
   - Add `mustBePositive`, `mustBeNonNegative`, `mustBeAtLeastOne`, `minimumExceedsFirstHour`

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID    | Description                                                        | Status      | Updated    | Notes |
|-------|--------------------------------------------------------------------|-------------|------------|-------|
| 19.1  | Add params FormGroup with 9 controls + min validators              | Not Started | 2026-03-23 | min always present; required added dynamically |
| 19.2  | Define minimumHourlyPriceValidator const (cross-field)             | Not Started | 2026-03-23 | applied to params group for DEGRESSIVE_HOURLY |
| 19.3  | applyParamValidators() — required + cross-field per pricing type   | Not Started | 2026-03-23 | clears required only, keeps min validators |
| 19.4  | @switch template with all fields, min/required/cross-field errors  | Not Started | 2026-03-23 | params getter for shorthand |
| 19.5  | Pre-fill params from data.tariff.params in edit mode               | Not Started | 2026-03-23 |       |
| 19.6  | Update save() to include params in TariffWrite                     | Not Started | 2026-03-23 |       |
| 19.7  | Add Labels entries (9 param field labels)                          | Not Started | 2026-03-23 |       |
| 19.8  | Add FormErrorMessages entries (mustBePositive etc.)                | Not Started | 2026-03-23 |       |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Dynamic validator pattern chosen over form-array to keep form flat and easy to test
- `@switch` preferred over multiple `@if` for cleaner template structure
- Dialog never builds `TariffV2Request` — `TariffWrite` is passed to service which maps internally
- **Correction**: `SPECIAL` pricing type has no params fields — sends `params: {}`; `price` control removed from FormGroup; `requiredFields.SPECIAL = []`; `@case ('SPECIAL')` renders no inputs
- **Field constraints added**: `min` validators always present on controls; `required` added dynamically via `applyParamValidators`; cross-field validator (`minimumHourlyPrice ≤ firstHourPrice`) on `params` FormGroup for `DEGRESSIVE_HOURLY`

### 2026-03-24

- Implemented dynamic pricing params section in `TariffDialogComponent`.
- Added `params` FormGroup with all 9 controls and min validators; implemented `applyParamValidators()` to add `required` and cross-field validators depending on selected `pricingType`.
- For `DEGRESSIVE_HOURLY`, additionally made `minimumDurationMinutes` and `minimumDurationSurcharge` required (as requested) and added UI fields in `DegressiveHourlyParamsComponent` for these controls.
- Pricing type descriptions are supplied by UI-side `Labels` and passed into params components as helper text.
- Updated `save()` to include `params` when building `TariffWrite` and call `TariffService.create/update` accordingly.

