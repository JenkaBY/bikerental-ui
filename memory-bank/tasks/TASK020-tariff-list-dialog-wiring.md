# TASK020 - Wire TariffDialog into TariffList (Create + Edit)

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-24  
**Depends on:** TASK016 (table shell), TASK018 (base dialog), TASK019 (pricing params)  
**Blocks:** TASK021, TASK022  
**Parent:** TASK008

## Original Request

Connect `TariffDialogComponent` into `TariffListComponent`:
- **Create** button in the card header opens dialog without a tariff (create mode)
- **Edit** icon button in the actions column opens dialog pre-filled with the row tariff (edit mode)
- On dialog close with `true` result: reload the tariff list and show snackbar "Saved"

All types used in the wiring are **domain types** from `core/models/`. `TariffListComponent` does
**not** need to load or pass equipment types — `EquipmentTypeDropdownComponent` (TASK024) loads them
from the cached service internally.

## Thought Process

This is the wiring step. Both components (TASK016, TASK018/TASK019) are ready but not yet connected.
`TariffDialogData` contains only `tariff?: Tariff` — no `types[]`.

### Open dialog methods

```typescript
openCreateDialog(): void {
  this.dialog.open(TariffDialogComponent, {
    data: {} satisfies TariffDialogData,   // no tariff = create mode; no types needed
    width: '680px',
  }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
    if (result) {
      this.snackBar.open(Labels.Saved, Labels.Close, { duration: 3000 });
      this.loadTariffs();
    }
  });
}

openEditDialog(tariff: Tariff): void {
  this.dialog.open(TariffDialogComponent, {
    data: { tariff } satisfies TariffDialogData,   // just the Tariff; dropdown self-loads types
    width: '680px',
  }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
    if (result) {
      this.snackBar.open(Labels.Saved, Labels.Close, { duration: 3000 });
      this.loadTariffs();
    }
  });
}
```

### Template additions

**"Create" button** — inside `<mat-card-content>` before the table:

```html
<div class="flex justify-end mb-2">
  <button mat-raised-button color="primary" (click)="openCreateDialog()">
    <mat-icon>add</mat-icon>
    <span>{{ labels.Create }}</span>
  </button>
</div>
```

**Edit button** in actions column (alongside the toggle from TASK017):

```html
<button mat-icon-button (click)="openEditDialog(row)" [matTooltip]="labels.Edit">
  <mat-icon>edit</mat-icon>
</button>
```

### New imports in TariffListComponent

- `MatDialog` (inject)
- `MatSnackBar` (inject, if not already added in TASK017)
- `TariffDialogComponent`, `TariffDialogData`
- `Tariff` from `core/models/` (already imported from TASK016)
- **No `EquipmentTypeService`** — `EquipmentTypeDropdown` self-loads types

## Implementation Plan

### Files to modify

1. **`src/app/features/admin/tariffs/tariff-list.component.ts`**
   - Add `MatDialog` injection
   - Add `openCreateDialog()` and `openEditDialog(tariff: Tariff)` methods
   - Add Create button to template header
   - Add Edit icon button to actions column template
   - **No `types` signal** — dropdown loads types independently

2. **`src/app/shared/constant/labels.ts`**
   - Add `Saved` label if missing (added in TASK018 subtask 18.1)

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID    | Description                                           | Status      | Updated    | Notes |
|-------|-------------------------------------------------------|-------------|------------|-------|
| 20.1  | openCreateDialog() — data: {} (no types)              | Not Started | 2026-03-23 |       |
| 20.2  | openEditDialog(tariff: Tariff) — data: { tariff }     | Not Started | 2026-03-23 |       |
| 20.3  | Create button in card header                          | Not Started | 2026-03-23 |       |
| 20.4  | Edit icon button in actions column                    | Not Started | 2026-03-23 |       |
| 20.5  | Reload list + snackbar on dialog close with result    | Not Started | 2026-03-23 |       |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Wiring is the last feature step before tests (TASK021, TASK022)
- `TariffDialogData` has no `types[]` — `EquipmentTypeDropdown` (TASK024) self-loads from cached service
- `TariffListComponent` no longer injects `EquipmentTypeService` (simplified from earlier design)

### 2026-03-24

- Implemented wiring: added `openCreateDialog()` and `openEditDialog(tariff)` to `TariffListComponent`, injected `MatDialog` via `inject()`, added Create button and Edit icon in the template, and wired dialog `afterClosed()` to show `Labels.Saved` snackbar and reload the list via `load()` on truthy result.
- Added unit tests to `tariff-list.component.spec.ts` that mock `MatDialog` and verify both create/edit flows, snackbar behavior, and list reload.
- Updated task status to Completed and updated memory-bank progress.

### 2026-03-24 (additional)

- Adjusted TariffList presentation: show pricing-type title (UI-localized) in table; pricing descriptions are shown in dialog as helper text only.
- Added green styling for ACTIVE status toggle and updated toggle behavior to trigger activate/deactivate via `TariffService`.

