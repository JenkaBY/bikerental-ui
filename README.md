# Bike Rental UI

[![Build and Deploy](../../actions/workflows/build-and-deploy.yml/badge.svg)](../../actions/workflows/build-and-deploy.yml)

A web-based point-of-sale (POS) interface for a bicycle rental shop, built with Angular 21 and Angular Material.

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

