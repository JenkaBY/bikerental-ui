# Task 005: Copy Environment Files and Update package.json `start` Script

> **Applied Skill:** `angular-tooling` — `ng serve` project targeting; file replacements in `angular.json`; environment file co-location.

## 1. Objective

Two sub-steps:

1. **Copy environment files** into `projects/gateway/src/environments/` so the gateway project is self-contained. These files are identical to the originals in `src/environments/` — no values change at this step. The `angular.json` `gateway` build configuration already references `src/environments/` via `fileReplacements`; this task updates those paths to point to the gateway-local copies.

2. **Update `package.json`** so `npm start` serves the `gateway` project instead of the old default project.

## 2. Files to Create / Modify

### Files to Create

* `projects/gateway/src/environments/environment.ts`
* `projects/gateway/src/environments/environment.prod.ts`

### Files to Modify

* `angular.json` — update `gateway` build `fileReplacements` to use gateway-local environment paths
* `package.json` — update the `start` script to target the gateway project

---

## 3. Code Implementation

### Step 1 — Copy `environment.ts`

Run from workspace root:

```powershell
Copy-Item -Path "src\environments\environment.ts" `
          -Destination "projects\gateway\src\environments\environment.ts" -Force

Copy-Item -Path "src\environments\environment.prod.ts" `
          -Destination "projects\gateway\src\environments\environment.prod.ts" -Force
```

### Step 2 — Update `angular.json` `fileReplacements`

In `angular.json`, inside `projects.gateway.architect.build.configurations.production.fileReplacements`, replace the existing entry:

**Find (existing):**

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

**Replace with:**

```json
"fileReplacements": [
  {
    "replace": "projects/gateway/src/environments/environment.ts",
    "with": "projects/gateway/src/environments/environment.prod.ts"
  }
]
```

* **Location:** `projects > gateway > architect > build > configurations > production > fileReplacements`

### Step 3 — Update `package.json` `start` script

**Find (existing):**

```json
"start": "ng serve",
```

**Replace with:**

```json
"start": "ng serve gateway",
```

* **Location:** `scripts` object in `package.json`

---

## 4. Validation Steps

```powershell
# Confirm environment files copied
Test-Path "projects\gateway\src\environments\environment.ts"
Test-Path "projects\gateway\src\environments\environment.prod.ts"

# Confirm package.json start script updated
Get-Content package.json | Select-String "ng serve gateway"

# Confirm angular.json fileReplacements updated
Get-Content angular.json | Select-String "projects/gateway/src/environments"

# Final TypeScript parse-check for the full gateway project
npx tsc -p projects/gateway/tsconfig.app.json --noEmit
```

Expected:

- Both `Test-Path` return `True`
- `Select-String` on `package.json` returns the updated start line
- `Select-String` on `angular.json` returns the updated fileReplacement path
- `tsc` produces no errors
