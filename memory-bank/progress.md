h# Progress

## Current Status

**Phase**: TASK000 (Server Health Indicator) core complete and fully refactored. Next: TASK003 (Admin layout shell) and TASK004 (Operator layout shell) — both needed to embed `<app-health-indicator>` into toolbars and finish TASK000.

## What Works

- Angular 21 project skeleton generated and running (`npm start`)
- Root `AppComponent` with `RouterOutlet` + `<app-health-indicator>` fixed bottom-right (temporary until toolbars)
- `app.routes.ts` with lazy-loaded admin/operator routes (no auth guards — pages accessible by default)
- `app.config.ts` with `provideRouter`, `provideHttpClient`, global `errorInterceptor`, `provideAppInitializer` for health poller
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
  - `AppComponent` includes `<app-health-indicator>` (fixed bottom-right) so compiler visits it for i18n extraction

## What's Left to Build

### Health Indicator (TASK000 — remaining)

- [ ] Move `<app-health-indicator>` from `AppComponent` fixed position into admin toolbar (TASK003)
- [ ] Embed `<app-health-indicator>` into operator toolbar (TASK004)

### Admin Module (TASK003, TASK005–TASK009)

- [ ] Admin layout shell (sidenav + toolbar)
- [ ] Equipment Types CRUD
- [ ] Equipment Statuses CRUD
- [ ] Equipment CRUD (paginated, filtered)
- [ ] Tariffs CRUD (with activate/deactivate)
- [ ] Customers (search + edit)
- [ ] Rental history (read-only)
- [ ] Payment history (read-only)
- [ ] User management placeholder

### Operator Module (TASK004, TASK010–TASK012)

- [ ] Operator layout shell (bottom nav + toolbar)
- [ ] Active rentals dashboard
- [ ] Rental creation flow (4-step stepper)
- [ ] QR scanner shared component
- [ ] Equipment return flow (QR scan + cost breakdown)

## Known Issues

- Login endpoint (`POST /api/auth/login`) not yet available on backend — using mock
- User management API not yet available — placeholder page only

## Milestones

| Milestone                                       | Task(s) | Status         | Date              |
|-------------------------------------------------|---------|----------------|-------------------|
| Project scaffold                                | —       | ✅ Done         | Before 2026-02-28 |
| Memory bank & planning                          | —       | ✅ Done         | 2026-02-28        |
| CI/CD: GitHub Actions + GitHub Pages            | —       | ✅ Done         | 2026-02-28        |
| DX tooling: ESLint, Husky, commitlint, Tailwind | —       | ✅ Done         | 2026-03-04        |
| Foundation + Material + Models + Services       | TASK001 | ✅ Done         | 2026-02-28        |
| Server Health Indicator (core + refactor)       | TASK000 | 🔄 In Progress | 2026-03-06        |
| Authentication (mock JWT)                       | TASK002 | ⬜ Pending      | —                 |
| Admin layout shell                              | TASK003 | ⬜ Pending      | —                 |
| Operator layout shell                           | TASK004 | ⬜ Pending      | —                 |
