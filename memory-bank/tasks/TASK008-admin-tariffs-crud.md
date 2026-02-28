# TASK008 - Admin: Tariffs CRUD

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK003  
**Blocks:** None

## Original Request

Build Tariff management in the admin module: paginated table with all tariff fields, create/edit dialog with price
fields, and activate/deactivate toggle buttons in the table row actions.

## Thought Process

Tariffs have many numeric fields (5 price fields) and a status toggle. The table will be wide but that's fine on
a desktop screen ≥22".

Key features:
1. **Paginated table** — `GET /api/tariffs` returns `Page<TariffResponse>`
2. **Status toggle** — ACTIVE tariffs have a "Deactivate" button, INACTIVE have "Activate"
3. **Status indicator** — colored chip: green for ACTIVE, grey for INACTIVE
4. **Price formatting** — display prices with 2 decimal places
5. **Date fields** — `validFrom` and `validTo` use `mat-datepicker`

**API endpoints used**:
- `GET /api/tariffs?page=&size=` → `Page<TariffResponse>`
- `POST /api/tariffs` → create
- `PUT /api/tariffs/{id}` → update
- `PATCH /api/tariffs/{id}/activate` → activate
- `PATCH /api/tariffs/{id}/deactivate` → deactivate
- `GET /api/equipment-types` → for equipment type dropdown in dialog

**Table columns**: Name, Equipment Type, Base Price, 30min Price, Hour Price, Day Price, Status, Valid From,
Valid To, Actions (Edit, Activate/Deactivate)

**Dialog form fields**:
- `name` (required, max 200)
- `description` (optional, max 1000, textarea)
- `equipmentTypeSlug` (select from equipment types)
- `basePrice` (required, min 0, type: number)
- `halfHourPrice` (required, min 0)
- `hourPrice` (required, min 0)
- `dayPrice` (required, min 0)
- `hourDiscountedPrice` (required, min 0)
- `validFrom` (required, datepicker)
- `validTo` (optional, datepicker)
- `status` (select: ACTIVE / INACTIVE)

## Implementation Plan

### 8.1 — Create TariffListComponent

Replace placeholder at `src/app/features/admin/tariffs/tariff-list.component.ts`:

- Standalone, `OnPush`
- Imports: `MatTableModule`, `MatPaginatorModule`, `MatButtonModule`, `MatIconModule`, `MatCardModule`,
  `MatChipsModule`, `MatDialog`, `MatTooltipModule`, `MatSnackBar`, `DecimalPipe`, `DatePipe`
- Injects: `TariffService`, `EquipmentTypeService`, `MatDialog`, `MatSnackBar`
- Signals: `tariffs`, `totalItems`, `loading`, `pageIndex`, `pageSize`, `types` (for dialog)
- On init: load tariffs (paginated), load equipment types
- Table with all columns, prices formatted with `DecimalPipe` (1.2-2)
- Status column: `mat-chip` with `color="accent"` for ACTIVE, no color for INACTIVE
- Actions column:
  - Edit button → opens dialog
  - Toggle button: if ACTIVE → icon `toggle_off`, tooltip "Деактивировать"; if INACTIVE → icon `toggle_on`, tooltip "Активировать"
  - On toggle click → call `TariffService.activate(id)` or `deactivate(id)` → on success refresh + snackbar

Template structure:
```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>Тарифы</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="actions-bar">
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon>
        <span i18n>Создать</span>
      </button>
    </div>

    <table mat-table [dataSource]="tariffs()" class="full-width">
      <!-- columns: name, equipmentTypeSlug, basePrice, halfHourPrice, hourPrice, dayPrice,
           status, validFrom, validTo, actions -->
      
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef i18n>Статус</th>
        <td mat-cell *matCellDef="let row">
          <mat-chip [highlighted]="row.status === 'ACTIVE'">
            {{ row.status }}
          </mat-chip>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let row">
          <button mat-icon-button (click)="openEditDialog(row)" matTooltip="Редактировать" i18n-matTooltip>
            <mat-icon>edit</mat-icon>
          </button>
          @if (row.status === 'ACTIVE') {
            <button mat-icon-button (click)="toggleStatus(row)" matTooltip="Деактивировать" i18n-matTooltip>
              <mat-icon>toggle_off</mat-icon>
            </button>
          } @else {
            <button mat-icon-button (click)="toggleStatus(row)" matTooltip="Активировать" i18n-matTooltip>
              <mat-icon>toggle_on</mat-icon>
            </button>
          }
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <mat-paginator [length]="totalItems()" [pageSize]="pageSize()" [pageSizeOptions]="[10, 20, 50]"
      (page)="onPageChange($event)" showFirstLastButtons>
    </mat-paginator>
  </mat-card-content>
</mat-card>
```

### 8.2 — Create TariffDialogComponent

Create `src/app/features/admin/tariffs/tariff-dialog.component.ts`:

- Data: `{ tariff?: TariffResponse, types: EquipmentTypeResponse[] }`
- Reactive form with all tariff fields
- Price fields: `type="number"`, `min="0"`, `step="0.01"`
- Date fields: `mat-datepicker`
- Status: `mat-select` with options ACTIVE, INACTIVE
- Equipment type: `mat-select` with options from `data.types`
- On save: build `TariffRequest`, convert dates to ISO strings, call `create()` or `update(id, req)`

Layout: two-column grid for price fields to save vertical space on desktop:
```css
.price-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
```

### 8.3 — Verify build and test

Test:
- Paginated table with all columns visible
- Create tariff with all price fields
- Edit tariff
- Activate/deactivate toggle changes status and refreshes
- Date pickers work for validFrom/validTo

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 8.1 | TariffListComponent (paginated table + toggle) | Not Started | 2026-02-28 | |
| 8.2 | TariffDialogComponent (price fields + datepickers) | Not Started | 2026-02-28 | |
| 8.3 | Verify build and test | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with full tariff CRUD design
- Two-column price grid for desktop dialog
- Status toggle in table row actions

