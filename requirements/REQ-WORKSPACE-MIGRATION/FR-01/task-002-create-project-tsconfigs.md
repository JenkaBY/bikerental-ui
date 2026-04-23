# Task 002: Create Per-Project TypeScript Configuration Files

> **Applied Skill:** `angular-tooling` — Per-project `tsconfig.app.json` / `tsconfig.spec.json` pattern; project references in root `tsconfig.json`; Angular compiler options inheritance.

## 1. Objective

Create the TypeScript configuration files required by each of the four project build targets declared in `angular.json`. Each app project gets a `tsconfig.app.json` and `tsconfig.spec.json`. The shared library project gets a `tsconfig.lib.json` and `tsconfig.lib.prod.json`. All files extend the root `tsconfig.json` to inherit compiler strictness settings. The root `tsconfig.json` `references` array is updated to include all new project configs.

## 2. File to Modify / Create

### 2a. `projects/gateway/tsconfig.app.json` — Create New File

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/gateway-app",
    "types": ["@angular/localize"]
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "src/**/*.spec.ts"
  ]
}
```

### 2b. `projects/gateway/tsconfig.spec.json` — Create New File

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/gateway-spec",
    "types": ["vitest/globals", "@angular/localize"]
  },
  "include": [
    "src/**/*.d.ts",
    "src/**/*.spec.ts"
  ]
}
```

### 2c. `projects/admin/tsconfig.app.json` — Create New File

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/admin-app",
    "types": ["@angular/localize"]
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "src/**/*.spec.ts"
  ]
}
```

### 2d. `projects/admin/tsconfig.spec.json` — Create New File

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/admin-spec",
    "types": ["vitest/globals", "@angular/localize"]
  },
  "include": [
    "src/**/*.d.ts",
    "src/**/*.spec.ts"
  ]
}
```

### 2e. `projects/operator/tsconfig.app.json` — Create New File

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/operator-app",
    "types": ["@angular/localize"]
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "src/**/*.spec.ts"
  ]
}
```

### 2f. `projects/operator/tsconfig.spec.json` — Create New File

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/operator-spec",
    "types": ["vitest/globals", "@angular/localize"]
  },
  "include": [
    "src/**/*.d.ts",
    "src/**/*.spec.ts"
  ]
}
```

### 2g. `projects/shared/tsconfig.lib.json` — Create New File

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/shared-lib",
    "declaration": true,
    "declarationMap": true,
    "inlineSources": true,
    "types": ["@angular/localize"]
  },
  "angularCompilerOptions": {
    "skipTemplateCodegen": true,
    "strictMetadataEmit": true,
    "enableResourceInlining": true
  },
  "exclude": [
    "src/test.ts",
    "src/**/*.spec.ts",
    "ng-package.json"
  ]
}
```

### 2h. `projects/shared/tsconfig.lib.prod.json` — Create New File

```json
{
  "extends": "./tsconfig.lib.json",
  "angularCompilerOptions": {
    "compilationMode": "partial"
  }
}
```

### 2i. Root `tsconfig.json` — Modify Existing File

Replace the `references` array. The existing array currently contains:

```json
"references": [
  { "path": "./tsconfig.app.json" },
  { "path": "./tsconfig.spec.json" }
]
```

Replace it with:

```json
"references": [
  { "path": "./tsconfig.app.json" },
  { "path": "./tsconfig.spec.json" },
  { "path": "./projects/gateway/tsconfig.app.json" },
  { "path": "./projects/gateway/tsconfig.spec.json" },
  { "path": "./projects/admin/tsconfig.app.json" },
  { "path": "./projects/admin/tsconfig.spec.json" },
  { "path": "./projects/operator/tsconfig.app.json" },
  { "path": "./projects/operator/tsconfig.spec.json" },
  { "path": "./projects/shared/tsconfig.lib.json" }
]
```

> The legacy `tsconfig.app.json` and `tsconfig.spec.json` at the root remain for now so that any tooling that still reads them (IDE, Husky) does not break before the source migration is complete.

## 3. Code Implementation

**Imports Required:** N/A — JSON/configuration files.

**Code to Add/Replace:**

Follow the exact file content specified in section 2 above for each file. Create all files listed as "Create New File". Apply the `references` array replacement in root `tsconfig.json`.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
# Verify TypeScript can parse all new configs without errors
npx tsc -p projects/gateway/tsconfig.app.json --noEmit 2>&1 | head -5
npx tsc -p projects/admin/tsconfig.app.json --noEmit 2>&1 | head -5
npx tsc -p projects/operator/tsconfig.app.json --noEmit 2>&1 | head -5
npx tsc -p projects/shared/tsconfig.lib.json --noEmit 2>&1 | head -5
```

Expected: each command exits with code 0 and reports no errors (the `include` patterns may find zero files at this stage — that produces a warning, not an error). Zero `error TS` lines in output.

```bash
# Validate root tsconfig references are parseable
npx tsc --build --dry 2>&1 | head -20
```

Expected: no `error TS` lines. May print `Build is up-to-date` or similar.
