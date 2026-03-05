# Active Context

## Current Work Focus

Project is in the **planning complete / ready to implement** phase. All architectural decisions are made. 12 tasks
have been defined covering the entire application. Next step is to begin execution with TASK001 (project foundation).

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

## Next Steps

Execute tasks in dependency order:

1. **TASK000** — Server Health Indicator: `HealthService`, `HealthPollerService` (APP_INITIALIZER, 5 мин), `health-indicator` компонент (кружок + тултип в toolbar)
2. **TASK003** — Admin layout shell: sidenav + toolbar + child routes (встроить health-indicator)
3. **TASK004** — Operator layout shell: bottom nav + toolbar + child routes (встроить health-indicator)
4. **TASK005–009** — Admin CRUD pages (can be parallelized)
5. **TASK010–012** — Operator pages (can be parallelized after TASK004)
6. **TASK002** — Authentication: AuthService (mock JWT), auth interceptor, guards, login page (added last after all pages are built)

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
- Russian as default language
- All UI labels go through Angular i18n

### Modules
- **Admin module**: desktop-first (≥22" 1080p), sidenav layout, data tables, CRUD dialogs
- **Operator module**: mobile-first (phone screen), bottom nav, stepper for rental, card-based dashboard

### Component Patterns
- Standalone components only
- `input()` / `output()` functions (not decorators)
- `OnPush` change detection
- Smart/dumb component separation
- Reactive forms for all forms

### State Management
- Angular signals (`signal()`, `computed()`, `effect()`)
- No NgRx
- Services expose signals for shared state

## Open Questions

None — all questions resolved.

