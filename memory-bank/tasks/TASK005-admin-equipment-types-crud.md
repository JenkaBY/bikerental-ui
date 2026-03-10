# TASK005 - Admin: Equipment Types CRUD

**Status:** Completed  
**Added:** 2026-02-28  
**Updated:** 2026-03-10  
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
    <mat-card-title i18n>Equipment types</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="actions-bar">
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon>
        <span i18n>Create</span>
      </button>
    </div>

    <table mat-table [dataSource]="types()" class="full-width">
      <ng-container matColumnDef="slug">
        <th mat-header-cell *matHeaderCellDef i18n>Slug</th>
        <td mat-cell *matCellDef="let row">{{ row.slug }}</td>
      </ng-container>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef i18n>Name</th>
        <td mat-cell *matCellDef="let row">{{ row.name }}</td>
      </ng-container>

      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef i18n>Description</th>
        <td mat-cell *matCellDef="let row">{{ row.description }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let row">
          <button mat-icon-button (click)="openEditDialog(row)" matTooltip="Edit" i18n-matTooltip>
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
  - `slug`: `FormControl<string>` (required, pattern `/^[a-z0-9-_]+$/`, maxLength 50). Disabled if edit mode.
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
    <span i18n>Edit</span>
  } @else {
    <span i18n>Create</span>
  }
</h2>
<mat-dialog-content>
  <form [formGroup]="form" class="dialog-form">
    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>Slug</mat-label>
      <input matInput formControlName="slug" placeholder="e.g. bike">
      @if (form.controls.slug.hasError('required')) {
        <mat-error i18n>Slug required</mat-error>
      }
      @if (form.controls.slug.hasError('pattern')) {
        <mat-error i18n>Only lowercase letters, numbers, hyphens and underscores</mat-error>
      }
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>Name</mat-label>
      <input matInput formControlName="name">
      @if (form.controls.name.hasError('required')) {
        <mat-error i18n>Name is required</mat-error>
      }
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label i18n>Description</mat-label>
      <textarea matInput formControlName="description" rows="3"></textarea>
    </mat-form-field>
  </form>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close i18n>Cancel</button>
  <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
    @if (saving()) {
      <span i18n>Saving...</span>
    } @else {
      <span i18n>Save</span>
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

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 5.1 | EquipmentTypeListComponent (table + dialog open) | Complete | 2026-03-10 | `signal<EquipmentTypeResponse[]>`, `takeUntilDestroyed`, barrel import |
| 5.2 | EquipmentTypeDialogComponent (form + save) | Complete | 2026-03-10 | ReactiveFormsModule, `description \|\| undefined` coercion |
| 5.3 | Verify build and test | Complete | 2026-03-10 | 21 new tests (8 list + 13 dialog); 152 total pass |

## Progress Log

### 2026-03-10

- Implemented `EquipmentTypeListComponent`: replaced placeholder; `OnPush`; `MatTableModule`, `MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatTooltipModule`; signals `types` + `loading`; `loadTypes()` via `takeUntilDestroyed`; `openCreateDialog()` / `openEditDialog()` open dialog and refresh on `true` result
- Implemented `EquipmentTypeDialogComponent`: `ReactiveFormsModule`; typed `FormGroup` with `slug` (disabled in edit mode, pattern `/^[a-z0-9-_]+$/`, maxLength 50), `name` (required), `description` (optional); `saving` signal; `save()` calls `create` or `update` depending on mode; snackbar on error; closes with `true` on success
- Key decision: used standard `ReactiveFormsModule` (not experimental Signal Forms) — stable, consistent with task spec, establishes reusable CRUD pattern for TASK006–TASK009
- Key fix: `description || undefined` to coerce empty string to `undefined` in request body
- Created `equipment-type-list.component.spec.ts` (8 tests) and `equipment-type-dialog.component.spec.ts` (13 tests)
- All 152 tests pass across 36 test files

### 2026-02-28

- Task created with full CRUD pattern definition
- This establishes the reusable pattern for TASK006–TASK009

