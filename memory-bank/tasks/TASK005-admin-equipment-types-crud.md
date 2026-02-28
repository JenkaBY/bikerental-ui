# TASK005 - Admin: Equipment Types CRUD

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK003  
**Blocks:** None

## Original Request

Build a full CRUD page for Equipment Types in the admin module. The page shows a table listing all equipment types
with a "Create" button. Clicking "Create" or "Edit" opens a Material dialog with a form. The page uses
`EquipmentTypeService` from `core/api/`.

## Thought Process

Equipment Types is the simplest CRUD — no pagination, no filters, no foreign keys. It's a good starting point
to establish the admin CRUD pattern that will be reused in TASK006–TASK009.

**Pattern to establish**:
1. List component (smart): fetches data, stores in signal, opens dialogs, refreshes on dialog close
2. Dialog component (dumb-ish): receives optional data for edit mode, contains reactive form, calls service, returns result

**API endpoints used**:
- `GET /api/equipment-types` → returns `EquipmentTypeResponse[]` (no pagination)
- `POST /api/equipment-types` → creates new type
- `PUT /api/equipment-types/{slug}` → updates existing type

**Form fields**:
- `slug` (required, pattern: `^[a-z0-9-]+$`, maxLength 50) — disabled when editing
- `name` (required, display name)
- `description` (optional, textarea)

**Table columns**: Slug, Name, Description, Actions (Edit button)

## Implementation Plan

### 5.1 — Create EquipmentTypeListComponent

Replace the placeholder at `src/app/features/admin/equipment-types/equipment-type-list.component.ts`:

- Standalone component
- Imports: `MatTableModule`, `MatButtonModule`, `MatIconModule`, `MatCardModule`, `MatDialog`, `MatTooltipModule`
- Injects: `EquipmentTypeService`, `MatDialog`
- `OnPush` change detection
- Signals: `types = signal<EquipmentTypeResponse[]>([])`, `loading = signal(false)`
- On init: call `loadTypes()` which fetches from service and sets signal
- Method `openCreateDialog()`: opens `EquipmentTypeDialogComponent` with no data, on close → refresh
- Method `openEditDialog(type: EquipmentTypeResponse)`: opens dialog with data, on close → refresh

Template (`equipment-type-list.component.html`):
```html
<mat-card>
  <mat-card-header>
    <mat-card-title i18n>Типы оборудования</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="actions-bar">
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon>
        <span i18n>Создать</span>
      </button>
    </div>

    <table mat-table [dataSource]="types()" class="full-width">
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

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let row">
          <button mat-icon-button (click)="openEditDialog(row)" matTooltip="Редактировать" i18n-matTooltip>
            <mat-icon>edit</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="['slug', 'name', 'description', 'actions']"></tr>
      <tr mat-row *matRowDef="let row; columns: ['slug', 'name', 'description', 'actions']"></tr>
    </table>
  </mat-card-content>
</mat-card>
```

CSS: `.full-width { width: 100%; }` `.actions-bar { margin-bottom: 16px; }`

### 5.2 — Create EquipmentTypeDialogComponent

Create `src/app/features/admin/equipment-types/equipment-type-dialog.component.ts`:

- Standalone component
- Imports: `MatDialogModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `ReactiveFormsModule`
- Injects: `MatDialogRef`, `MAT_DIALOG_DATA`, `EquipmentTypeService`
- `OnPush` change detection
- Data injection: `data: { type?: EquipmentTypeResponse }` — if `type` is present, it's edit mode
- Reactive form: `FormGroup` with controls:
  - `slug`: `FormControl<string>` (required, pattern `/^[a-z0-9-]+$/`, maxLength 50). Disabled if edit mode.
  - `name`: `FormControl<string>` (required)
  - `description`: `FormControl<string>` (optional)
- Signal: `saving = signal(false)`
- Method `save()`:
  - If form invalid, mark all as touched and return
  - Set `saving(true)`
  - Build `EquipmentTypeRequest` from form values
  - If edit mode: call `EquipmentTypeService.update(slug, request)` (slug from data, not form since disabled)
  - If create mode: call `EquipmentTypeService.create(request)` (slug from form)
  - On success: close dialog with result `true`
  - On error: set `saving(false)`, show `mat-snack-bar` error

Template (`equipment-type-dialog.component.html`):
```html
<h2 mat-dialog-title>
  @if (data?.type) {
    <span i18n>Редактировать тип оборудования</span>
  } @else {
    <span i18n>Создать тип оборудования</span>
  }
</h2>
<mat-dialog-content>
  <form [formGroup]="form" class="dialog-form">
    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>Slug</mat-label>
      <input matInput formControlName="slug" placeholder="e.g. bike">
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

CSS: `.dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; }`

### 5.3 — Verify build and test

Run:
```powershell
npm run build
```

Test manually:
- Navigate to `/admin/equipment-types`
- Should show empty table (or with data if backend has types)
- Click "Create" → dialog opens with empty form
- Fill slug, name → click Save → dialog closes, table refreshes
- Click Edit → dialog opens with pre-filled data, slug disabled
- Edit name → Save → table refreshes

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 5.1 | EquipmentTypeListComponent (table + dialog open) | Not Started | 2026-02-28 | |
| 5.2 | EquipmentTypeDialogComponent (form + save) | Not Started | 2026-02-28 | |
| 5.3 | Verify build and test | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with full CRUD pattern definition
- This establishes the reusable pattern for TASK006–TASK009

