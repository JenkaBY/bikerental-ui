# Bike Rental UI

[![Build and Deploy](../../actions/workflows/build-and-deploy.yml/badge.svg)](../../actions/workflows/build-and-deploy.yml)

A web-based point-of-sale (POS) interface for a bicycle rental shop, built with Angular 21 and Angular Material.

The latest stable version is available at: https://jenkaby.github.io/bikerental-ui/

## Modules

- **Admin** (desktop-first, ≥22" 1080p) — CRUD management of equipment, types, statuses, tariffs, customers, rental/payment history, users
- **Operator** (mobile-first, installable PWA) — rental creation, QR code equipment scanning, return flow, active rentals dashboard

## Prerequisites

- Node.js 24
- npm 11.9.0

## Getting Started

```bash
npm install
npm start        # http://localhost:4200
npm test         # run tests
npm run build    # production build
npm run fix      # auto-fix all lint and formatting issues
npm run analyze  # visualize production bundle
```

## Development Process

Before committing, the following checks run automatically via Husky:

1. **`pre-commit`** — `lint-staged` runs ESLint + Prettier on staged files only
2. **`commit-msg`** — `commitlint` enforces [Conventional Commits](https://www.conventionalcommits.org/)

Commit message format:

```
feat: add rental creation stepper
fix: correct tariff calculation
chore: update dependencies
```

To fix all issues manually before committing:

```bash
npm run fix
```

## CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- **Workflow**: `.github/workflows/build-and-deploy.yml`
- **Trigger**: Push/PR to `main`/`master` branch or manual dispatch
- **Pipeline**: Lint & Format → Unit Tests → Build → Deploy to GitHub Pages
- **Gate job**: `CI` — aggregates all check results; fails if any job failed
- **SPA routing**: `404.html` is generated from `index.html` for client-side routing support

### Blocking Merges on Failed Build

To prevent merging pull requests when the build or tests fail:

1. Go to **Settings → Branches**
2. Add a **Branch protection rule** for `main` (and `master` if used)
3. Enable **Require status checks to pass before merging**
4. Search for and add **`CI`** as a required status check
5. Enable **Require branches to be up to date before merging** (recommended)

The `CI` job acts as a single required check that only passes when lint, tests, and build all succeed.

### GitHub Pages Setup

To enable deployment, configure your repository:

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**

## PWA (Operator)

The **operator** app is a Progressive Web App, so staff can install it on a phone and it boots from
cache when the network is flaky. It uses Angular's first-party service worker (`@angular/service-worker`).

- **Scope:** *installable + app-shell offline* — the app shell, JS/CSS, icons and fonts are cached for
  offline boot. Live data (backend API and the dev TimeTravel SSE stream) stays **network-only** and is
  never cached.
- **Config:**
  - `projects/operator/public/manifest.webmanifest` + `projects/operator/public/icons/` — installability
    metadata and icons (operator-scoped assets, wired as a second asset input in `angular.json`).
  - `projects/operator/ngsw-config.json` — caching rules (app shell `prefetch`, assets `lazy`). Referenced
    by the operator build's `serviceWorker` option.
  - `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), … })` in `app.config.ts`. The service
    worker is **disabled in `ng serve`** — to test it, build production and serve the output (see below).
  - `PwaUpdateService` (`projects/operator/src/app/core/`) shows a "new version available — Reload" snackbar
    via `SwUpdate` when a new build is deployed.
- **i18n:** the build is per-locale, so each locale folder (`dist/operator/browser/{en,ru}/`) gets its own
  `ngsw.json` + `ngsw-worker.js`, scoped to `/operator/<locale>/`.
- **Test the service worker locally** (it is off under `ng serve`):

  ```bash
  ng build operator --configuration production
  npx http-server -p 8080 -c-1 dist/operator/browser/en   # use an incognito window
  ```

## i18n

- Source language: `en-US` (all source strings in code are English via `$localize`)
- Runtime default locale: `ru` (Russian translations are provided in `src/locale/messages.ru.xlf`)
