# Task 001: Update npm Scripts in package.json

> **Applied Skill:** `angular-tooling` — multi-project workspace script wiring, Angular CLI test runner across projects.

## 1. Objective

Update `package.json` scripts so that every developer command works correctly in the four-project workspace:

- `npm start` → runs all three dev servers concurrently (`gateway:4200`, `admin:4201`, `operator:4202`); gateway uses `proxy.conf.json` so `/admin/*` and `/operator/*` requests are forwarded to the correct dev server, making dashboard links functional
- `npm test` → runs tests for all 4 projects sequentially
- `npm run test:watch` → same, with watch mode
- `npm run test:coverage` → same, with coverage configuration (`ci`)
- `npm run fix` → ESLint fix + Prettier scoped to `projects/**`
- `npm run lint` → lints all 4 projects
- `npm run i18n:extract` → extracts from all 3 app projects and merges into single `src/locale/messages.xlf`
- `npm run generate:api` → already correct (invocation unchanged)

## 2. Files to Create / Modify

| # | File Path         | Action               |
|---|-------------------|----------------------|
| 1 | `package.json`    | Modify Existing File |
| 2 | `proxy.conf.json` | Create New File      |

---

## 3. Code Implementation

### File 1 — `proxy.conf.json` (create at workspace root)

This file proxies `/admin/*` and `/operator/*` from the gateway dev server (`:4200`) to the admin (`:4201`) and operator (`:4202`) dev servers. This makes the dashboard card links work in development without changing any component code.

```json
{
  "/admin": {
    "target": "http://localhost:4201",
    "secure": false,
    "pathRewrite": { "^\/admin": "" },
    "logLevel": "warn"
  },
  "/operator": {
    "target": "http://localhost:4202",
    "secure": false,
    "pathRewrite": { "^\/operator": "" },
    "logLevel": "warn"
  }
}
```

### File 2 — `package.json` scripts block

**Location:** Replace the entire `"scripts"` block inside `package.json`.

```json
"scripts": {
  "ng": "ng",
  "start": "concurrently \"ng serve gateway --port 4200 --proxy-config proxy.conf.json\" \"ng serve admin --port 4201\" \"ng serve operator --port 4202\"",
  "start:gateway": "ng serve gateway --port 4200 --proxy-config proxy.conf.json",
  "start:admin": "ng serve admin --port 4201",
  "start:operator": "ng serve operator --port 4202",
  "build": "ng build",
  "build:gateway": "ng build gateway",
  "build:admin": "ng build admin",
  "build:operator": "ng build operator",
  "build:all": "npm run build:gateway && npm run build:admin && npm run build:operator",
  "watch": "ng build --watch --configuration development",
  "test": "ng test gateway --watch=false && ng test admin --watch=false && ng test operator --watch=false && ng test shared --watch=false",
  "test:watch": "ng test gateway && ng test admin && ng test operator && ng test shared",
  "test:coverage": "ng test gateway --configuration=ci && ng test admin --configuration=ci && ng test operator --configuration=ci && ng test shared --configuration=ci",
  "lint": "ng lint gateway && ng lint admin && ng lint operator && ng lint shared",
  "lint:fix": "ng lint gateway --fix && ng lint admin --fix && ng lint operator --fix && ng lint shared --fix",
  "format": "prettier --write \"projects/**/*.{ts,html,scss,css}\"",
  "format:check": "prettier --check \"projects/**/*.{ts,html,scss,css}\"",
  "fix": "npm run lint:fix && npm run format",
  "analyze": "ng build --stats-json && webpack-bundle-analyzer dist/bikerental-ui/browser/stats.json",
  "prepare": "husky",
  "i18n:extract": "ng extract-i18n gateway --output-path src/locale --out-file gateway.xlf && ng extract-i18n admin --output-path src/locale --out-file admin.xlf && ng extract-i18n operator --output-path src/locale --out-file operator.xlf && node scripts/merge-xlf.mjs",
  "generate:api": "ng-openapi -c projects/shared/config/openapi.config.ts"
},
```

> **Note on `i18n:extract`:** The three-pass extraction writes temporary per-app XLF files to `src/locale/`. The `merge-xlf.mjs` script (created in Task 002) merges them into `messages.xlf` and then deletes the temp files. This preserves the single-file workflow for translators.

---

## 4. Validation Steps

```powershell
# Verify proxy.conf.json exists
Test-Path proxy.conf.json
```

Expected: `True`

```powershell
# Verify start script uses proxy-config and all three servers
node -e "const p = require('./package.json'); const s = p.scripts.start; ['gateway','admin','operator','proxy-config'].forEach(n => { if (!s.includes(n)) throw new Error('Missing: ' + n); }); console.log('OK');"
```

Expected: `OK`

```powershell
# Verify test script covers all 4 projects
node -e "const p = require('./package.json'); const t = p.scripts.test; ['gateway','admin','operator','shared'].forEach(n => { if (!t.includes('ng test ' + n)) throw new Error('Missing: ' + n); }); console.log('OK');"
```

Expected: `OK`

```powershell
# Verify lint script covers all 4 projects
node -e "const p = require('./package.json'); const l = p.scripts.lint; ['gateway','admin','operator','shared'].forEach(n => { if (!l.includes('ng lint ' + n)) throw new Error('Missing: ' + n); }); console.log('OK');"
```

Expected: `OK`
