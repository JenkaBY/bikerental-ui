# Task 001: Copy `src/app/core/` into `projects/shared/src/core/`

> **Applied Skill:** `angular-tooling` — multi-project workspace topology; library source root convention (`projects/shared/src/`).

## 1. Objective

Physically copy every file from `src/app/core/` into `projects/shared/src/core/` and copy `src/app/app.tokens.ts` into `projects/shared/src/app.tokens.ts`. After this task the shared library project has a full copy of all cross-cutting core code. The original `src/app/core/` tree is **not deleted** here — deletion happens implicitly when each app project moves its consumers in FR-03 through FR-05.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/` (entire directory — created by copy)
* **Action:** Create New File (via directory copy)

* **File Path:** `projects/shared/src/app.tokens.ts`
* **Action:** Create New File (via copy)

## 3. Code Implementation

**Imports Required:** N/A — file system operation.

**Code to Add/Replace:**

Run the following PowerShell commands from the workspace root (`d:\Projects\private\bikerental-ui`):

```powershell
# Copy entire core/ subtree (preserves all subdirectories and files)
Copy-Item -Path "src\app\core" -Destination "projects\shared\src\core" -Recurse -Force

# Copy the app-level token definitions needed by all 3 apps
Copy-Item -Path "src\app\app.tokens.ts" -Destination "projects\shared\src\app.tokens.ts" -Force
```

**Expected result — `projects/shared/src/` tree after this task:**

```
projects/shared/src/
├── app.tokens.ts
└── core/
    ├── api/
    │   └── generated/
    │       ├── index.ts
    │       ├── models/
    │       │   └── index.ts
    │       ├── providers.ts
    │       ├── services/
    │       │   ├── customers.service.ts
    │       │   ├── equipment.service.ts
    │       │   ├── equipmentStatuses.service.ts
    │       │   ├── equipmentTypes.service.ts
    │       │   ├── finance.service.ts
    │       │   ├── index.ts
    │       │   ├── rentals.service.ts
    │       │   └── tariffs.service.ts
    │       ├── tokens/
    │       │   └── index.ts
    │       └── utils/
    │           ├── base-interceptor.ts
    │           ├── date-transformer.ts
    │           ├── file-download.ts
    │           └── http-params-builder.ts
    ├── health/
    │   ├── health-poller.service.spec.ts
    │   ├── health-poller.service.ts
    │   ├── health.model.ts
    │   ├── health.service.spec.ts
    │   └── health.service.ts
    ├── interceptors/
    │   ├── error.interceptor.spec.ts
    │   ├── error.interceptor.ts
    │   ├── error.service.spec.ts
    │   └── error.service.ts
    ├── layout-mode.service.spec.ts
    ├── layout-mode.service.ts
    ├── mappers/
    │   ├── customer.mapper.ts
    │   ├── equipment-status.mapper.ts
    │   ├── equipment-type.mapper.ts
    │   ├── equipment.mapper.ts
    │   ├── index.ts
    │   ├── page.mapper.ts
    │   ├── pricing-type.mapper.ts
    │   └── tariff.mapper.ts
    ├── models/
    │   ├── common.model.ts
    │   ├── customer.model.ts
    │   ├── equipment-status.model.ts
    │   ├── equipment-type.model.ts
    │   ├── equipment.model.ts
    │   ├── index.ts
    │   ├── lookup-config.model.ts
    │   └── tariff.model.ts
    └── state/
        ├── equipment-status.store.spec.ts
        ├── equipment-status.store.ts
        ├── equipment-type.store.spec.ts
        ├── equipment-type.store.ts
        ├── equipment.store.spec.ts
        ├── equipment.store.ts
        ├── lookup-initializer.facade.ts
        ├── pricing-type.store.spec.ts
        ├── pricing-type.store.ts
        ├── tariff.store.spec.ts
        └── tariff.store.ts
```

## 4. Validation Steps

```powershell
# Confirm the copy succeeded — count files
(Get-ChildItem -Path "projects\shared\src\core" -Recurse -File).Count

# Confirm app.tokens.ts was copied
Test-Path "projects\shared\src\app.tokens.ts"
```

Expected: file count matches the source tree (≥ 30 files); `True` for the tokens file check.

> **Note:** Do NOT modify any file contents in this task. If a file already exists at the destination (from a previous attempt), `-Force` overwrites it — that is safe here.
