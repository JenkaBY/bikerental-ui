# TASK024 - EquipmentTypeDropdownComponent (shared, cached, ControlValueAccessor)

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Depends on:** TASK023 (EquipmentType domain + cached service)  
**Blocks:** TASK018 (dialog uses the dropdown)  
**Related:** TASK016 (tariff list type filter may reuse this dropdown)

## Original Request

Create a reusable `EquipmentTypeDropdownComponent` in `shared/components/equipment-type-dropdown/`
that:
- Loads equipment types from a **cached** `EquipmentTypeService.getAll()` response
- Displays `type.name` in the option list
- Binds `type.slug` as the control value
- Implements `ControlValueAccessor` so it works with `formControlName` in any reactive form
- Uses `$localize` for its label so it participates in Angular i18n extraction

## Thought Process

Rather than passing `types: EquipmentType[]` through dialog data and loading it in every parent
component, the dropdown owns its own data lifecycle. The service-level cache (`shareReplay(1)` — added
in TASK023 subtask 23.10) means all dropdown instances share one HTTP request per app lifetime.

This component will be reused in:
- `TariffDialogComponent` (`formControlName="equipmentTypeSlug"`)
- `EquipmentListComponent` filter bar (replaces inline `mat-select`, future refactor)
- `EquipmentDialogComponent` type select (future refactor)

### ControlValueAccessor contract

The component stores value internally as `signal<string | null>`:

```typescript
private _value = signal<string | null>(null);
private onChange: (v: string | null) => void = () => {};
private onTouched: () => void = () => {};

writeValue(v: string | null): void { this._value.set(v ?? null); }
registerOnChange(fn: (v: string | null) => void): void { this.onChange = fn; }
registerOnTouched(fn: () => void): void { this.onTouched = fn; }
setDisabledState(disabled: boolean): void { this.isDisabled.set(disabled); }
```

On `mat-select` `(selectionChange)`:
```typescript
onSelect(slug: string | null): void {
  this._value.set(slug);
  this.onChange(slug);
  this.onTouched();
}
```

### Component class

```typescript
@Component({
  selector: 'app-equipment-type-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: EquipmentTypeDropdownComponent, multi: true }],
  imports: [MatFormFieldModule, MatSelectModule],
  template: `...`
})
export class EquipmentTypeDropdownComponent implements ControlValueAccessor, OnInit {
  private service = inject(EquipmentTypeService);
  private destroyRef = inject(DestroyRef);

  types    = signal<EquipmentType[]>([]);
  loading  = signal(false);
  isDisabled = signal(false);
  value    = this._value.asReadonly();

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: t => { this.types.set(t); this.loading.set(false); } });
  }
}
```

### Template

```html
<mat-form-field appearance="outline" class="w-full">
  <mat-label>{{ label }}</mat-label>
  <mat-select
    [value]="_value()"
    [disabled]="isDisabled()"
    (selectionChange)="onSelect($event.value)"
    (blur)="onTouched()"
  >
    <mat-option [value]="null">—</mat-option>
    @if (loading()) {
      <mat-option disabled i18n>Loading…</mat-option>
    }
    @for (type of types(); track type.slug) {
      <mat-option [value]="type.slug">{{ type.name }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

The label is a class field using `$localize`:
```typescript
readonly label = $localize`Equipment Type`;
```

### Usage in TariffDialogComponent

```html
<!-- replaces the inline mat-select for equipmentTypeSlug -->
<app-equipment-type-dropdown
  formControlName="equipmentTypeSlug"
  class="col-span-2">
</app-equipment-type-dropdown>
```

No `types` input needed — the component fetches them from the cached service.

### Caching (added in TASK023 subtask 23.10)

`EquipmentTypeService` exposes a shared, lazy observable:

```typescript
private readonly allTypes$ = defer(() =>
  this.http.get<EquipmentTypeResponse[]>(this.baseUrl)
    .pipe(map(list => list.map(EquipmentTypeMapper.fromResponse)))
).pipe(shareReplay(1));

getAll(): Observable<EquipmentType[]> {
  return this.allTypes$;
}
```

Multiple `EquipmentTypeDropdownComponent` instances all subscribe to the same `allTypes$` stream.
Only one HTTP request is made across the entire app lifetime.

## Implementation Plan

### Files to create

1. **`src/app/shared/components/equipment-type-dropdown/equipment-type-dropdown.component.ts`**
   - Standalone, `OnPush`
   - `providers: [NG_VALUE_ACCESSOR]`
   - Imports: `MatFormFieldModule`, `MatSelectModule`
   - Implements `ControlValueAccessor`, `OnInit`
   - Signals: `types`, `loading`, `isDisabled`, `_value` (private)
   - `readonly label = $localize\`Equipment Type\``
   - Methods: `ngOnInit`, `onSelect`, `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`

2. **`src/app/shared/components/equipment-type-dropdown/equipment-type-dropdown.component.spec.ts`**
   - TestBed with `EquipmentTypeService` spy returning `of([{ slug: 'bike', name: 'Bike' }])`
   - Tests: renders options with `type.name`, selected value reflects `writeValue()`, `onChange` called on select,
     disabled state propagated, loading state shown while types load

### Files to modify

3. **`src/app/core/api/equipment-type.service.ts`** ← also in TASK023 subtask 23.10
   - Add `private readonly allTypes$` with `defer + shareReplay(1)` (if not already done by TASK023)

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID   | Description                                                        | Status    | Updated    | Notes                                                                     |
|------|--------------------------------------------------------------------|-----------|------------|---------------------------------------------------------------------------|
| 24.1 | Scaffold component with ControlValueAccessor providers             | Completed | 2026-03-23 | component created at `src/app/shared/components/equipment-type-dropdown/` |
| 24.2 | Load types from EquipmentTypeService.getAll() on ngOnInit          | Completed | 2026-03-23 | uses existing cached service `getAll()` (shareReplay cache in TASK023)    |
| 24.3 | Template: mat-select with name display, null option, loading state | Completed | 2026-03-23 | includes loading option and null option                                   |
| 24.4 | i18n label via $localize`Equipment Type`                           | Completed | 2026-03-23 | label left as `$localize`Equipment Type``                                 |
| 24.5 | ControlValueAccessor: writeValue, onChange, onTouched, disabled    | Completed | 2026-03-23 | ControlValueAccessor implemented using signals                            |
| 24.6 | Unit tests                                                         | Completed | 2026-03-23 | spec added and executed; tests passing                                    |

## Progress Log

### 2026-03-23

- Task created: self-contained dropdown replaces types-in-dialog-data pattern
- Implemented `EquipmentTypeDropdownComponent` at `src/app/shared/components/equipment-type-dropdown/equipment-type-dropdown.component.ts` which:
  - Loads equipment types from the cached `EquipmentTypeService.getAll()` and sorts by slug
  - Displays `type.name` and binds `type.slug` as the control value
  - Implements `ControlValueAccessor` using signals (value signal + onChange/onTouched)
  - Exposes i18n label via `$localize` and includes a null option and loading indicator
- Added unit tests: `equipment-type-dropdown.component.spec.ts` covering load, writeValue, selection change, and disabled state
- Ran full test suite (`npm test`): all tests passed locally (306 tests). New tests included and passing.


