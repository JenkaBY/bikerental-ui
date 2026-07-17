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
- **SPA routing**: a single path-aware `404.html` at the site root recovers deep links (see below)

### Deployed layout & routing

Each app is built under its own base href and Angular i18n emits a **per-locale subdirectory**, so the
Pages site is laid out as:

```
/<repo>/                  → gateway (root redirect → /<repo>/en/)
/<repo>/{en,ru}/          → gateway shell
/<repo>/admin/            → redirect → /<repo>/admin/en/   (Create per-app locale redirects step)
/<repo>/admin/{en,ru}/    → admin SPA
/<repo>/operator/         → redirect → /<repo>/operator/en/
/<repo>/operator/{en,ru}/ → operator SPA
```

Two build steps plus a checked-in restore script make this work on static hosting:

- **Create per-app locale redirects** — a bare `/<repo>/admin/` (or `/operator/`) has no `index.html`
  because the real entry points live under `…/admin/en/` and `…/admin/ru/`. This step writes an
  `index.html` at each app root that forwards to the default (`en`) locale.
- **Add smart 404.html for SPA routing** — GitHub Pages only ever serves **one** `404.html`, the one at
  the site root; nested copies (e.g. `admin/en/404.html`) are never looked up. The root `404.html`
  inspects the requested path, works out which app/locale directory has the real `index.html`, and
  redirects there with the original path + query string packed into a `redirect` param — this is what
  lets deep links (and the OIDC `…/login/callback?code=…&state=…` redirect) survive instead of losing
  their query string to a blind bounce.
- **SPA path-restore script** — the companion half of the previous step, checked in as the first thing
  in each app's `<head>`: `projects/{gateway,admin,operator}/src/index.html`. It reads the `redirect`
  param and calls `history.replaceState(...)` to put the original URL back *before* Angular bootstraps,
  so the Router sees `/login/callback?code=…` instead of the bounce URL.

  > ⚠️ This script **must** live in the source `index.html` and must never be injected by a post-build
  > step. `index.html` is SHA1-pinned in the operator's `ngsw.json` `hashTable` at build time, so
  > rewriting it after `ng build` makes the service worker refuse to install the new version, degrade to
  > `EXISTING_CLIENTS_ONLY`, and pin every client to a stale cached build. The
  > **Verify ngsw.json hash integrity** CI step (`npm run verify:ngsw`) fails the build if any hashed
  > file is mutated post-build, and asserts one `ngsw.json` per app/locale declared in `angular.json`.
  > Because it is checked in rather than generated, a change to the redirect contract must be applied to
  > all three files.

### OIDC redirect URIs (admin auth)

The admin SPA computes its OAuth `redirect_uri` from `document.baseURI` (the app's mount path) — it
points at that base path directly rather than a synthetic `/login/callback` route, so it always
resolves to a real `index.html` on static hosting instead of depending on the 404 SPA-fallback trick.
`redirect_uri` and `post_logout_redirect_uri` are therefore the same URL, and the **backend OAuth
client must register it for each context** the app runs in:

| Context | Mount | `redirect_uri` / `post_logout_redirect_uri` to register |
|---------|-------|----------------------------------------------------------|
| `ng serve admin` (direct) | `:4201/admin/` | `http://localhost:4201/admin/` |
| Gateway proxy | `:4200/admin/` | `http://localhost:4200/admin/` |
| GitHub Pages (per locale) | `…/admin/{en,ru}/` | `https://<user>.github.io/<repo>/admin/{en,ru}/` |

Add the corresponding origins to the backend CORS allow-list. For Pages the issuer/API must be
reachable over **public HTTPS** (a `localhost` backend cannot serve a public site, and HTTP is
blocked as mixed content). Set the public API base via the `BIKE_RENTAL_API` repository variable
(injected into `environment.prod.ts` by the **Inject Bike Rental API host** step).

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

The **operator** app is a Progressive Web App, so staff can install it on a phone. It uses Angular's
first-party service worker (`@angular/service-worker`).

- **Scope:** *installable; freshness-first, not offline-first*. Offline operation is **not a supported
  requirement today** — the config deliberately favours always serving the newest build over serving a
  cached one. Live data (backend API and the dev TimeTravel SSE stream) stays **network-only** and is
  never cached.
- **Config:**
  - `projects/operator/public/manifest.webmanifest` + `projects/operator/public/icons/` — installability
    metadata and icons (operator-scoped assets, wired as a second asset input in `angular.json`).
  - `projects/operator/ngsw-config.json` — caching rules (app shell `prefetch`, assets `lazy`) plus two
    staleness controls. Referenced by the operator build's `serviceWorker` option:
    - `navigationRequestStrategy: "freshness"` — navigations go to the network first and fall back to the
      cached shell only if the request *throws*, so a reachable network always yields the newest HTML.
    - `applicationMaxAge: "1d"` — a **self-healing backstop**, measured from the **build** timestamp
      baked into `ngsw.json` (not from install). Once a build is older than this, the worker stops
      serving it from cache and passes every request through to the network, which unpins a client that
      got stuck on a stale version. The trade-off is deliberate: a build older than 1d has no offline
      capability at all. **Do not enable offline support without revisiting this value.**
  - `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), … })` in `app.config.ts`. The service
    worker is **disabled in `ng serve`** — to test it, build production and serve the output (see below).
  - `PwaUpdateService` (`projects/operator/src/app/core/`) checks for updates on startup and when the tab
    becomes visible (throttled to once per 15 min), then offers a **dismissible** "Update available —
    Reload / Later" dialog via `SwUpdate`. It also prompts for a reload on `SwUpdate.unrecoverable`,
    which is how a client whose cached build lost a hashed asset (a GitHub Pages 404) self-heals.
- **Which version is a client running?** CI stamps the short commit SHA into two places:
  - `environment.appVersion` — baked into the bundle, so it reports the version of the code that is
    really executing (even when the worker is serving a stale build, which is when it matters). Shown to
    the user under **Profile → Preferences → App version**; ask an operator to read it out.
  - `ngsw.json` `appData` — describes the manifest, so the deployed version can be read off the live site
    without a browser:

    ```bash
    curl -s https://<pages-host>/<repo>/operator/en/ngsw.json | jq .appData
    ```

  A mismatch between the two is the signature of a client pinned to a stale build.
- **Kill switch (fleet-wide recovery).** If a deploy ever pins clients to a broken or stale build and no
  ordinary fix can reach them, run the **Build and Deploy** workflow manually on `master` with
  **`disable_service_worker: true`**. This ships Angular's `safety-worker.js` in place of
  `ngsw-worker.js`, which unregisters the service worker and deletes every `ngsw:` cache on each client
  that loads the app. Confirm clients recovered, then re-run the workflow normally to restore the PWA.
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
