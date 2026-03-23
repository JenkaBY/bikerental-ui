# TASK016 - TariffListComponent: Paginated Table Shell

**Status:** Pending  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Depends on:** TASK015 (v2 models + service + domain + mapper)  
**Blocks:** TASK017, TASK020, TASK021  
**Parent:** TASK008

## Original Request

Replace the placeholder `TariffListComponent` with a real standalone `OnPush` component that renders a
paginated `mat-table` of tariffs fetched from `TariffService.getAll()`. The component uses the **`Tariff`
domain object** (from `core/domain/`) — never the raw `TariffV2Response`. No action buttons yet — this task
delivers the read-only table shell with correct columns, pagination, loading spinner, and signal-based state.

## Thought Process

Start with a read-only shell so the table layout is verified independently before adding mutations (toggle,
dialog). This makes each incremental step testable in isolation.

The `TariffService` (after TASK015) already returns `Observable<Page<Tariff>>` — so the component never
touches API types; it only works with `Tariff` (from `core/domain/`).

### Columns

| Column         | Source field              | Notes                                     |
|----------------|---------------------------|-------------------------------------------|
| name           | `row.name`                |                                           |
| equipmentType  | `row.equipmentType`       |                                           |
| pricingType    | `row.pricingType`         |                                           |
| status         | `row.status`              | `mat-chip`: green for ACTIVE, grey for INACTIVE |
| validFrom      | `row.validFrom`           | `Date` object → display via `DatePipe`    |
| validTo        | `row.validTo`             | `Date` object → `DatePipe`, dash if empty |
| actions        | —                         | Empty `<td>` placeholder, filled later    |

### Signals

```typescript
tariffs    = signal<Tariff[]>([]);    // imported from core/domain
totalItems = signal(0);
loading    = signal(false);
pageIndex  = signal(0);
pageSize   = signal(10);
```

### Data loading

- `loadTariffs()` calls `TariffService.getAll({ page: pageIndex(), size: pageSize() })`
- Returns `Observable<Page<Tariff>>` — no mapping needed in the component
- Called on `ngOnInit` via `takeUntilDestroyed`
- `MatPaginatorModule` event `(page)="onPageChange($event)"` updates `pageIndex` / `pageSize` signals and
  calls `loadTariffs()` again

### Template outline

```html
<mat-card>
  <mat-card-header>
    <mat-card-title>{{ labels.Tariffs }}</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    @if (loading()) { <mat-spinner diameter="40"></mat-spinner> }

    <table mat-table [dataSource]="tariffs()" class="w-full">
      <!-- columns: name, equipmentType, pricingType, status, validFrom, validTo, actions -->
      <!-- validFrom/validTo: {{ row.validFrom | date:'dd.MM.yyyy' }} -->
    </table>

    <mat-paginator [length]="totalItems()" [pageSize]="pageSize()"
      [pageSizeOptions]="[10, 20, 50]" (page)="onPageChange($event)" showFirstLastButtons>
    </mat-paginator>
  </mat-card-content>
</mat-card>
```

## Implementation Plan

### Files to create / modify

1. **`src/app/features/admin/tariffs/tariff-list.component.ts`** — replace placeholder:
   - `standalone: true`, `ChangeDetectionStrategy.OnPush`
   - Import `Tariff` from `../../../core/domain` — **not** from `core/models`
   - Imports: `MatCardModule`, `MatTableModule`, `MatPaginatorModule`, `MatChipsModule`,
     `MatProgressSpinnerModule`, `DatePipe`, `CommonModule`
   - Inject: `TariffService`, `DestroyRef`
   - Signals: `tariffs`, `totalItems`, `loading`, `pageIndex`, `pageSize`
   - Methods: `loadTariffs()`, `onPageChange(event: PageEvent)`, `ngOnInit`
   - `displayedColumns = ['name','equipmentType','pricingType','status','validFrom','validTo','actions']`
   - Status chip: use `[highlighted]="row.status === 'ACTIVE'"` on `<mat-chip>`

2. **`src/app/shared/constant/labels.ts`** — add `Tariffs` label if missing

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID    | Description                                     | Status      | Updated    | Notes |
|-------|-------------------------------------------------|-------------|------------|-------|
| 16.1  | Replace placeholder component class + template  | Not Started | 2026-03-23 |       |
| 16.2  | Wire pagination (pageIndex, pageSize, onPage)   | Not Started | 2026-03-23 |       |
| 16.3  | Status chip with highlighted for ACTIVE         | Not Started | 2026-03-23 |       |
| 16.4  | Date columns via DatePipe on Date objects       | Not Started | 2026-03-23 |       |
| 16.5  | Empty actions column placeholder                | Not Started | 2026-03-23 |       |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Read-only table shell first — mutations added in TASK017 and TASK020
- Component uses `Tariff` domain type (Date objects for validFrom/validTo), not raw `TariffV2Response`

**Status:** Pending  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Depends on:** TASK015 (v2 models + service)  
**Blocks:** TASK017, TASK020, TASK021  
**Parent:** TASK008

## Original Request

Replace the placeholder `TariffListComponent` with a real standalone `OnPush` component that renders a
paginated `mat-table` of tariffs fetched from `GET /api/v2/tariffs`. No action buttons yet — this task
delivers the read-only table shell with correct columns, pagination, loading spinner, and signal-based state.

## Thought Process

Start with a read-only shell so the table layout is verified independently before adding mutations (toggle,
dialog). This makes each incremental step testable in isolation.

### Columns

| Column         | Source field              | Notes                                     |
|----------------|---------------------------|-------------------------------------------|
| name           | `row.name`                |                                           |
| equipmentType  | `row.equipmentType`       |                                           |
| pricingType    | `row.pricingType`         |                                           |
| status         | `row.status`              | `mat-chip`: green for ACTIVE, grey for INACTIVE |
| validFrom      | `row.validFrom`           | display as date                           |
| validTo        | `row.validTo`             | display as date, dash if empty            |
| actions        | —                         | Empty `<td>` placeholder, filled later    |

### Signals

```typescript
tariffs    = signal<Tariff[]>([]);    // imported from core/domain — NOT TariffV2Response
totalItems = signal(0);
loading    = signal(false);
pageIndex  = signal(0);
pageSize   = signal(10);
```

### Data loading

- `loadTariffs()` calls `TariffService.getAll({ page: pageIndex(), size: pageSize() })`
- Called on `ngOnInit` via `takeUntilDestroyed`
- `MatPaginatorModule` event `(page)="onPageChange($event)"` updates `pageIndex` / `pageSize` signals and
  calls `loadTariffs()` again

### Template outline

```html
<mat-card>
  <mat-card-header>
    <mat-card-title>{{ labels.Tariffs }}</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    @if (loading()) { <mat-spinner diameter="40"></mat-spinner> }

    <table mat-table [dataSource]="tariffs()" class="w-full">
      <!-- columns: name, equipmentType, pricingType, status, validFrom, validTo, actions -->
    </table>

    <mat-paginator [length]="totalItems()" [pageSize]="pageSize()"
      [pageSizeOptions]="[10, 20, 50]" (page)="onPageChange($event)" showFirstLastButtons>
    </mat-paginator>
  </mat-card-content>
</mat-card>
```

## Implementation Plan

### Files to create / modify

1. **`src/app/features/admin/tariffs/tariff-list.component.ts`** — replace placeholder:
   - `standalone: true`, `ChangeDetectionStrategy.OnPush`
   - Imports: `MatCardModule`, `MatTableModule`, `MatPaginatorModule`, `MatChipsModule`,
     `MatProgressSpinnerModule`, `DatePipe`, `CommonModule`
   - Inject: `TariffService`, `DestroyRef`
   - Signals: `tariffs`, `totalItems`, `loading`, `pageIndex`, `pageSize`
   - Methods: `loadTariffs()`, `onPageChange(event: PageEvent)`, `ngOnInit`
   - `displayedColumns = ['name','equipmentType','pricingType','status','validFrom','validTo','actions']`
   - Status chip: use `[highlighted]="row.status === 'ACTIVE'"` on `<mat-chip>`

2. **`src/app/shared/constant/labels.ts`** — add `Tariffs` label if missing

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID    | Description                                     | Status      | Updated    | Notes |
|-------|-------------------------------------------------|-------------|------------|-------|
| 16.1  | Replace placeholder component class + template  | Not Started | 2026-03-23 |       |
| 16.2  | Wire pagination (pageIndex, pageSize, onPage)   | Not Started | 2026-03-23 |       |
| 16.3  | Status chip with highlighted for ACTIVE         | Not Started | 2026-03-23 |       |
| 16.4  | Empty actions column placeholder                | Not Started | 2026-03-23 |       |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Read-only table shell first — mutations added in TASK017 and TASK020

