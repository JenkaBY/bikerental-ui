# TASK017 - TariffListComponent: Status Toggle (Activate / Deactivate)

**Status:** Pending  
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

**Overall Status:** Not Started — 0%

### Subtasks

| ID    | Description                                     | Status      | Updated    | Notes |
|-------|-------------------------------------------------|-------------|------------|-------|
| 17.1  | Conditional toggle button in actions column     | Not Started | 2026-03-23 |       |
| 17.2  | toggleStatus(row: Tariff) method with service call | Not Started | 2026-03-23 |    |
| 17.3  | Snackbar for success + error                    | Not Started | 2026-03-23 |       |

## Progress Log

### 2026-03-23

- Task created as part of TASK008 decomposition
- Toggle pattern follows Equipment Status CRUD (TASK006)
- `row` parameter is `Tariff` domain type — `TariffService.activate/deactivate` already return `Tariff` after TASK015
