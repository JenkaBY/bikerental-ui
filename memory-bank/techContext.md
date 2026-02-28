# Tech Context

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | ~5.9.2 |
| Framework | Angular | ^21.2.0 |
| UI Library | Angular Material + CDK | ^21.x (match Angular) |
| Runtime | Node.js | 24 |
| Package Manager | npm | 11.9.0 |
| Testing | Vitest | ^4.0.8 |
| HTTP | Angular HttpClient | (bundled with Angular) |
| Reactivity | RxJS | ~7.8.0 |
| QR Scanning | html5-qrcode | ^2.3.8 |
| i18n | @angular/localize | ^21.x (match Angular) |
| Utilities | tslib | ^2.3.0 |
| Code Formatting | Prettier | ^3.8.1 |
| DOM Testing | jsdom | ^28.0.0 |

## Development Setup

### Prerequisites
- Node.js 24
- npm 11.9.0

### Install & Run
```powershell
npm install
npm start        # ng serve → http://localhost:4200
npm test         # vitest
npm run build    # production build
```

### Backend API
- URL: `http://localhost:8080`
- OpenAPI spec: `docs/api-docs/all.json`
- Auth: JWT Bearer token in `Authorization` header
- Login endpoint: `POST /api/auth/login` (not yet implemented — mock in frontend)

## Project Structure
```
bikerental-ui/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/              # AuthService, interceptor, guards
│   │   │   ├── api/               # HTTP services per domain (7 services)
│   │   │   ├── models/            # TypeScript interfaces (from OpenAPI)
│   │   │   └── interceptors/      # Error interceptor
│   │   ├── shared/
│   │   │   └── components/
│   │   │       └── qr-scanner/    # Reusable QR scanner (html5-qrcode)
│   │   ├── features/
│   │   │   ├── auth/              # Login page
│   │   │   ├── admin/             # Desktop admin module (lazy)
│   │   │   │   ├── layout/
│   │   │   │   ├── equipment/
│   │   │   │   ├── equipment-types/
│   │   │   │   ├── equipment-statuses/
│   │   │   │   ├── tariffs/
│   │   │   │   ├── customers/
│   │   │   │   ├── rentals/
│   │   │   │   ├── payments/
│   │   │   │   └── users/
│   │   │   └── operator/          # Mobile operator module (lazy)
│   │   │       ├── layout/
│   │   │       ├── dashboard/
│   │   │       ├── rental-create/
│   │   │       └── return/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   ├── app.html
│   │   └── app.css
│   ├── environments/
│   │   ├── environment.ts         # apiUrl: 'http://localhost:8080'
│   │   └── environment.prod.ts
│   ├── locale/                    # i18n translation files
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── docs/
│   ├── api-docs/all.json
│   ├── main-flow.md
│   └── main-flow-diaram.mermaid
├── memory-bank/
├── angular.json
├── package.json
├── tsconfig.json
└── tsconfig.app.json
```

## Technical Constraints

- **No SSR**: Pure client-side SPA (no Angular Universal)
- **No NgModules**: Standalone components only
- **No NgRx**: Signals + RxJS for state management
- **Angular Material**: All UI components from Material library
- **JWT Auth**: All API requests require Bearer token (except login)
- **Role-based**: Admin and Operator roles, enforced by route guards
- **i18n**: All UI text must go through Angular's i18n system, Russian as default
- **Mobile support**: Operator module must work on phone screen (bottom nav, stepper, QR camera)
- **Desktop support**: Admin module optimized for ≥22" 1080p (sidenav, data tables, pagination)
- **TypeScript strict mode**: Enabled in tsconfig
- **OnPush**: All components use `ChangeDetectionStrategy.OnPush`
- **Signal inputs/outputs**: Use `input()` / `output()` functions (not decorators) per Angular 21+

## Angular Configuration Notes

- `app.config.ts` must include:
  - `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))`
  - `provideRouter(routes)`
  - `provideAnimationsAsync()`
- `angular.json` styles array must include Material prebuilt theme
- `angular.json` must configure i18n settings for `@angular/localize`
- Feature routes lazy-loaded via `loadChildren` / `loadComponent`

## Authentication Pattern

- JWT Bearer token stored in `localStorage`
- `AuthService` provides: `login()`, `logout()`, `currentUser` signal, `isAuthenticated` signal, `token` signal
- `authInterceptor` (functional HttpInterceptorFn): attaches header, handles 401 → auto-logout
- `authGuard`: `CanActivateFn` — redirects unauthenticated to `/login`
- `roleGuard(roles)`: `CanActivateFn` factory — checks user role
- Mock login until real endpoint exists: accepts any credentials, returns hardcoded JWT with role

## QR Code Scanning

- Library: `html5-qrcode` (npm package)
- Uses `navigator.mediaDevices.getUserMedia()` for rear camera access
- Shared component in `shared/components/qr-scanner/`
- Reads equipment UID encoded in QR code
- Used in: operator rental creation (equipment step) and return flow
- Fallback: manual UID text input

## Testing Approach

- **Test runner**: Vitest (not Karma/Jasmine)
- **DOM**: jsdom
- **Test files**: `*.spec.ts` alongside source files
- **Coverage**: Run via `vitest --coverage`
- Test strategy: unit tests for services + component tests for critical flows

## Packages to Install

```powershell
npm install @angular/material @angular/cdk html5-qrcode
ng add @angular/localize
```

