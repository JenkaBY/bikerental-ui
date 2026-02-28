# Tasks Index

## Task Dependency Chain

```
TASK001 → TASK002 → TASK003 → TASK005, TASK006, TASK007, TASK008, TASK009
                  → TASK004 → TASK010, TASK011 → TASK012
```

## In Progress

_None_

## Pending

- [TASK001] Project Foundation & Angular Material Setup — Install deps, environments, models, API services, error interceptor, routing skeleton
- [TASK002] Authentication — AuthService (mock JWT), auth interceptor, auth/role guards, login page. Depends on: TASK001
- [TASK003] Admin Layout Shell — Desktop sidenav + toolbar + admin child routes. Depends on: TASK002
- [TASK004] Operator Layout Shell — Mobile bottom nav + toolbar + operator child routes. Depends on: TASK002
- [TASK005] Admin: Equipment Types CRUD — Table + create/edit dialog. Depends on: TASK003
- [TASK006] Admin: Equipment Statuses CRUD — Table + dialog with transitions multi-select. Depends on: TASK003
- [TASK007] Admin: Equipment CRUD — Paginated table with filters + dialog with selects/datepicker. Depends on: TASK003
- [TASK008] Admin: Tariffs CRUD — Paginated table + dialog with price fields + activate/deactivate. Depends on: TASK003
- [TASK009] Admin: Customers, Rental History, Payment History, Users Placeholder — 4 pages. Depends on: TASK003
- [TASK010] Operator: Active Rentals Dashboard — Mobile card list with auto-refresh. Depends on: TASK004
- [TASK011] Operator: Rental Creation Flow — 4-step mobile stepper + shared QR scanner component. Depends on: TASK004
- [TASK012] Operator: Equipment Return Flow — QR scan → cost breakdown → payment → close. Depends on: TASK004, TASK011

## Completed

_None_

## Abandoned

_None_

