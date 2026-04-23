# Task 005: Validation — npm Scripts, Tests, and CI Workflow

> **Applied Skill:** `angular-tooling` — multi-project test and lint execution.

## 1. Objective

Validate that all FR-06 changes are correctly applied by running each npm script that was modified and verifying CI workflow YAML syntax.

## 2. Files to Modify / Create

No files are created or modified in this task. This is a validation-only task.

---

## 3. Code Implementation

No code to write.

---

## 4. Validation Steps

Execute in order. Each must exit cleanly before proceeding.

**Step 1 — Verify npm start resolves to gateway:**

```powershell
node -e "const p = require('./package.json'); if (!p.scripts.start.includes('ng serve gateway')) throw new Error('FAIL'); console.log('OK:', p.scripts.start);"
```

Expected: `OK: ng serve gateway --configuration development`

**Step 2 — Run lint for all 4 projects:**

```powershell
ng lint gateway && ng lint admin && ng lint operator && ng lint shared
```

Expected: all exit 0, no lint errors.

**Step 3 — Run unit tests across all 4 projects:**

```powershell
npx ng test gateway --watch=false
npx ng test admin --watch=false
npx ng test operator --watch=false
npx ng test shared --watch=false
```

Expected: each exits 0; total test count across all projects is > 0.

**Step 4 — Verify i18n extract-i18n config is present in angular.json:**

```powershell
node -e "
const a = require('./angular.json');
['gateway','admin','operator'].forEach(p => {
  const opt = a.projects[p].architect['extract-i18n'].options;
  if (!opt.outFile) throw new Error(p + ' missing outFile');
  console.log('OK:', p, opt.outFile);
});"
```

Expected:

```
OK: gateway gateway.xlf
OK: admin admin.xlf
OK: operator operator.xlf
```

**Step 5 — Validate GitHub Actions YAML syntax:**

```powershell
python -c "import yaml, sys; yaml.safe_load(open('.github/workflows/build-and-deploy.yml')); print('YAML valid')"
```

Expected: `YAML valid`

**Step 6 — Verify secret injection targets all three apps:**

```powershell
Select-String -Path .github/workflows/build-and-deploy.yml -Pattern "environment.prod.ts"
```

Expected: exactly 3 matches (`gateway`, `admin`, `operator`).

**Step 7 — Verify Pages artifact path is `staging`:**

```powershell
Select-String -Path .github/workflows/build-and-deploy.yml -Pattern "path: staging"
```

Expected: 1 match.
