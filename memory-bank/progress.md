# Progress

## Current Status

**Phase**: TASK004 complete (operator layout shell + BottomNavComponent). Next: **TASK005–009** (Admin CRUD pages) and/or **TASK010** (Operator dashboard).

## What Works

- Angular 21 project skeleton generated and running (`npm start`)
- Root `AppComponent` with `RouterOutlet`
- `app.routes.ts` with lazy-loaded admin/operator routes (no auth guards — pages accessible by default)
- `app.config.ts` with `provideRouter`, `provideHttpClient`, global `errorInterceptor`, `provideAppInitializer` for health poller; `APP_BRAND` token provided
- `app.tokens.ts`: `BRAND` constant + `APP_BRAND: InjectionToken<string>`
- `docs/api-docs/all.json` — full OpenAPI spec available for reference
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
  - Tests: `bottom-nav.component.spec.ts` (6 tests) + `operator-layout.component.spec.ts` (10 tests); **105 total tests pass**
- **TASK013 (Health Indicator in Toolbar Shells) — complete**:
  - Admin: `<app-health-indicator>` in `[sidebar-footer]` slot of `ShellComponent`
  - Operator: `<app-health-indicator>` projected into `AppToolbarComponent` in `OperatorLayoutComponent`

## What's Left to Build

### Health Indicator (TASK000 — remaining)

- [x] Embed `<app-health-indicator>` in admin toolbar (AdminLayoutComponent sidebar-footer) — done 2026-03-09
- [x] Embed `<app-health-indicator>` into operator toolbar — done 2026-03-09 (TASK004)

### Admin Module (TASK005–TASK009)

- [x] Admin layout shell (sidenav + toolbar + shared shell components) — done 2026-03-09
- [ ] Equipment Types CRUD
- [ ] Equipment Statuses CRUD
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
| Authentication (mock JWT)                       | TASK002 | ⬜ Pending | —                 |

