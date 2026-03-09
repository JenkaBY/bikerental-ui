# Active Context

## Current Work Focus

**TASK004 is complete.** Next focus: **TASK005 — Admin Equipment Types CRUD** (or any TASK005–009 in parallel).

**TASK004** (Operator Layout Shell) — fully complete (2026-03-09):

- **`BottomNavComponent`** (`shared/components/bottom-nav/`) — standalone, OnPush, `items = input.required<NavItem[]>()`; renders `<nav>` with `@for` loop, each item `<a routerLink routerLinkActive="bottom-nav-active">`; Tailwind: `flex justify-around items-center h-16 bg-white border-t border-slate-200`; active styles (`.bottom-nav-item.bottom-nav-active`) in global `src/styles.css`
- **`OperatorLayoutComponent`** (`features/operator/layout/`) — standalone, OnPush, `host: { class: 'flex flex-col h-screen max-w-[480px] mx-auto' }`; uses `AppToolbarComponent` (`[showToggle]="false"`), `BottomNavComponent`, `HealthIndicatorComponent`, `LogoutButtonComponent`, `RouterOutlet`; 3 `$localize` NAV_ITEMS (Dashboard/New Rental/Return); `<main class="flex-1 overflow-y-auto p-4">` for scrollable content
- **`operator.routes.ts`** rewritten: `OperatorLayoutComponent` as root shell, 3 lazy-loaded children (`dashboard`, `rental/new`, `return`), redirect `'' → 'dashboard'`
- **3 placeholder child components**: `dashboard/dashboard.component.ts`, `rental-create/rental-create.component.ts`, `return/return.component.ts` — OnPush, Tailwind typography, `i18n`
- Deleted `operator-placeholder.component.ts`
- **Tests**: `bottom-nav.component.spec.ts` (6 tests) + `operator-layout.component.spec.ts` (10 tests); 105 total tests pass
- **TASK013** now fully complete: `<app-health-indicator>` embedded in both admin (`[sidebar-footer]`) and operator toolbar

**TASK003** (Admin Layout Shell) — fully complete, including shared shell component layer refactor (2026-03-09):

- **Shared shell component layer** — new reusable components in `shared/components/`:
  - `shell/` — `ShellComponent`: generic layout with optional sidebar (`mat-sidenav`), toolbar, content projection slots `[sidebar-footer]` and `[toolbar-actions]`; sidebar toggled via `sidenavOpened` signal input or internal `_opened` signal; `hasSidebar = computed(() => Array.isArray(items()))`; sidebar width `w-72`
  - `sidebar/` — `SidebarComponent`: flex column with `AppBrandComponent` header + `mat-nav-list` of `SidebarNavItemComponent`; accepts `items` and `brand` inputs
  - `app-brand/` — `AppBrandComponent`: bike icon + brand text; prefers `brand` input over `APP_BRAND` injection token fallback
  - `app-toolbar/` — `AppToolbarComponent`: `mat-toolbar` with optional `ToggleButtonComponent`, `flex-1 truncate` title span, `<ng-content>` for projected toolbar actions
  - `button/` — `ButtonComponent`: generic `mat-button` (text+icon) or `mat-icon-button` (icon-only); `activated` output
  - `toggle-button/` — `ToggleButtonComponent`: wraps `ButtonComponent`; `pressed` → `menu`/`menu_open` icon; `customIcon` override; `toggled` output
  - `logout-button/` — `LogoutButtonComponent`: wraps `ButtonComponent` with logout icon; `logout` output
  - `qr-scanner/` — `QrScannerComponent` stub (empty file, to be implemented in TASK011)
  - `bottom-nav/` — `BottomNavComponent`: mobile bottom navigation bar (added in TASK004)
- **`APP_BRAND` token**: `app.tokens.ts` exports `BRAND` constant + `APP_BRAND: InjectionToken<string>`; `app.config.ts` provides it (env override or `BRAND` fallback)
- **`AdminLayoutComponent`** uses `<app-shell>`: `navItems` → `[items]`, `APP_BRAND` → `[brand]`, title → `[title]`; health indicator in `[sidebar-footer]`; logout button in `[toolbar-actions]`; manages `sidenavOpened` signal internally

**TASK000** (Server Health Indicator) — fully complete:

- `core/health/` — `health.model.ts`, `health.service.ts`, `health-poller.service.ts`
- `shared/components/health-indicator/` — 4 files + builder; CDK overlay tooltip; 54 tests; 87% branch coverage
- `<app-health-indicator>` embedded in both admin sidebar footer and operator toolbar

**TASK013** (Embed Health Indicator into Toolbar Shells) — complete:

- Admin: `<app-health-indicator>` in `[sidebar-footer]` slot of `ShellComponent`
- Operator: `<app-health-indicator>` projected into `AppToolbarComponent` in `OperatorLayoutComponent`

## Recent Changes

- **2026-03-09**: TASK004 implemented:
  - `BottomNavComponent` created in `shared/components/bottom-nav/`
  - `OperatorLayoutComponent` created; uses AppToolbarComponent + BottomNavComponent (no sidenav)
  - `operator.routes.ts` rewritten with proper shell + lazy children
  - 3 operator placeholder components created
  - `operator-placeholder.component.ts` deleted
  - Active bottom-nav styles added to `src/styles.css`
  - 16 new tests (6 + 10); 105 total tests pass

- **2026-03-09**: Shared shell component layer extracted and AdminLayoutComponent refactored:
  - `ShellComponent`, `SidebarComponent`, `AppToolbarComponent`, `AppBrandComponent`, `ButtonComponent`, `ToggleButtonComponent`, `LogoutButtonComponent` created
  - `APP_BRAND` injection token + `BRAND` constant added to `app.tokens.ts`; provided in `app.config.ts`
  - `AdminLayoutComponent` now delegates all layout to `ShellComponent`
  - `QrScannerComponent` stub created
  - 5 new spec files added for the new shared components

## Next Steps

Execute tasks in dependency order:

1. **TASK005** — Admin: Equipment Types CRUD (depends on TASK003 ✓)
2. **TASK006** — Admin: Equipment Statuses CRUD (depends on TASK003 ✓, can parallel with TASK005)
3. **TASK007** — Admin: Equipment CRUD (depends on TASK003 ✓)
4. **TASK008** — Admin: Tariffs CRUD (depends on TASK003 ✓)
5. **TASK009** — Admin: Customers, Rental History, Payment History, Users Placeholder
6. **TASK010** — Operator: Active Rentals Dashboard (depends on TASK004 ✓)
7. **TASK011** — Operator: Rental Creation Flow (depends on TASK004 ✓)
8. **TASK012** — Operator: Equipment Return Flow (depends on TASK004 ✓, TASK011)
9. **TASK002** — Authentication (added last — all pages accessible by default)

## Active Decisions (All Resolved)

### Authentication
- **JWT Bearer token** via `Authorization` header
- **Mock login** until `POST /api/auth/login` endpoint is available
- Token stored in `localStorage`
- Two roles: `ADMIN` and `OPERATOR`
- Admin routes require `ADMIN` role; operator routes allow both `ADMIN` and `OPERATOR`
- **Auth is implemented last (TASK002)** — all pages are accessible by default with no guards until then

### UI Library
- **Angular Material** for all components
- Material prebuilt theme in `angular.json` styles

### QR Code Scanning
- **`html5-qrcode`** library for camera-based QR scanning on phones
- Reads equipment UID from QR code
- Shared component reused in rental creation and return flow
- Manual UID text input as fallback

### i18n
- **`@angular/localize`** from day one
- English as source language (default strings in `$localize`); Russian translation via `messages.ru.xlf`
- All UI labels go through Angular i18n
- `ng run i18n:extract` outputs to `src/locale/messages.xlf`

### Modules
- **Admin module**: desktop-first (≥22" 1080p), sidenav layout, data tables, CRUD dialogs
- **Operator module**: mobile-first (phone screen), bottom nav, stepper for rental, card-based dashboard

### Component Patterns
- Standalone components only
- `input()` / `output()` functions (not decorators)
- `OnPush` change detection
- Smart/dumb component separation
- Reactive forms for all forms

### Health Indicator Component Architecture

- `HealthIndicatorComponent` — smart; owns overlay state, `dotClass`, `checkedAt`, `lines` computed
- `HealthTooltipComponent` — dumb; receives `lines: TooltipLine[]` input, renders `@for` loop
- `HealthTooltipLineComponent` — dumb; receives `label` + `value`, hides when `value` is null/undefined
- `buildTooltipLines(health, serverInfo, lastChecked, locale?)` — pure function, no Angular, fast unit tests
- CDK `cdkConnectedOverlay` used instead of `matTooltip` to allow real component as tooltip content


**TASK003** (Admin Layout Shell) — fully complete, including shared shell component layer refactor (2026-03-09):

- **Shared shell component layer** — new reusable components in `shared/components/`:
  - `shell/` — `ShellComponent`: generic layout with optional sidebar (`mat-sidenav`), toolbar, content projection slots `[sidebar-footer]` and `[toolbar-actions]`; sidebar toggled via `sidenavOpened` signal input or internal `_opened` signal; `hasSidebar = computed(() => Array.isArray(items()))`; sidebar width `w-72`
  - `sidebar/` — `SidebarComponent`: flex column with `AppBrandComponent` header + `mat-nav-list` of `SidebarNavItemComponent`; accepts `items` and `brand` inputs
  - `app-brand/` — `AppBrandComponent`: bike icon + brand text; prefers `brand` input over `APP_BRAND` injection token fallback
  - `app-toolbar/` — `AppToolbarComponent`: `mat-toolbar` with optional `ToggleButtonComponent`, `flex-1 truncate` title span, `<ng-content>` for projected toolbar actions
  - `button/` — `ButtonComponent`: generic `mat-button` (text+icon) or `mat-icon-button` (icon-only); `activated` output
  - `toggle-button/` — `ToggleButtonComponent`: wraps `ButtonComponent`; `pressed` → `menu`/`menu_open` icon; `customIcon` override; `toggled` output
  - `logout-button/` — `LogoutButtonComponent`: wraps `ButtonComponent` with logout icon; `logout` output
  - `qr-scanner/` — `QrScannerComponent` stub (empty file, to be implemented in TASK011)
- **`APP_BRAND` token**: `app.tokens.ts` exports `BRAND` constant + `APP_BRAND: InjectionToken<string>`; `app.config.ts` provides it (env override or `BRAND` fallback)
- **`AdminLayoutComponent`** refactored to use `<app-shell>`: `navItems` → `[items]`, `APP_BRAND` → `[brand]`, `$localize\`Admin Dashboard\`` → `[title]`; health indicator in `[sidebar-footer]`; logout button in `[toolbar-actions]`; router-outlet as default content; manages `sidenavOpened` signal internally
- `shared/components/sidebar-nav-item/` — `NavItem` model + `SidebarNavItemComponent` (dumb, OnPush, signal input, Tailwind utilities) — unchanged
- `features/admin/admin.routes.ts` — full child route tree (8 lazy-loaded pages) — unchanged
- 8 placeholder child components — unchanged
- Active nav-item styles in `src/styles.css` — unchanged
- Tests: `ShellComponent` (211 lines), `AppBrandComponent` (37 lines), `AppToolbarComponent` (140 lines), `ButtonComponent` (51 lines), `ToggleButtonComponent` (54 lines)

**TASK000** (Server Health Indicator) — fully complete:

- `core/health/` — `health.model.ts`, `health.service.ts`, `health-poller.service.ts`
- `shared/components/health-indicator/` — 4 files + builder; CDK overlay tooltip; 54 tests; 87% branch coverage
- `<app-health-indicator>` embedded in `AdminLayoutComponent` toolbar via `[sidebar-footer]` slot (visible in admin shell)
- i18n: `src/locale/messages.xlf` with 10 messages (8 tooltip labels + 2 toolbar titles)

**TASK013** (Embed Health Indicator into Toolbar Shells):

- `AdminLayoutComponent` — `<app-health-indicator>` placed in `[sidebar-footer]` slot of `ShellComponent` — verified 2026-03-09
- Operator toolbar: pending TASK004

## Recent Changes

- **2026-03-09**: Shared shell component layer extracted and AdminLayoutComponent refactored:
  - `ShellComponent`, `SidebarComponent`, `AppToolbarComponent`, `AppBrandComponent`, `ButtonComponent`, `ToggleButtonComponent`, `LogoutButtonComponent` created
  - `APP_BRAND` injection token + `BRAND` constant added to `app.tokens.ts`; provided in `app.config.ts`
  - `AdminLayoutComponent` now delegates all layout to `ShellComponent`
  - `QrScannerComponent` stub created
  - 5 new spec files added for the new shared components

## Recent Changes

- **2026-03-09**: GitHub Pages i18n redirect fix:
  - Build job now uploads `dist/bikerental-ui/browser` (all locales) instead of `browser/ru` only
  - Added "Create root redirect to /en/" step: writes `browser/index.html` with `<meta http-equiv="refresh">` + `window.location.replace` pointing to `/<repo>/en/`
  - `browser/404.html` is a copy of the root redirect (handles GitHub Pages SPA fallback at root)
  - `browser/en/404.html` is a copy of `browser/en/index.html` (handles deep-link SPA routing within en locale)
  - Deployed app now always opens `en` locale on first visit; `ru` locale is accessible at `/<repo>/ru/`

- Angular 21 project scaffolded with `ng new bikerental-ui`
- `package.json` dependencies confirmed: Angular 21, RxJS 7.8, Vitest for testing
- `docs/api-docs/all.json` populated with full OpenAPI spec from the backend
- `docs/main-flow.md` and `docs/main-flow-diagram.mermaid` document the business flow
- Memory bank initialized and fully updated with two-module architecture
- 12 tasks defined (TASK001–TASK012) covering foundation → auth → admin → operator
- All open questions resolved (auth, QR scanning, i18n, Material, role separation)
- GitHub Actions CI/CD workflow created
- `README.md` updated with CI/CD badge, setup instructions, and Pages configuration guide
- **TASK002 moved to last** — all routes open by default, no auth guards until TASK002
- **DX tooling set up (2026-03-04)**:
  - ESLint with `angular-eslint` + `eslint-plugin-prettier` — zero lint errors
  - Husky: `pre-commit` → `lint-staged`, `commit-msg` → `commitlint`
  - `commitlint` with `@commitlint/config-conventional`
  - `.gitattributes` enforcing LF line endings
  - `.prettierrc` with `endOfLine: lf`
  - `npm run analyze` for bundle analysis
  - `index.html`: `lang="ru"`, meta description, Google Fonts preconnect
- **Server Health Indicator refactored (2026-03-06)**:
  - Tooltip decomposed into `HealthTooltipComponent` + `HealthTooltipLineComponent`
  - `buildTooltipLines()` extracted as a pure function in `health-tooltip-lines.builder.ts`
  - `matTooltip` replaced with CDK `cdkConnectedOverlay` for a real component tooltip
  - `provideNoopAnimations` / `provideAnimationsAsync` (deprecated) removed from tests
  - i18n labels switched to English defaults; `src/locale/messages.xlf` generated with 8 messages
  - `$localize` extraction works because `HealthIndicatorComponent` is in `AdminLayoutComponent` tree
  - 54 tests across 6 spec files (was 17 across 2)
  - Branch coverage: 87%

## Next Steps

Execute tasks in dependency order:

1. **TASK003** — Admin layout shell — complete including shared shell component refactor (2026-03-09)
2. **TASK004** — Operator layout shell: use `ShellComponent` without sidebar (no `items` input → `hasSidebar = false`), bottom nav tabs, `<router-outlet>` → embed `<app-health-indicator>` in sidebar-footer or toolbar (completes TASK000 subtask 1.8)
3. **TASK005–009** — Admin CRUD pages (can be parallelized after TASK003)
4. **TASK010–012** — Operator pages (can be parallelized after TASK004)
5. **TASK002** — Authentication: AuthService (mock JWT), auth interceptor, guards, login page (added last after all pages are built)

## Active Decisions (All Resolved)

### Authentication
- **JWT Bearer token** via `Authorization` header
- **Mock login** until `POST /api/auth/login` endpoint is available
- Token stored in `localStorage`
- Two roles: `ADMIN` and `OPERATOR`
- Admin routes require `ADMIN` role; operator routes allow both `ADMIN` and `OPERATOR`
- **Auth is implemented last (TASK002)** — all pages are accessible by default with no guards until then

### UI Library
- **Angular Material** for all components
- Material prebuilt theme in `angular.json` styles

### QR Code Scanning
- **`html5-qrcode`** library for camera-based QR scanning on phones
- Reads equipment UID from QR code
- Shared component reused in rental creation and return flow
- Manual UID text input as fallback

### i18n
- **`@angular/localize`** from day one
- English as source language (default strings in `$localize`); Russian translation via `messages.ru.xlf`
- All UI labels go through Angular i18n
- `ng run i18n:extract` outputs to `src/locale/messages.xlf`

### Modules
- **Admin module**: desktop-first (≥22" 1080p), sidenav layout, data tables, CRUD dialogs
- **Operator module**: mobile-first (phone screen), bottom nav, stepper for rental, card-based dashboard

### Component Patterns
- Standalone components only
- `input()` / `output()` functions (not decorators)
- `OnPush` change detection
- Smart/dumb component separation
- Reactive forms for all forms

### Health Indicator Component Architecture

- `HealthIndicatorComponent` — smart; owns overlay state, `dotClass`, `checkedAt`, `lines` computed
- `HealthTooltipComponent` — dumb; receives `lines: TooltipLine[]` input, renders `@for` loop
- `HealthTooltipLineComponent` — dumb; receives `label` + `value`, hides when `value` is null/undefined
- `buildTooltipLines(health, serverInfo, lastChecked, locale?)` — pure function, no Angular, fast unit tests
- CDK `cdkConnectedOverlay` used instead of `matTooltip` to allow real component as tooltip content
