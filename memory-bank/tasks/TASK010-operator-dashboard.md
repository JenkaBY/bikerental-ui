# TASK010 - Operator: Active Rentals Dashboard (Mobile)

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK004  
**Blocks:** None

## Original Request

Build the operator dashboard showing active rentals. Mobile-first card-based layout. Each rental card shows customer
info, equipment, time remaining or overdue status. Auto-refreshes periodically.

## Thought Process

The dashboard is the operator's home screen. It answers the question: "What rentals are currently active and which
ones are overdue?" This must be optimized for a phone screen:

- **Card-based layout**: one card per active rental, stacked vertically
- **Key info per card**: rental ID, equipment ID, started time, expected return, overdue indicator
- **Color coding**: overdue rentals get a red accent, normal rentals are neutral
- **Auto-refresh**: fetch active rentals every 30 seconds to keep the view current
- **Pull to refresh**: a "Refresh" button at the top
- **Empty state**: friendly message when no active rentals exist
- **Loading state**: spinner on initial load

**API endpoint**: `GET /api/rentals?status=ACTIVE&page=0&size=50` → `Page<RentalSummaryResponse>`

We fetch up to 50 active rentals — unlikely a small shop has more than that simultaneously.

**Card layout per rental**:
```
┌─────────────────────────────┐
│ 🏷️ Аренда #42              │
│ Оборудование: 5             │
│ Начало: 14:30               │
│ Возврат до: 15:30           │
│ ⚠️ Просрочка: 12 мин       │  ← red, only if overdue
└─────────────────────────────┘
```

### Auto-refresh implementation
Use `interval(30_000)` from RxJS, combined with `switchMap` to fetch rentals. Clean up with `DestroyRef`.
Alternatively, use `setInterval` managed by `effect()` or `ngOnDestroy`.

## Implementation Plan

### 10.1 — Create DashboardComponent

Replace placeholder at `src/app/features/operator/dashboard/dashboard.component.ts`:

- Standalone, `OnPush`
- Imports: `MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatProgressSpinnerModule`, `MatChipsModule`, `DatePipe`
- Injects: `RentalService`, `DestroyRef`
- Signals:
  - `rentals = signal<RentalSummaryResponse[]>([])`
  - `loading = signal(false)`
  - `lastRefresh = signal<Date | null>(null)`
- On init:
  - Call `loadRentals()`
  - Set up auto-refresh interval (30s) using `interval(30_000).pipe(takeUntilDestroyed())` → calls `loadRentals()`
- Method `loadRentals()`:
  - Set `loading(true)`
  - Call `RentalService.search('ACTIVE', undefined, undefined, { page: 0, size: 50 })`
  - On success: `rentals.set(response.items)`, `loading.set(false)`, `lastRefresh.set(new Date())`
- Computed: `overdueRentals = computed(() => this.rentals().filter(r => r.overdueMinutes && r.overdueMinutes > 0))`
- Method `refresh()`: manual refresh button handler

Template (`dashboard.component.html`):
```html
<div class="dashboard">
  <div class="dashboard-header">
    <h2 i18n>Активные аренды</h2>
    <button mat-icon-button (click)="refresh()" [disabled]="loading()">
      <mat-icon>refresh</mat-icon>
    </button>
  </div>

  @if (loading() && rentals().length === 0) {
    <div class="loading-container">
      <mat-spinner diameter="40"></mat-spinner>
    </div>
  }

  @if (!loading() && rentals().length === 0) {
    <mat-card class="empty-state">
      <mat-card-content>
        <mat-icon class="empty-icon">check_circle</mat-icon>
        <p i18n>Нет активных аренд</p>
      </mat-card-content>
    </mat-card>
  }

  <div class="rental-list">
    @for (rental of rentals(); track rental.id) {
      <mat-card [class.overdue]="rental.overdueMinutes && rental.overdueMinutes > 0" class="rental-card">
        <mat-card-header>
          <mat-card-title i18n>Аренда #{{ rental.id }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="rental-info">
            <div class="info-row">
              <mat-icon>pedal_bike</mat-icon>
              <span i18n>Оборудование: {{ rental.equipmentId }}</span>
            </div>
            <div class="info-row">
              <mat-icon>schedule</mat-icon>
              <span i18n>Начало: {{ rental.startedAt | date:'HH:mm' }}</span>
            </div>
            <div class="info-row">
              <mat-icon>alarm</mat-icon>
              <span i18n>Возврат до: {{ rental.expectedReturnAt | date:'HH:mm' }}</span>
            </div>
            @if (rental.overdueMinutes && rental.overdueMinutes > 0) {
              <div class="info-row overdue-text">
                <mat-icon>warning</mat-icon>
                <span i18n>Просрочка: {{ rental.overdueMinutes }} мин</span>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }
  </div>

  @if (lastRefresh()) {
    <p class="last-refresh" i18n>
      Обновлено: {{ lastRefresh() | date:'HH:mm:ss' }}
    </p>
  }
</div>
```

CSS (`dashboard.component.css`):
```css
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 20px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 32px;
}

.empty-state {
  text-align: center;
  padding: 32px;
}

.empty-icon {
  font-size: 48px;
  width: 48px;
  height: 48px;
  color: #4caf50;
  margin-bottom: 8px;
}

.rental-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rental-card {
  border-left: 4px solid #4caf50;
}

.rental-card.overdue {
  border-left-color: #f44336;
}

.rental-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.info-row mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: rgba(0, 0, 0, 0.54);
}

.overdue-text {
  color: #f44336;
  font-weight: 500;
}

.overdue-text mat-icon {
  color: #f44336;
}

.last-refresh {
  text-align: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.38);
  margin-top: 8px;
}
```

### 10.2 — Verify build and test on mobile

Test in Chrome DevTools mobile emulation:
- Dashboard loads active rentals
- Cards display correctly with info rows
- Overdue rentals have red border and warning
- Refresh button works
- Auto-refresh fires every 30 seconds
- Empty state shown when no active rentals
- Layout is mobile-friendly (full-width cards, readable text)

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 10.1 | DashboardComponent (card list + auto-refresh) | Not Started | 2026-02-28 | |
| 10.2 | Verify build and test on mobile | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with full mobile dashboard design
- Card-based layout with overdue indicators
- 30-second auto-refresh with RxJS interval

