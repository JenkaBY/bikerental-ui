# Progress

## Current Status

**Phase**: TASK006 complete (Admin Equipment Statuses CRUD). Next: **TASK007–009** (remaining Admin CRUD pages) and/or **TASK010** (Operator dashboard).

## What Works

- Angular 21 project skeleton generated and running (`npm start`)
- Root `AppComponent` with `RouterOutlet`
- `app.routes.ts` with lazy-loaded admin/operator routes (no auth guards — pages accessible by default)
- `app.config.ts` with `provideRouter`, `provideHttpClient`, global `errorInterceptor`, `provideAppInitializer` for health poller; `APP_BRAND` token provided
- `app.tokens.ts`: `BRAND` constant + `APP_BRAND: InjectionToken<string>`
- Business flow documented in `docs/main-flow.md`
- Memory bank fully initialized and updated
- 12 tasks created with detailed implementation plans
- CI/CD: GitHub Actions + GitHub Pages
- **DX Tooling (2026-03-04)**:
  - ESLint (`angular-eslint`) + Prettier integrated — `npm run lint` / `npm run lint:fix`
  - Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files only)
  - `commit-msg` hook runs `commitlint` (conventional commits enforced)
  - `.gitattributes` enforces LF line endings repo-wide
  - `.prettierrc` with `endOfLine: lf` to eliminate CRLF issues
  - Bundle analyzer script: `npm run analyze`
  - `index.html` updated: `lang="ru"`, meta description, preconnect hints for Google Fonts
  - **Tailwind CSS v4** via `@import 'tailwindcss'` in `styles.css`, PostCSS config in `postcss.config.js`
- **Server Health Indicator (2026-03-06) — fully refactored**:
  - `environment.healthPollIntervalMs: 300_000` in both environment files
  - `core/health/health.model.ts` — `HealthStatus`, `HealthResponse`, `HealthComponentStatus`, `ServerInfo`
  - `core/health/health.service.ts` — polls `/actuator/health`; fetches `/actuator/info` once on first `UP`; exposes `status`, `components`, `serverInfo`, `lastChecked`, `error` signals
  - `core/health/health-poller.service.ts` — `interval(env.healthPollIntervalMs)` + immediate call + `takeUntilDestroyed()`; started via `provideAppInitializer`
  - `shared/components/health-indicator/` — 4 files:
    - `health-indicator.component` — smart; CDK `cdkConnectedOverlay` on hover; owns `dotClass`, `checkedAt`, `lines` computed; passes `lines` to tooltip
    - `health-tooltip.component` — dumb; `lines = input.required<TooltipLine[]>()`; single `@for` loop; `separator` flag renders divider
    - `health-tooltip-line.component` — dumb; hides itself when `value` is `null`/`undefined`
    - `health-tooltip-lines.builder.ts` — pure function `buildTooltipLines(health, serverInfo, lastChecked, locale?)` + `TOOLTIP_LINE_LABELS` + `TooltipLineId`
  - i18n: English default labels in `$localize`; `src/locale/messages.xlf` generated (8 messages); ready for `messages.ru.xlf` (runtime default locale: `ru`)
  - `<app-health-indicator>` in `AdminLayoutComponent` sidebar-footer slot (2026-03-09)
- **Admin Layout Shell (TASK003 — 2026-03-09) — fully complete including shared shell refactor**:
  - `shared/components/shell/` — `ShellComponent`: generic layout shell; optional sidebar via `items` input; `[sidebar-footer]` + `[toolbar-actions]` content projection; `sidenavOpened` managed internally or via input; sidebar `w-72`
  - `shared/components/sidebar/` — `SidebarComponent`: `AppBrandComponent` + `mat-nav-list` of `SidebarNavItemComponent`
  - `shared/components/app-brand/` — `AppBrandComponent`: brand icon + text; `brand` input or `APP_BRAND` token fallback
  - `shared/components/app-toolbar/` — `AppToolbarComponent`: `mat-toolbar` with optional toggle, `flex-1 truncate` title, `<ng-content>` for actions
  - `shared/components/button/` — `ButtonComponent`: text or icon-only mode; `activated` output
  - `shared/components/toggle-button/` — `ToggleButtonComponent`: `menu`/`menu_open` icon via `pressed`; `toggled` output
  - `shared/components/logout-button/` — `LogoutButtonComponent`: logout icon button; `logout` output
  - `shared/components/qr-scanner/` — `QrScannerComponent` stub (empty, TASK011)
  - `shared/components/sidebar-nav-item/` — `NavItem` model + `SidebarNavItemComponent` (dumb, OnPush, signal input)
  - `features/admin/layout/admin-layout.component.ts` — uses `ShellComponent`; `sidenavOpened` signal; `APP_BRAND` injected for brand
  - `features/admin/admin.routes.ts` — 8 lazy-loaded child routes under `AdminLayoutComponent`
  - 8 placeholder child components with Tailwind typography
  - Active nav-item styles in `src/styles.css` (global MDC selectors)
  - Tests: `ShellComponent` (211 lines), `AppBrandComponent` (37 lines), `AppToolbarComponent` (140 lines), `ButtonComponent` (51 lines), `ToggleButtonComponent` (54 lines)
- **Operator Layout Shell (TASK004 — 2026-03-09) — complete**:
  - `shared/components/bottom-nav/` — `BottomNavComponent`: standalone, OnPush, `items = input.required<NavItem[]>()`; `<nav>` with `@for` loop; `routerLinkActive="bottom-nav-active"`; Tailwind: `flex justify-around items-center h-16 bg-white border-t border-slate-200`; active styles in `src/styles.css`
  - `features/operator/layout/operator-layout.component.ts` — standalone, OnPush, `host: { class: 'flex flex-col h-screen max-w-[480px] mx-auto' }`; `AppToolbarComponent` (`[showToggle]="false"`), `BottomNavComponent`, `HealthIndicatorComponent`, `LogoutButtonComponent`; 3 `$localize` NAV_ITEMS
  - `features/operator/operator.routes.ts` — `OperatorLayoutComponent` as root shell; 3 lazy children: `dashboard`, `rental/new`, `return`; redirect `'' → 'dashboard'`
  - 3 placeholder child components: `dashboard/`, `rental-create/`, `return/` — OnPush, Tailwind, `i18n`
  - `operator-placeholder.component.ts` deleted
  - Tests: `bottom-nav.component.spec.ts` (6 tests) + `operator-layout.component.spec.ts` (10 tests); **131 total tests pass**
- **TASK013 (Health Indicator in Toolbar Shells) — complete**:
  - Admin: `<app-health-indicator>` in `[sidebar-footer]` slot of `ShellComponent`
  - Operator: `<app-health-indicator>` projected into `AppToolbarComponent` in `OperatorLayoutComponent`
- **Admin Equipment Types CRUD (TASK005 — 2026-03-10) — complete**:
  - `features/admin/equipment-types/equipment-type-list.component.ts` — standalone, OnPush; `MatTableModule`, `MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatTooltipModule`; signals `types`, `loading`; `loadTypes()` via `takeUntilDestroyed`; `openCreateDialog()` / `openEditDialog()` open dialog; refresh on `true` result
  - `features/admin/equipment-types/equipment-type-dialog.component.ts` — standalone, OnPush; `ReactiveFormsModule`; typed `FormGroup` (`slug` disabled in edit, pattern, maxLength; `name` required; `description` optional); `saving` signal; `save()` with create/edit branching; `description || undefined` coercion; snackbar on error
  - Tests: `equipment-type-list.component.spec.ts` (8 tests) + `equipment-type-dialog.component.spec.ts` (13 tests); **152 total tests pass**
  - CRUD pattern established for TASK006–TASK009
- **Admin Equipment Statuses CRUD (TASK006 — 2026-03-10) — complete**:
  - `features/admin/equipment-statuses/equipment-status-list.component.ts` — standalone, OnPush; `MatTableModule`, `MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatTooltipModule`, `MatChipsModule`; signals `statuses`, `loading`; `loadStatuses()` via `takeUntilDestroyed`; slug-sorted; passes full `statuses` array to dialog for transition options
  - `features/admin/equipment-statuses/equipment-status-dialog.component.ts` — standalone, OnPush; `ReactiveFormsModule`, `MatSelectModule`; `FormControl<string[]>` for `allowedTransitions`; `transitionOptions` getter excludes self-slug in edit mode; `EquipmentStatusRequest` for both create and update
  - Tests: `equipment-status-list.component.spec.ts` (10) + `equipment-status-dialog.component.spec.ts` (19) + `equipment-status-dialog.error.spec.ts` (2) = 31 new tests; **257 total tests pass (49 files)**

## What's Left to Build

### Health Indicator (TASK000 — remaining)

- [x] Embed `<app-health-indicator>` in admin toolbar (AdminLayoutComponent sidebar-footer) — done 2026-03-09
- [x] Embed `<app-health-indicator>` into operator toolbar — done 2026-03-09 (TASK004)

### Admin Module (TASK005–TASK009)

- [x] Admin layout shell (sidenav + toolbar + shared shell components) — done 2026-03-09
- [x] Equipment Types CRUD — done 2026-03-10
- [x] Equipment Statuses CRUD — done 2026-03-10
- [ ] Equipment CRUD (paginated, filtered)
- [ ] Tariffs CRUD (with activate/deactivate)
- [ ] Customers (search + edit)
- [ ] Rental history (read-only)
- [ ] Payment history (read-only)
- [ ] User management placeholder

### Operator Module (TASK010–TASK012)

- [x] Operator layout shell — BottomNavComponent + AppToolbarComponent — done 2026-03-09
- [ ] Active rentals dashboard
- [ ] Rental creation flow (4-step stepper)
- [ ] QR scanner shared component (stub exists at `shared/components/qr-scanner/`)
- [ ] Equipment return flow (QR scan + cost breakdown)

## Known Issues

- Login endpoint (`POST /api/auth/login`) not yet available on backend — using mock
- User management API not yet available — placeholder page only

## Milestones

| Milestone                                       | Task(s) | Status    | Date              |
|-------------------------------------------------|---------|-----------|-------------------|
| Project scaffold                                | —       | ✅ Done    | Before 2026-02-28 |
| Memory bank & planning                          | —       | ✅ Done    | 2026-02-28        |
| CI/CD: GitHub Actions + GitHub Pages            | —       | ✅ Done    | 2026-02-28        |
| DX tooling: ESLint, Husky, commitlint, Tailwind | —       | ✅ Done    | 2026-03-04        |
| Foundation + Material + Models + Services       | TASK001 | ✅ Done    | 2026-02-28        |
| Server Health Indicator (core + refactor)       | TASK000 | ✅ Done    | 2026-03-06        |
| Admin layout shell + shared shell components    | TASK003 | ✅ Done    | 2026-03-09        |
| Operator layout shell (bottom nav)              | TASK004 | ✅ Done    | 2026-03-09        |
| Admin Equipment Types CRUD                      | TASK005 | ✅ Done    | 2026-03-10        |
| Admin Equipment Statuses CRUD                   | TASK006 | ✅ Done    | 2026-03-10        |
| Authentication (mock JWT)                       | TASK002 | ⬜ Pending | —                 |


## Recent Implementation Notes

### 2026-04-22

- Migrated `src/app/features/admin/tariffs/tariff-list.component.ts` from the handwritten `TariffService` to `TariffStore`.
- Added `src/app/core/state/pricing-type.store.ts` to centralize `PricingType[]` lookup state loaded from `TariffsService.getPricingTypes()`.
- Renamed the tariff domain slug union from `PricingType` to `PricingTypeSlug` and updated lookup/dialog typings to match.
- Added `PricingType` UI model (`slug`, `title`, `description?`) in `src/app/core/models/tariff.model.ts` aligned with generated `PricingTypeResponse`.
- Updated `TariffWrite.pricingType` to `string` (slug write contract), while `Tariff.pricingType` stays object-based for UI reads.
- Refactored `PricingTypeStore` to keep full `PricingType[]` objects and expose computed slug list for form bindings.
- Extracted pricing type mapping into `src/app/core/mappers/pricing-type.mapper.ts` and wired `PricingTypeStore` to use `PricingTypeMapper.fromResponse`.
- Extended lookup bootstrap flow (`LookupInitializerFacade` + `app.config.ts`) to preload pricing types during app startup.
- Updated `src/app/features/admin/tariffs/tariff-dialog.component.ts` to consume pricing type options from `PricingTypeStore` instead of fetching them directly.
- Tariff list UI state is now store-driven: `items`, `loading`, `totalItems`, current page, and page size all bind to `TariffStore` signals.
- Moved tariff page-change reload behavior to store level: `TariffStore.setPage(page, size)` now updates both paging signals and triggers reload internally.
- Updated tariff status toggles to use `TariffStore.activate()` / `deactivate()`.
- Aligned tariff domain mapping so `Tariff.equipmentType` is an `EquipmentType` object resolved in `TariffMapper.fromResponse()` with a default fallback when lookup data is unavailable.
- Replaced the tariff status string union with a `TariffStatus` enum and added `TariffStatus.isActive(status)` for shared ACTIVE checks in component logic and tests.
- Updated tariff dialog and tariff list specs to use the typed `EquipmentType` domain shape.
- Verification: targeted tariff test suite passed — **101/101 tests green across 8 tariff spec files**.

- Migrated `src/app/core/state/equipment-type.store.ts` from the removed handwritten `EquipmentTypeService` wrapper to generated `EquipmentTypesService`.
- Migrated `src/app/core/state/equipment-status.store.ts` from handwritten `EquipmentStatusService` to generated `EquipmentStatusesService`.
- Migrated `src/app/core/state/equipment.store.ts` from handwritten `EquipmentService` to generated `EquipmentService`, updating store calls to `searchEquipments()`, `createEquipment()`, and `updateEquipment()`.
- Moved filter-change reload behavior for equipment list to store level: `EquipmentStore.setFilterStatus()` and `EquipmentStore.setFilterType()` now trigger reload internally, and `EquipmentListComponent` no longer invokes `loadEquipment()` for filter changes.
- Moved page-change reload behavior to store level: `EquipmentStore.setPage()` now triggers reload internally, and `EquipmentListComponent.onPageChange()` no longer calls `loadEquipment()`.
- Updated `src/app/core/state/equipment.store.spec.ts` to mock the generated equipment service API.
- Added filter behavior tests in `equipment.store.spec.ts` and adjusted `equipment-list.component.spec.ts` expectations.
- Added pagination behavior tests in `equipment.store.spec.ts` and adjusted `equipment-list.component.spec.ts` expectations.
- Updated `src/app/features/admin/tariffs/tariff-list.component.ts` and its spec to use generated `EquipmentTypesService` because the old `EquipmentTypeService` wrapper is no longer present.
- Normalized empty `description` values to `undefined` in `src/app/features/admin/equipment-types/equipment-type-dialog.component.ts` to keep form payloads stable and tests aligned.
- Verification: targeted `equipment.store` and equipment list tests passed, then full suite passed with **378/378 tests green (61 files)**.

### 2026-03-11

- Added `MatIconModule` to `src/app/features/admin/equipment/equipment-dialog.component.ts` imports so datepicker toggles and icon buttons render inside the dialog.
- Ran the full test suite (`npm test`) locally — all tests passed: 267 tests across 52 files (no regressions).

These small infra and import fixes were made to ensure UI components render correctly and to keep the repository in a test-green state before continuing with TASK007 (Equipment CRUD).

### 2026-03-23

- Completed [TASK017] TariffListComponent status toggle: slide-toggle in Status column, per-row pending state, active/inactive colors with hover override, snackbar messages, and unit tests added. Updated task files and index.

### 2026-03-24

- Completed Tariff dialog work:
  - [TASK018] TariffDialogComponent base form (name, description, equipment type dropdown, pricingType, validFrom/validTo) — implemented create/edit modes, prefill from `Tariff` domain, save wiring to `TariffService` and snackbar on errors.
  - [TASK019] Dynamic pricing params section — implemented `params` FormGroup with validators per `PricingType`, cross-field validator for degressive hourly, dynamic required wiring, and inclusion of `params` in `TariffWrite` on save.
  - [TASK020] Wired dialog into `TariffListComponent` (create + edit). Dialog `afterClosed()` triggers list reload on truthy result; added unit tests for create/edit flows and snackbar behavior.
- Unit tests updated — no regressions reported locally; new dialog/list tests added for the tariff flows.

### 2026-04-19

- Updated ESLint configuration to ignore autogenerated API client files under `src/app/core/api/generated/**` so generated code won't be flagged by project's lint rules. This preserves linting for handwritten code while allowing regenerated clients to include generator headers and formatting without noise.


