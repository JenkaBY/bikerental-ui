# TASK017 - TariffListComponent: Status Toggle (Activate / Deactivate)

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-23  
**Depends on:** TASK016 (table shell)  
**Blocks:** TASK021  
**Parent:** TASK008

## Original Request

Add activate / deactivate toggle buttons to the actions column of `TariffListComponent`. An ACTIVE tariff
shows a "Deactivate" icon button; an INACTIVE tariff shows an "Activate" icon button. Calling the action
should refresh the list row and show a `MatSnackBar` confirmation.

The component works exclusively with the **`Tariff` domain type** from `core/domain/`. After TASK015,
`TariffService.activate(id)` and `TariffService.deactivate(id)` both return `Observable<Tariff>`.

## Thought Process

The status toggle is isolated here so the read-only shell (TASK016) can be reviewed and tested first. Toggle
calls a PATCH endpoint — safe to implement after table renders correctly.

### Toggle logic

```
row.status === 'ACTIVE'   → call deactivate(row.id) → icon: toggle_off, tooltip: "Деактивировать"
row.status === 'INACTIVE' → call activate(row.id)   → icon: toggle_on,  tooltip: "Активировать"
```

On success: reload the full list (`loadTariffs()`), show snackbar "Статус изменён".  
On error: show snackbar with error message.

### Template fragment

```html
<ng-container matColumnDef="actions">
  <th mat-header-cell *matHeaderCellDef></th>
  <td mat-cell *matCellDef="let row">
    @if (row.status === 'ACTIVE') {
      <button mat-icon-button (click)="toggleStatus(row)"
              [matTooltip]="labels.Deactivate">
        <mat-icon>toggle_off</mat-icon>
      </button>
    } @else {
      <button mat-icon-button (click)="toggleStatus(row)"
              [matTooltip]="labels.Activate">
        <mat-icon>toggle_on</mat-icon>
      </button>
    }
  </td>
</ng-container>
```

### Method

```typescript
toggleStatus(row: Tariff): void {   // Tariff from core/domain — not TariffV2Response
  const call$ = row.status === 'ACTIVE'
    ? this.tariffService.deactivate(row.id)
    : this.tariffService.activate(row.id);

  call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: () => {
      this.snackBar.open(Labels.StatusChanged, Labels.Close, { duration: 3000 });
      this.loadTariffs();
    },
    error: (err) => this.snackBar.open(err.message ?? Labels.ErrorOccurred, Labels.Close, { duration: 4000 }),
  });
}
```

## Implementation Plan

### Files to modify

1. **`src/app/features/admin/tariffs/tariff-list.component.ts`**
   - Add imports: `MatIconModule`, `MatTooltipModule`, `MatSnackBar`
   - Inject `MatSnackBar`
   - `toggleStatus(row: Tariff)` — uses `Tariff` from `core/domain/` not `core/models/`
   - Fill the `actions` column template with conditional toggle button

2. **`src/app/shared/constant/labels.ts`**
   - Add `Activate`, `Deactivate`, `StatusChanged`, `ErrorOccurred`, `Close` if missing

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID   | Description                                        | Status    | Updated    | Notes                                                                               |
|------|----------------------------------------------------|-----------|------------|-------------------------------------------------------------------------------------|
| 17.1 | Conditional toggle button in actions column        | Completed | 2026-03-23 | Template and imports added; moved toggle into status column                         |
| 17.2 | toggleStatus(row: Tariff) method with service call | Completed | 2026-03-23 | Implementation added; uses TariffService.activate/deactivate; per-row pending state |
| 17.3 | Snackbar for success + error                       | Completed | 2026-03-23 | Labels added and snackbar used in method                                            |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Toggle pattern follows Equipment Status CRUD (TASK006)
- `row` parameter is `Tariff` domain type — `TariffService.activate/deactivate` already return `Tariff` after TASK015

### 2026-03-23 — Implementation started

- Added actions column to `TariffListComponent` template with icon buttons (toggle_on / toggle_off)
- Implemented `toggleStatus(row: Tariff)` method calling `TariffService.activate/deactivate`
- Added per-row `toggling` signal to disable controls while request is pending
- Added i18n labels to `src/app/shared/constant/labels.ts`: `Activate`, `Deactivate`, `StatusChanged`, `ErrorOccurred`
- Next: add unit tests for success and error paths, and update `tasks/_index.md` to mark task as In Progress

### 2026-03-23 — Implementation completed

- Implemented slide-toggle in the `status` column (uses `MatSlideToggleModule`) showing active/inactive state as a toggle.
- Per-row `toggling` signal implemented to disable the toggle while the request is pending.
- Row background colors: green (`bg-green-100`) for active, yellow (`bg-yellow-100`) for inactive; hover overrides to grey (`bg-gray-100`) for the entire row.
- `toggleStatus` calls `TariffService.activate` / `TariffService.deactivate`, updates the single row in the `items` signal on success, and shows a localized `MatSnackBar` message on success/error.
- Added i18n labels (`Activate`, `Deactivate`, `StatusChanged`, `ErrorOccurred`) to `src/app/shared/constant/labels.ts`.
- Unit tests added for toggle success and error paths in `tariff-list.component.spec.ts`.
- Updated `tasks/_index.md` to mark TASK017 as Completed and updated memory-bank progress.

**Result:** TASK017 is complete and ready; it unblocks TASK021 (TariffListComponent unit tests that rely on this feature).

