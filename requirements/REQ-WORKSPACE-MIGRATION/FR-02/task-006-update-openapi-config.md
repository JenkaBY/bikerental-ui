# Task 006: Move `openapi.config.ts` to `projects/shared/config/` and Update Output Path

> **Applied Skill:** `angular-tooling` — `ng-openapi` generator configuration; `generate:api` script output path alignment with workspace library root.

## 1. Objective

Move the OpenAPI generator config from `src/config/openapi.config.ts` to `projects/shared/config/openapi.config.ts` (co-located with the shared library it generates into) and update:

1. The `output` path inside the config (recalculated for the new file location).
2. The `generate:api` npm script in `package.json` to point to the new config path.

## 2. File to Modify / Create

* **File Path:** `projects/shared/config/openapi.config.ts`
* **Action:** Create New File

* **File Path:** `package.json`
* **Action:** Modify Existing File (`generate:api` script only)

## 3. Code Implementation

**Imports Required:** No changes to imports.

**Code to Add/Replace:**

### 3a. Create `projects/shared/config/openapi.config.ts`

* **Location:** New file. Create the directory `projects/shared/config/` if it does not exist.

```typescript
import { GeneratorConfig } from 'ng-openapi';

const config: GeneratorConfig = {
  input: 'http://localhost:8080/v3/api-docs/all',
  output: '../src/core/api/generated',
  options: {
    dateType: 'Date',
    enumStyle: 'enum',
    generateServices: true,
    responseTypeMapping: {
      'application/json': 'json',
    },
  },
};

export default config;
```

**Path derivation:** The config file lives at `projects/shared/config/openapi.config.ts`. The `output` is resolved relative to that file:

- `projects/shared/config/` → `../` → `projects/shared/`
- `../src/core/api/generated` → `projects/shared/src/core/api/generated` ✓

### 3b. Update `package.json` — `generate:api` script

**Current line (exact):**

```json
    "generate:api": "ng-openapi -c src/config/openapi.config.ts"
```

**Replace with:**

```json
    "generate:api": "ng-openapi -c projects/shared/config/openapi.config.ts"
```

## 4. Validation Steps

```powershell
# Confirm new file exists and old location still present (do not delete old yet)
Test-Path "projects\shared\config\openapi.config.ts"

# Confirm output path is correct
Get-Content "projects\shared\config\openapi.config.ts" | Select-String "output"
```

Expected: `True`; line containing `output: '../src/core/api/generated'`.

```powershell
# Confirm package.json script was updated
Get-Content package.json | Select-String "generate:api"
```

Expected: `"generate:api": "ng-openapi -c projects/shared/config/openapi.config.ts"`

> **Do NOT run `npm run generate:api`** as part of this validation — that requires a live backend on port 8080.
