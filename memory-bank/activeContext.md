# Active Context

## Current Work Focus

**TASK003 is complete.** Next focus: **TASK004 — Operator Layout Shell**.

**TASK003** (Admin Layout Shell) — fully complete:

- `shared/components/sidebar-nav-item/` — `NavItem` model + `SidebarNavItemComponent` (dumb, OnPush, signal input, Tailwind utilities)
- `features/admin/layout/admin-layout.component.ts` + `.html` — no `.css` file; `host: { class: 'block h-screen' }`; `NAV_ITEMS` array; `@for` loop
- `features/admin/admin.routes.ts` — full child route tree (8 lazy-loaded pages) under `AdminLayoutComponent`
- 8 placeholder child components (equipment, equipment-types, equipment-statuses, tariffs, customers, rentals, payments, users)
- Tailwind 4 utilities throughout: `w-65`, `flex flex-col`, `shrink-0`, `overflow-y-auto p-6`, `bg-slate-50`, `border-r border-slate-200`, `shadow-md`, `rounded-lg!`, `mx-2!`, suffix-`!` important syntax
- Active nav-item styles in `src/styles.css` (global, MDC selectors)
- All text in English; `i18n` attributes retained

**TASK000** (Server Health Indicator) — fully complete:

- `core/health/` — `health.model.ts`, `health.service.ts`, `health-poller.service.ts`
- `shared/components/health-indicator/` — 4 files + builder; CDK overlay tooltip; 54 tests; 87% branch coverage
- i18n: `src/locale/messages.xlf` with 10 messages (8 tooltip labels + 2 toolbar titles)

**TASK013** (Embed Health Indicator into Toolbar Shells):

- `AdminLayoutComponent` mat-toolbar includes `<app-health-indicator />` (right of title, left of Logout) — verified in browser 2026-03-08
- Operator toolbar: pending TASK004 (Operator layout shell)

## Recent Changes

- Angular 21 project scaffolded with `ng new bikerental-ui`
- `package.json` dependencies confirmed: Angular 21, RxJS 7.8, Vitest for testing
- `docs/api-docs/all.json` populated with full OpenAPI spec from the backend
- `docs/main-flow.md` and `docs/main-flow-diaram.mermaid` document the business flow
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

1. **TASK003** — Admin layout shell: sidenav + toolbar + child routes — complete. `<app-health-indicator>` embedded in toolbar (completes TASK000 subtask 1.7)
  - **Updated 2026-03-08**: Health indicator added to mat-toolbar; verified in browser
2. **TASK004** — Operator layout shell: bottom nav + toolbar + child routes → embed `<app-health-indicator>` in toolbar (completes TASK000 subtask 1.8)
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
