# Task 004: Create `projects/shared/ng-package.json`

> **Applied Skill:** `angular-tooling` — `ng-packagr` library manifest; `ng-package.json` required by `@angular/build:ng-packagr` build target declared in `angular.json` for the `shared` project.

## 1. Objective

Create the `ng-package.json` manifest that the `@angular/build:ng-packagr` build target (declared for the `shared` project in `angular.json` during FR-01) requires. This file tells `ng-packagr` where the library entry point is and where to write the build output. Even though the `shared` library is consumed as an internal path-alias library (no separate build step is run during normal development), the manifest must exist so that `ng build shared` does not fail with a missing configuration error.

## 2. File to Modify / Create

* **File Path:** `projects/shared/ng-package.json`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** N/A — JSON file.

**Code to Add/Replace:**

* **Location:** Create the file at `projects/shared/ng-package.json` with the exact content below.

```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "src/public-api.ts"
  },
  "deleteDestPath": false,
  "dest": "../../dist/shared"
}
```

**Field explanations:**

| Field            | Value                                                  | Reason                                                                                                                     |
|------------------|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| `$schema`        | `../../node_modules/ng-packagr/ng-package.schema.json` | Resolves from `projects/shared/` up to workspace root where `node_modules` lives                                           |
| `lib.entryFile`  | `src/public-api.ts`                                    | The barrel file created in task-003                                                                                        |
| `deleteDestPath` | `false`                                                | Do not wipe `dist/shared` before each build — avoids accidental deletion in a monorepo where multiple builds share `dist/` |
| `dest`           | `../../dist/shared`                                    | Output goes to `dist/shared/` at workspace root, consistent with the other app outputs                                     |

## 4. Validation Steps

```powershell
# Confirm the file was created and is valid JSON
Test-Path "projects\shared\ng-package.json"
Get-Content "projects\shared\ng-package.json" | ConvertFrom-Json
```

Expected: `Test-Path` returns `True`; `ConvertFrom-Json` succeeds without throwing.

```powershell
# Confirm angular.json still references this file correctly
npx ng config projects.shared.architect.build.options.project
```

Expected output: `projects/shared/ng-package.json`
