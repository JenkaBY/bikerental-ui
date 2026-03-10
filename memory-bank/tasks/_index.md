# Tasks Index

## Task Dependency Chain

```
TASK001 → TASK000 (health indicator core — complete)
        → TASK013
        → TASK003 → TASK005, TASK006, TASK007, TASK008, TASK009
        → TASK004 → TASK010, TASK011 → TASK012
        → TASK002 (auth added last — all pages accessible by default, no auth guards)
```

## In Progress

_None_

## Pending

- [TASK006] Admin: Equipment Statuses CRUD — Table + dialog with transitions multi-select. Depends on: TASK003
- [TASK007] Admin: Equipment CRUD — Paginated table with filters + dialog with selects/datepicker. Depends on: TASK003
- [TASK008] Admin: Tariffs CRUD — Paginated table + dialog with price fields + activate/deactivate. Depends on: TASK003
- [TASK009] Admin: Customers, Rental History, Payment History, Users Placeholder — 4 pages. Depends on: TASK003
- [TASK010] Operator: Active Rentals Dashboard — Mobile card list with auto-refresh. Depends on: TASK004
- [TASK011] Operator: Rental Creation Flow — 4-step mobile stepper + shared QR scanner component. Depends on: TASK004
- [TASK012] Operator: Equipment Return Flow — QR scan → cost breakdown → payment → close. Depends on: TASK004, TASK011
- [TASK002] Authentication — AuthService (mock JWT), auth interceptor, auth/role guards, login page. Depends on: TASK001 (added last — pages are open by default)

## Completed

- [TASK000] Server Health Indicator — Completed on 2026-03-06
- [TASK001] Project Foundation & Angular Material Setup — Completed on 2026-02-28
- [TASK003] Admin Layout Shell — Sidenav + toolbar + lazy child routes; shared ShellComponent layer (ShellComponent, SidebarComponent, AppToolbarComponent, AppBrandComponent, ButtonComponent, ToggleButtonComponent, LogoutButtonComponent); APP_BRAND token; QrScannerComponent stub. Completed on 2026-03-09
- [TASK004] Operator Layout Shell — Mobile bottom nav (BottomNavComponent) + AppToolbarComponent + HealthIndicator + LogoutButton + 3 lazy child routes (dashboard, rental/new, return). Completed on 2026-03-09
- [TASK005] Admin: Equipment Types CRUD — EquipmentTypeListComponent (table + signals) + EquipmentTypeDialogComponent (ReactiveFormsModule, create/edit modes); 21 new tests. Completed on 2026-03-10
- [TASK013] Embed Health Indicator into Toolbar Shells — Completed on 2026-03-09
- [TASK014] Create home page with links to Operator and Administrator dashboards — Pending (2026-03-09)

## Abandoned

_None_
