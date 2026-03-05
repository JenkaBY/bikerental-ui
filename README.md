# Bike Rental UI

[![Build and Deploy](../../actions/workflows/build-and-deploy.yml/badge.svg)](../../actions/workflows/build-and-deploy.yml)

A web-based point-of-sale (POS) interface for a bicycle rental shop, built with Angular 21 and Angular Material.

The latest stable version is available at: https://jenkaby.github.io/bikerental-ui/

## Modules

- **Admin** (desktop-first, ≥22" 1080p) — CRUD management of equipment, types, statuses, tariffs, customers, rental/payment history, users
- **Operator** (mobile-first) — rental creation, QR code equipment scanning, return flow, active rentals dashboard

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
- **Trigger**: Push to `main` branch or manual dispatch
- **Pipeline**: Install → Test → Build → Deploy to GitHub Pages
- **SPA routing**: `404.html` is generated from `index.html` for client-side routing support

### GitHub Pages Setup

To enable deployment, configure your repository:

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**

