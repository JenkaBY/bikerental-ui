# Task 006: Create Environment Files, index.html, Fix angular.json, and Verify Favicon

> **Applied Skill:** `angular-tooling` — environment file structure, `angular.json` project configuration, `fileReplacements`, `baseHref`, assets glob.

## 1. Objective

Complete the operator project scaffolding by:

1. Creating operator-specific environment files.
2. Creating `projects/operator/src/index.html` (references `favicon.ico`).
3. Fixing `angular.json` — the operator `build` configuration has two bugs:
  - `fileReplacements` points to `src/environments/` instead of `projects/operator/src/environments/`.
  - `baseHref` is missing (operator must be served at `/operator/`).
4. Confirming favicon reuse — `public/favicon.ico` is the shared favicon for all apps; the operator `angular.json` already declares `{ "glob": "**/*", "input": "public" }` in its `assets` array, so **no copy is needed**. The `index.html` `<link rel="icon" ... href="favicon.ico" />` will resolve to this shared file at runtime.

## 2. Files to Create / Modify

| # | File Path                                                | Action               |
|---|----------------------------------------------------------|----------------------|
| 1 | `projects/operator/src/environments/environment.ts`      | Create New File      |
| 2 | `projects/operator/src/environments/environment.prod.ts` | Create New File      |
| 3 | `projects/operator/src/index.html`                       | Create New File      |
| 4 | `angular.json`                                           | Modify Existing File |

---

## 3. Code Implementation

### File 1 — `projects/operator/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  healthPollIntervalMs: 300_000,
  defaultLocale: 'ru',
  brand: 'Bike Rental',
};
```

### File 2 — `projects/operator/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'BIKE_API_PLACEHOLDER',
  healthPollIntervalMs: 300_000,
  defaultLocale: 'en',
  brand: 'Bike Rental Operator',
};
```

### File 3 — `projects/operator/src/index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Bikerental - Operator</title>
  <base href="/operator/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Bike rental operator panel" />
  <link rel="icon" type="image/x-icon" href="favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
</head>
<body>
<app-root></app-root>
</body>
</html>
```

### File 4 — `angular.json` (two changes inside the `"operator"` project section)

**Change 1 — Add `baseHref`:**

* **Location:** Inside `"operator" > "architect" > "build" > "options"`, add `"baseHref"` after the `"browser"` line.

* **Find:**
  ```json
          "browser": "projects/operator/src/main.ts",
          "outputPath": "dist/operator",
  ```

* **Replace with:**
  ```json
          "browser": "projects/operator/src/main.ts",
          "baseHref": "/operator/",
          "outputPath": "dist/operator",
  ```

**Change 2 — Fix `fileReplacements`:**

* **Location:** Inside `"operator" > "architect" > "build" > "configurations" > "production" > "fileReplacements"`.

* **Find:**
  ```json
                  {
                    "replace": "src/environments/environment.ts",
                    "with": "src/environments/environment.prod.ts"
                  }
  ```

* **Replace with:**
  ```json
                  {
                    "replace": "projects/operator/src/environments/environment.ts",
                    "with": "projects/operator/src/environments/environment.prod.ts"
                  }
  ```

---

## 4. Validation Steps

```powershell
# Full TypeScript parse-check — zero errors expected after this task
npx tsc -p projects/operator/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: **no output** (zero TypeScript errors).

```powershell
# Verify baseHref appears in angular.json operator section
Select-String -Path angular.json -Pattern '"/operator/"'
```

Expected: at least one match inside the operator project block.

```powershell
# Verify favicon is present in the shared public folder
Test-Path public/favicon.ico
```

Expected: `True`. The `angular.json` operator `assets` array already contains `{ "glob": "**/*", "input": "public" }`, so `public/favicon.ico` is automatically copied to the dist output root — no manual copy step required.
