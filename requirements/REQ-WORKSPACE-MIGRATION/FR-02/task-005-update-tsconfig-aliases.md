# Task 005: Update `tsconfig.json` Path Aliases for Shared Library

> **Applied Skill:** `angular-tooling` — TypeScript `compilerOptions.paths` workspace alias configuration; `@bikerental/shared` internal library pattern.

## 1. Objective

Update the root `tsconfig.json` to:

1. Add the new `@bikerental/shared` alias pointing to `projects/shared/src/public-api.ts`.
2. Re-root the three existing granular aliases (`@api-models`, `@ui-models`, `@store.*`) to resolve inside `projects/shared/src/` instead of the old `src/app/` paths.

After this task, any file in any project that uses `import { X } from '@bikerental/shared'` or the granular aliases will resolve to the shared library source without error.

## 2. File to Modify / Create

* **File Path:** `tsconfig.json`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** N/A — JSON file.

**Code to Add/Replace:**

* **Location:** Inside `compilerOptions.paths` — replace the entire `"paths"` object.

**Current `"paths"` block (exact):**

```json
    "paths": {
      "@api-models": ["src/app/core/api/generated/models/index.ts"],
      "@ui-models": ["src/app/core/models/index.ts"],
      "@store.*": ["src/app/core/state/*"]
    }
```

**Replace with:**

```json
    "paths": {
      "@bikerental/shared": ["projects/shared/src/public-api.ts"],
      "@api-models": ["projects/shared/src/core/api/generated/models/index.ts"],
      "@ui-models": ["projects/shared/src/core/models/index.ts"],
      "@store.*": ["projects/shared/src/core/state/*"]
    }
```

**No other changes to `tsconfig.json`.**

## 4. Validation Steps

```powershell
# Confirm paths were updated
npx ng config --global false 2>$null; Get-Content tsconfig.json | Select-String "@bikerental"
```

Expected output: a line containing `"@bikerental/shared": ["projects/shared/src/public-api.ts"]`.

```powershell
# TypeScript resolves the alias — parse shared lib tsconfig (should find the barrel file)
npx tsc -p projects/shared/tsconfig.lib.json --noEmit --listFiles 2>&1 | Select-String "public-api"
```

Expected: at least one line containing `public-api.ts` in the output.

```powershell
# Verify old alias paths are gone
Get-Content tsconfig.json | Select-String "src/app/core"
```

Expected: **no output** (old paths removed).
