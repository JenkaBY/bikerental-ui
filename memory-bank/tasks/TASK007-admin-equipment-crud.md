# TASK007 - Admin: Equipment CRUD

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK003 (also TASK005, TASK006 for type/status dropdowns data)  
**Blocks:** None

## Original Request

Build Equipment management in the admin module: a paginated table with search filters (by status and type), plus a
create/edit dialog. Desktop-optimized with dense table rows and pagination.

## Thought Process

Equipment is the most complex admin CRUD because:
1. It has **pagination** — `GET /api/equipments` returns `Page<EquipmentResponse>` with `mat-paginator`
2. It has **filters** — by `status` (slug) and `type` (slug), both are dropdowns populated from other APIs
3. The dialog has **foreign key selects** — typeSlug and statusSlug are dropdowns from Equipment Types/Statuses
4. It has a **date field** — `commissionedAt` uses `mat-datepicker`

The list component needs to:
- Fetch equipment types (`EquipmentTypeService.getAll()`) and statuses (`EquipmentStatusService.getAll()`) for filter dropdowns
- Build query params from filters + paginator state
- Re-fetch on filter change or page change

**API endpoints used**:
- `GET /api/equipments?status=&type=&page=&size=` → `Page<EquipmentResponse>`
- `POST /api/equipments` → create
- `PUT /api/equipments/{id}` → update
- `GET /api/equipment-types` → for dropdown options
- `GET /api/equipment-statuses` → for dropdown options

**Table columns**: UID, Serial Number, Type, Status, Model, Commissioned Date, Condition, Actions

**Dialog form fields**:
- `serialNumber` (required, max 50)
- `uid` (optional, max 100)
- `typeSlug` (select from equipment types)
- `statusSlug` (select from equipment statuses)
- `model` (optional, max 200)
- `commissionedAt` (optional, mat-datepicker)
- `condition` (optional, text)

## Implementation Plan

### 7.1 — Create EquipmentListComponent

Replace placeholder at `src/app/features/admin/equipment/equipment-list.component.ts`:

- Standalone, `OnPush`
- Imports: `MatTableModule`, `MatPaginatorModule`, `MatFormFieldModule`, `MatSelectModule`, `MatButtonModule`,
  `MatIconModule`, `MatCardModule`, `MatDialog`, `MatTooltipModule`, `MatProgressSpinnerModule`
- Injects: `EquipmentService`, `EquipmentTypeService`, `EquipmentStatusService`, `MatDialog`
- Signals:
  - `equipment = signal<EquipmentResponse[]>([])`
  - `totalItems = signal(0)`
  - `loading = signal(false)`
  - `types = signal<EquipmentTypeResponse[]>([])`
  - `statuses = signal<EquipmentStatusResponse[]>([])`
  - `filterStatus = signal<string | undefined>(undefined)`
  - `filterType = signal<string | undefined>(undefined)`
  - `pageIndex = signal(0)`
  - `pageSize = signal(20)`
- On init: load types, load statuses, load equipment
- Method `loadEquipment()`: builds `Pageable` from signals, calls `EquipmentService.search()`, updates signals
- On filter change: reset `pageIndex` to 0, call `loadEquipment()`
- On page change (from `mat-paginator`): update `pageIndex`/`pageSize`, call `loadEquipment()`
- `openCreateDialog()` and `openEditDialog(equipment)`: pass `{ types, statuses }` as dialog data

Template:
```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>Оборудование</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="filter-bar">
      <mat-form-field appearance="outline">
        <mat-label i18n>Статус</mat-label>
        <mat-select [value]="filterStatus()" (selectionChange)="onFilterStatusChange($event.value)">
          <mat-option [value]="undefined" i18n>Все</mat-option>
          @for (s of statuses(); track s.slug) {
            <mat-option [value]="s.slug">{{ s.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label i18n>Тип</mat-label>
        <mat-select [value]="filterType()" (selectionChange)="onFilterTypeChange($event.value)">
          <mat-option [value]="undefined" i18n>Все</mat-option>
          @for (t of types(); track t.slug) {
            <mat-option [value]="t.slug">{{ t.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon>
        <span i18n>Создать</span>
      </button>
    </div>

    @if (loading()) {
      <mat-spinner diameter="40"></mat-spinner>
    }

    <table mat-table [dataSource]="equipment()" class="full-width">
      <!-- columns: uid, serialNumber, type, status, model, commissionedAt, condition, actions -->
      <!-- each column follows standard mat-table pattern -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <mat-paginator
      [length]="totalItems()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="[10, 20, 50]"
      (page)="onPageChange($event)"
      showFirstLastButtons>
    </mat-paginator>
  </mat-card-content>
</mat-card>
```

CSS: `.filter-bar { display: flex; gap: 16px; align-items: baseline; margin-bottom: 16px; flex-wrap: wrap; }`

### 7.2 — Create EquipmentDialogComponent

Create `src/app/features/admin/equipment/equipment-dialog.component.ts`:

- Data: `{ equipment?: EquipmentResponse, types: EquipmentTypeResponse[], statuses: EquipmentStatusResponse[] }`
- Form controls: `serialNumber` (required), `uid`, `typeSlug` (select), `statusSlug` (select), `model`,
  `commissionedAt` (date), `condition`
- Imports: `MatDatepickerModule`, `MatNativeDateModule` (for datepicker)
- On edit: pre-fill form, parse `commissionedAt` string to Date for datepicker
- On save: convert Date back to ISO date string, build `EquipmentRequest`, call `create()` or `update(id, req)`

### 7.3 — Verify build and test

Test:
- Filter by status → table updates
- Filter by type → table updates
- Page through results with paginator
- Create new equipment with all fields
- Edit existing equipment

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 7.1 | EquipmentListComponent (paginated table + filters) | Not Started | 2026-02-28 | |
| 7.2 | EquipmentDialogComponent (form with selects + datepicker) | Not Started | 2026-02-28 | |
| 7.3 | Verify build and test | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with pagination + filter pattern
- Datepicker for commissionedAt field
- Foreign key selects for typeSlug and statusSlug

