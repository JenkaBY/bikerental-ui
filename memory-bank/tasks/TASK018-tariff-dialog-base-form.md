# TASK018 - TariffDialogComponent: Base Form

**Status:** Pending  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Depends on:** TASK015 (v2 models + service + domain + mapper), TASK023 (EquipmentType domain), TASK024 (EquipmentTypeDropdown)  
**Blocks:** TASK019, TASK020, TASK022  
**Parent:** TASK008

## Original Request

Create `TariffDialogComponent` with a reactive form covering the non-pricing fields:
name, description, equipmentTypeSlug, pricingType, validFrom, validTo.

The dialog must support both **create** and **edit** modes. It works exclusively with the **`Tariff`
domain type** (from `core/domain/`) for edit mode pre-fill, and produces a **`TariffWrite`** domain object
that is passed to `TariffService.create()` / `TariffService.update()`. The service handles the API
conversion internally — the dialog never builds a `TariffV2Request`.

All visible labels, placeholders, and hint texts must be **internationalized** using `$localize` via the
`Labels` class (`shared/constant/labels.ts`). New entries must be added to `Labels` for any string not
yet present.

## Thought Process

`TariffDialogComponent` receives dialog data of type `TariffDialogData`. In edit mode the form is
pre-filled from `data.tariff` (a `Tariff` domain object). On save, the dialog assembles a `TariffWrite`
and passes it to the service.

### Dialog data type

`types` is **not** part of dialog data — `EquipmentTypeDropdownComponent` (TASK024) loads equipment
types itself from the cached service. The dialog should therefore only accept the optional `Tariff`
for edit pre-fill:

```typescript
export interface TariffDialogData {
  tariff?: Tariff;   // undefined → create mode; Tariff from core/domain/
}
```

When adding the dropdown to the dialog template use:

```html

<app-equipment-type-dropdown formControlName="equipmentTypeSlug"></app-equipment-type-dropdown>
```

This keeps type loading centralized and leverages the shared cache from `EquipmentTypeService.getAll()`.

### i18n — Labels to add to `Labels` class

All labels must be defined as `$localize` tagged strings in `shared/constant/labels.ts`:

| Label key            | English value         |
|----------------------|-----------------------|
| `Tariff`             | `Tariff`              |
| `Tariffs`            | `Tariffs`             |
| `CreateTariff`       | `Create Tariff`       |
| `EditTariff`         | `Edit Tariff`         |
| `PricingType`        | `Pricing Type`        |
| `ValidFrom`          | `Valid From`          |
| `ValidTo`            | `Valid To`            |
| `NoEndDate`          | `No end date`         |
| `Activate`           | `Activate`            |
| `Deactivate`         | `Deactivate`          |
| `StatusChanged`      | `Status changed`      |
| `Saved`              | `Saved`               |
| `EquipmentType`      | `Equipment Type`      |

### Form fields

| Field               | Control       | Validators              | Notes                                              |
|---------------------|---------------|-------------------------|----------------------------------------------------|
| `name`              | `FormControl` | `required`, `max(200)`  | label: `Labels.Name`                               |
| `description`       | `FormControl` | `max(1000)`             | textarea; label: `Labels.Description`              |
| `equipmentTypeSlug` | `FormControl` | –                       | **`<app-equipment-type-dropdown>`** (TASK024)       |
| `pricingType`       | `FormControl` | `required`              | `mat-select`; label: `Labels.PricingType`          |
| `validFrom`         | `FormControl` | `required`              | `mat-datepicker`; label: `Labels.ValidFrom`        |
| `validTo`           | `FormControl` | –                       | `mat-datepicker`, optional; label: `Labels.ValidTo` |

`status` is **not** in the form — controlled via activate/deactivate toggle (TASK017).

### Template layout

```html
<h2 mat-dialog-title>{{ isEdit ? labels.EditTariff : labels.CreateTariff }}</h2>
<mat-dialog-content>
  <form [formGroup]="form" class="grid grid-cols-2 gap-4 min-w-[600px] pt-1">

    <!-- name — col-span-2 -->
    <mat-form-field appearance="outline" class="col-span-2">
      <mat-label>{{ labels.Name }}</mat-label>
      <input matInput formControlName="name" maxlength="200" />
      @if (form.controls.name.hasError('required')) {
        <mat-error>{{ errors.nameRequired }}</mat-error>
      }
      @if (form.controls.name.hasError('maxlength')) {
        <mat-error>{{ errors.nameMaxLength }}</mat-error>
      }
    </mat-form-field>

    <!-- description — col-span-2 -->
    <mat-form-field appearance="outline" class="col-span-2">
      <mat-label>{{ labels.Description }}</mat-label>
      <textarea matInput formControlName="description" rows="3" maxlength="1000"></textarea>
    </mat-form-field>

    <!-- equipmentTypeSlug via EquipmentTypeDropdown — col-span-1 -->
    <app-equipment-type-dropdown formControlName="equipmentTypeSlug"></app-equipment-type-dropdown>

    <!-- pricingType — col-span-1 -->
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ labels.PricingType }}</mat-label>
      <mat-select formControlName="pricingType">
        @for (pt of pricingTypes; track pt) {
          <mat-option [value]="pt">{{ pt }}</mat-option>
        }
      </mat-select>
      @if (form.controls.pricingType.hasError('required')) {
        <mat-error>{{ errors.pricingTypeRequired }}</mat-error>
      }
    </mat-form-field>

    <!-- validFrom — col-span-1 -->
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ labels.ValidFrom }}</mat-label>
      <input matInput [matDatepicker]="fromPicker" formControlName="validFrom" />
      <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
      <mat-datepicker #fromPicker></mat-datepicker>
      @if (form.controls.validFrom.hasError('required')) {
        <mat-error>{{ errors.validFromRequired }}</mat-error>
      }
    </mat-form-field>

    <!-- validTo — col-span-1 -->
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ labels.ValidTo }}</mat-label>
      <input matInput [matDatepicker]="toPicker" formControlName="validTo" />
      <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
      <mat-datepicker #toPicker></mat-datepicker>
      <mat-hint>{{ labels.NoEndDate }}</mat-hint>
    </mat-form-field>

    <!-- pricing params section added in TASK019 -->
  </form>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <app-form-cancel-button />
  <app-form-save-button [saving]="saving()" [disabled]="form.invalid" (save)="save()" />
</mat-dialog-actions>
```

### Save logic (base — no params yet)

```typescript
save(): void {
  if (this.form.invalid) return;
  this.saving.set(true);
  const v = this.form.getRawValue();
  const write: TariffWrite = {
    name: v.name!,
    description: v.description ?? undefined,
    equipmentTypeSlug: v.equipmentTypeSlug ?? undefined,
    pricingType: v.pricingType!,
    params: {},                        // populated in TASK019
    validFrom: v.validFrom!,           // Date from datepicker
    validTo: v.validTo ?? undefined,
  };
  const call$ = this.data.tariff
    ? this.tariffService.update(this.data.tariff.id, write)
    : this.tariffService.create(write);
  call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: () => { this.saving.set(false); this.dialogRef.close(true); },
    error: (err) => { this.saving.set(false); this.snackBar.open(err.message, Labels.Close, { duration: 4000 }); },
  });
}
```

## Implementation Plan

### Files to create

1. **`src/app/features/admin/tariffs/tariff-dialog.component.ts`** (new):
   - Standalone, `OnPush`
   - Import `Tariff`, `TariffWrite` from `core/domain`
   - Import `EquipmentTypeDropdownComponent` from `shared/components/equipment-type-dropdown`
   - Import `PricingType` from `core/domain` (re-exported from `core/models` if needed)
   - Imports: `ReactiveFormsModule`, `MatDialogModule`, `MatFormFieldModule`, `MatInputModule`,
     `MatSelectModule`, `MatDatepickerModule`, `MatNativeDateModule`, `MatButtonModule`,
     `SaveButtonComponent`, `CancelButtonComponent`, **`EquipmentTypeDropdownComponent`**
   - Inject: `MAT_DIALOG_DATA`, `MatDialogRef`, `TariffService`, `MatSnackBar`, `DestroyRef`
   - Export `TariffDialogData` interface (contains only `tariff?: Tariff` — no `types`)
   - `saving = signal(false)`
   - `get isEdit()` helper
   - `readonly pricingTypes: PricingType[]` constant array
   - `readonly labels = Labels` — all template strings via Labels

### Files to modify

2. **`src/app/shared/constant/labels.ts`**
   - Add all new entries from the i18n table above

3. **`src/app/shared/validators/form-error-messages.ts`**
   - Add `pricingTypeRequired`, `validFromRequired`, `nameMaxLength` if missing

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID    | Description                                                       | Status      | Updated    | Notes |
|-------|-------------------------------------------------------------------|-------------|------------|-------|
| 18.1  | Add Labels entries for all new i18n strings                       | Not Started | 2026-03-23 |       |
| 18.2  | Add FormErrorMessages entries (pricingTypeRequired, etc.)         | Not Started | 2026-03-23 |       |
| 18.3  | Scaffold TariffDialogData (tariff only — no types)                | Not Started | 2026-03-23 |       |
| 18.4  | Reactive form: name, description, pricingType, validFrom, validTo | Not Started | 2026-03-23 |       |
| 18.5  | Insert EquipmentTypeDropdown via formControlName                  | Not Started | 2026-03-23 | replaces inline mat-select |
| 18.6  | Pre-fill from data.tariff (Tariff domain) in edit mode            | Not Started | 2026-03-23 |       |
| 18.7  | save() builds TariffWrite → service                               | Not Started | 2026-03-23 |       |
| 18.8  | Validation errors in template using Labels + FormErrorMessages    | Not Started | 2026-03-23 |       |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Pricing params section intentionally deferred to TASK019 to keep this form testable first
- `status` field excluded from form — status controlled via activate/deactivate toggle (TASK017)
- Dialog uses `Tariff` (domain) for read, `TariffWrite` (domain) for write — never touches raw API types
- `TariffDialogData` no longer contains `types[]` — `EquipmentTypeDropdown` (TASK024) owns type loading
- All labels must use `$localize` via `Labels` class — full list of new entries documented above
