# Task 002: Copy `src/app/shared/` into `projects/shared/src/shared/`

> **Applied Skill:** `angular-tooling` — multi-project workspace topology; library source root convention (`projects/shared/src/`).

## 1. Objective

Physically copy every file from `src/app/shared/` into `projects/shared/src/shared/`. After this task the shared library project has a complete copy of all reusable UI components, pipes, validators, utils, and constants. The original `src/app/shared/` is **not deleted** — it remains in place until FR-03 through FR-05 remove the consumers.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/` (entire directory — created by copy)
* **Action:** Create New File (via directory copy)

## 3. Code Implementation

**Imports Required:** N/A — file system operation.

**Code to Add/Replace:**

Run the following PowerShell command from the workspace root (`d:\Projects\private\bikerental-ui`):

```powershell
# Copy entire shared/ UI subtree (preserves all subdirectories and files)
Copy-Item -Path "src\app\shared" -Destination "projects\shared\src\shared" -Recurse -Force
```

**Expected result — `projects/shared/src/shared/` tree after this task:**

```
projects/shared/src/shared/
├── components/
│   ├── app-brand/
│   │   ├── app-brand.component.spec.ts
│   │   ├── app-brand.component.ts
│   │   └── app-brand.handlers.spec.ts
│   ├── app-toolbar/
│   │   ├── app-toolbar.component.spec.ts
│   │   ├── app-toolbar.component.ts
│   │   ├── app-toolbar.handlers.spec.ts
│   │   └── app-toolbar.interactions.spec.ts
│   ├── bottom-nav/
│   │   ├── bottom-nav.component.spec.ts
│   │   └── bottom-nav.component.ts
│   ├── bottom-nav-item/
│   │   └── bottom-nav-item.component.ts
│   ├── button/
│   │   ├── button.component.click.spec.ts
│   │   ├── button.component.spec.ts
│   │   └── button.component.ts
│   ├── cancel-button/
│   │   ├── cancel-button.component.spec.ts
│   │   └── cancel-button.component.ts
│   ├── dashboard-card/
│   │   ├── dashboard-card.component.spec.ts
│   │   └── dashboard-card.component.ts
│   ├── equipment-type-dropdown/
│   │   ├── equipment-type-dropdown.component.spec.ts
│   │   └── equipment-type-dropdown.component.ts
│   ├── health-indicator/
│   │   ├── health-indicator.component.html
│   │   ├── health-indicator.component.spec.ts
│   │   ├── health-indicator.component.ts
│   │   ├── health-tooltip-line.component.spec.ts
│   │   ├── health-tooltip-line.component.ts
│   │   ├── health-tooltip-lines.builder.spec.ts
│   │   ├── health-tooltip-lines.builder.ts
│   │   ├── health-tooltip.component.spec.ts
│   │   └── health-tooltip.component.ts
│   ├── layout-mode-toggle/
│   │   ├── layout-mode-toggle.component.branch.spec.ts
│   │   ├── layout-mode-toggle.component.spec.ts
│   │   └── layout-mode-toggle.component.ts
│   ├── logout-button/
│   │   ├── logout-button.component.spec.ts
│   │   └── logout-button.component.ts
│   ├── save-button/
│   │   ├── save-button.component.spec.ts
│   │   └── save-button.component.ts
│   ├── shell/
│   │   ├── shell.component.spec.ts
│   │   └── shell.component.ts
│   ├── sidebar/
│   │   ├── sidebar.component.spec.ts
│   │   └── sidebar.component.ts
│   ├── sidebar-nav-item/
│   │   ├── nav-item.model.ts
│   │   ├── sidebar-nav-item.component.spec.ts
│   │   └── sidebar-nav-item.component.ts
│   └── toggle-button/
│       ├── toggle-button.component.spec.ts
│       └── toggle-button.component.ts
├── constant/
│   └── labels.ts
├── pipes/
│   ├── truncate.pipe.spec.ts
│   └── truncate.pipe.ts
├── utils/
│   ├── date.util.spec.ts
│   └── date.util.ts
└── validators/
    ├── form-error-messages.spec.ts
    ├── form-error-messages.ts
    ├── slug-validators.spec.ts
    └── slug-validators.ts
```

## 4. Validation Steps

```powershell
# Confirm the copy succeeded — count files
(Get-ChildItem -Path "projects\shared\src\shared" -Recurse -File).Count

# Spot-check a key file exists
Test-Path "projects\shared\src\shared\components\health-indicator\health-indicator.component.ts"
Test-Path "projects\shared\src\shared\constant\labels.ts"
```

Expected: file count ≥ 50; both `Test-Path` calls return `True`.
