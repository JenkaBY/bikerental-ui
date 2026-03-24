# Tasks Index

## Task Dependency Chain

```
TASK001 → TASK000 (health indicator core — complete)
        → TASK013
        → TASK003 → TASK005 (complete) → TASK023 (EquipmentType domain + mapper + shareReplay cache)
                                              └── TASK024 (EquipmentTypeDropdown, ControlValueAccessor)
                                                    └── TASK018 (TariffDialogData: tariff only, dropdown self-loads)
                    TASK006, TASK007, TASK008 (parent)
                         └── TASK015 (v2 models + domain Tariff/TariffWrite + TariffMapper)
                               ├── TASK016 (list — uses Tariff domain type)
                               │     ├── TASK017 (toggleStatus(row: Tariff))
                               │     └── TASK020 (openEditDialog(tariff: Tariff)) ←─ TASK018
                               │           │                              (data:{tariff} no types)
                               │           └── TASK021 (list tests)
                               └── TASK022 (dialog tests — stubs EquipmentTypeDropdown) ←── TASK019
                    → TASK009
        → TASK004 → TASK010, TASK011 → TASK012
        → TASK002 (auth added last — all pages accessible by default, no auth guards)
```

## In Progress


## Pending
- [TASK008] Admin: Tariffs CRUD — **Parent tracker** for TASK015–TASK022. Depends on: TASK003
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
- [TASK006] Admin: Equipment Statuses CRUD — EquipmentStatusListComponent (table + chips) + EquipmentStatusDialogComponent (multi-select transitions, self-exclusion); 31 new tests. Completed on 2026-03-10
- [TASK013] Embed Health Indicator into Toolbar Shells — Completed on 2026-03-09
- [TASK014] Create home page with links to Operator and Administrator dashboards — Completed on 2026-03-09
- [TASK007] Admin: Equipment CRUD — Paginated table with filters + dialog with selects/datepicker. Completed on 2026-03-11
- [TASK023] EquipmentType domain model + mapper — Implemented domain types, mapper, refreshable cached service and component updates. Completed on 2026-03-23

- [TASK015] v2 API models + Tariff domain + TariffMapper — Implemented v2 models, domain Tariff/TariffWrite, TariffMapper, and updated TariffService to return domain types. Completed on 2026-03-23
- [TASK016] TariffListComponent — Paginated table shell (read-only). Completed on 2026-03-23

- [TASK017] TariffListComponent — status toggle (activate/deactivate). Completed on 2026-03-23
- [TASK020] Wire TariffDialog into TariffList (create + edit buttons) — Completed on 2026-03-24
- [TASK021] Unit tests: TariffListComponent — Completed on 2026-03-24
- [TASK022] Unit tests: TariffDialogComponent — Completed on 2026-03-24
- [TASK018] TariffDialogComponent — base form (name, type, dates). Completed on 2026-03-24
- [TASK019] TariffDialogComponent — dynamic pricing params section. Completed on 2026-03-24
- [TASK024] EquipmentTypeDropdownComponent — standalone shared dropdown in `shared/components/`; `ControlValueAccessor`; loads types from cached `EquipmentTypeService.getAll()`; displays `name`, binds `slug`; i18n label. Depends on: TASK023 (blocks: TASK018)

## Abandoned

_None_
