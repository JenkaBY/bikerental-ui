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

## Next Steps

Execute tasks in dependency order:

1. **TASK001** — Project foundation: install Material + html5-qrcode + @angular/localize, environments, models,
   API services, error interceptor, root routing skeleton
2. **TASK002** — Authentication: AuthService (mock JWT), auth interceptor, guards, login page
3. **TASK003** — Admin layout shell: sidenav + toolbar + child routes
4. **TASK004** — Operator layout shell: bottom nav + toolbar + child routes
5. **TASK005–009** — Admin CRUD pages (can be parallelized)
6. **TASK010–012** — Operator pages (can be parallelized after TASK004)

## Active Decisions (All Resolved)

### Authentication
- **JWT Bearer token** via `Authorization` header
- **Mock login** until `POST /api/auth/login` endpoint is available
- Token stored in `localStorage`
- Two roles: `ADMIN` and `OPERATOR`
- Admin routes require `ADMIN` role; operator routes allow both `ADMIN` and `OPERATOR`

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

