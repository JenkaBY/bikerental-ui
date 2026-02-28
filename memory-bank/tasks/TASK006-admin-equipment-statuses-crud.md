# TASK006 - Admin: Equipment Statuses CRUD

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK003  
**Blocks:** None

## Original Request

Build a CRUD page for Equipment Statuses in the admin module. Same pattern as TASK005 (table + dialog), but the
dialog includes an `allowedTransitions` multi-select field that lets the admin choose which other statuses this
status can transition to.

## Thought Process

Equipment Statuses is similar to Equipment Types but adds complexity with the `allowedTransitions` field:
- The dialog needs to fetch all existing statuses to populate the multi-select options
- When editing, the current status's own slug should be excluded from the transition options
- We use `mat-select` with `multiple` attribute for the transitions picker
- The table should display allowed transitions as Material chips (`mat-chip`)

**API endpoints used**:
- `GET /api/equipment-statuses` → returns `EquipmentStatusResponse[]` (no pagination)
- `POST /api/equipment-statuses` → creates new status
- `PUT /api/equipment-statuses/{slug}` → updates existing status

**Form fields**:
- `slug` (required, pattern `^[a-z0-9-]+$`, maxLength 50) — disabled on edit
- `name` (required, display name)
- `description` (optional, textarea)
- `allowedTransitions` (multi-select from existing status slugs, excluding self)

**Table columns**: Slug, Name, Description, Allowed Transitions (chips), Actions

## Implementation Plan

### 6.1 — Create EquipmentStatusListComponent

Replace placeholder at `src/app/features/admin/equipment-statuses/equipment-status-list.component.ts`:

- Standalone, `OnPush`
- Imports: `MatTableModule`, `MatButtonModule`, `MatIconModule`, `MatCardModule`, `MatChipsModule`, `MatDialog`, `MatTooltipModule`
- Injects: `EquipmentStatusService`, `MatDialog`
- Signals: `statuses = signal<EquipmentStatusResponse[]>([])`, `loading = signal(false)`
- On init: `loadStatuses()` → fetches all statuses
- `openCreateDialog()`: opens `EquipmentStatusDialogComponent` with `{ statuses: this.statuses() }`, on close → refresh
- `openEditDialog(status)`: opens dialog with `{ status, statuses: this.statuses() }`, on close → refresh

Template:
```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>Статусы оборудования</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="actions-bar">
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon>
        <span i18n>Создать</span>
      </button>
    </div>

    <table mat-table [dataSource]="statuses()" class="full-width">
      <ng-container matColumnDef="slug">
        <th mat-header-cell *matHeaderCellDef i18n>Slug</th>
        <td mat-cell *matCellDef="let row">{{ row.slug }}</td>
      </ng-container>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef i18n>Название</th>
        <td mat-cell *matCellDef="let row">{{ row.name }}</td>
      </ng-container>

      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef i18n>Описание</th>
        <td mat-cell *matCellDef="let row">{{ row.description }}</td>
      </ng-container>

      <ng-container matColumnDef="allowedTransitions">
        <th mat-header-cell *matHeaderCellDef i18n>Разрешенные переходы</th>
        <td mat-cell *matCellDef="let row">
          <mat-chip-set>
            @for (t of row.allowedTransitions; track t) {
              <mat-chip>{{ t }}</mat-chip>
            }
          </mat-chip-set>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let row">
          <button mat-icon-button (click)="openEditDialog(row)" matTooltip="Редактировать" i18n-matTooltip>
            <mat-icon>edit</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>
  </mat-card-content>
</mat-card>
```

Where `displayedColumns = ['slug', 'name', 'description', 'allowedTransitions', 'actions']`.

### 6.2 — Create EquipmentStatusDialogComponent

Create `src/app/features/admin/equipment-statuses/equipment-status-dialog.component.ts`:

- Data injection: `{ status?: EquipmentStatusResponse, statuses: EquipmentStatusResponse[] }`
- Reactive form: `slug`, `name`, `description`, `allowedTransitions` (FormControl<string[]>)
- Computed property `transitionOptions`: filter out the current status slug from `data.statuses`
- `mat-select` with `multiple` for transitions, displaying slug as label

Template:
```html
<h2 mat-dialog-title>
  @if (data?.status) {
    <span i18n>Редактировать статус</span>
  } @else {
    <span i18n>Создать статус</span>
  }
</h2>
<mat-dialog-content>
  <form [formGroup]="form" class="dialog-form">
    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>Slug</mat-label>
      <input matInput formControlName="slug" placeholder="e.g. available">
      @if (form.controls.slug.hasError('required')) {
        <mat-error i18n>Slug обязателен</mat-error>
      }
      @if (form.controls.slug.hasError('pattern')) {
        <mat-error i18n>Только строчные буквы, цифры и дефисы</mat-error>
      }
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>Название</mat-label>
      <input matInput formControlName="name">
      @if (form.controls.name.hasError('required')) {
        <mat-error i18n>Название обязательно</mat-error>
      }
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>Описание</mat-label>
      <textarea matInput formControlName="description" rows="3"></textarea>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>Разрешенные переходы</mat-label>
      <mat-select formControlName="allowedTransitions" multiple>
        @for (opt of transitionOptions; track opt.slug) {
          <mat-option [value]="opt.slug">{{ opt.name }} ({{ opt.slug }})</mat-option>
        }
      </mat-select>
    </mat-form-field>
  </form>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close i18n>Отмена</button>
  <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
    @if (saving()) {
      <span i18n>Сохранение...</span>
    } @else {
      <span i18n>Сохранить</span>
    }
  </button>
</mat-dialog-actions>
```

Save logic: same as TASK005 — build `EquipmentStatusRequest`, call `create()` or `update()`.

### 6.3 — Verify build and test

Test:
- Create a status with allowed transitions
- Edit and change transitions
- Verify chips display correctly in table

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 6.1 | EquipmentStatusListComponent | Not Started | 2026-02-28 | |
| 6.2 | EquipmentStatusDialogComponent (with transitions multi-select) | Not Started | 2026-02-28 | |
| 6.3 | Verify build and test | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created following CRUD pattern from TASK005
- Added allowedTransitions multi-select with self-exclusion logic

