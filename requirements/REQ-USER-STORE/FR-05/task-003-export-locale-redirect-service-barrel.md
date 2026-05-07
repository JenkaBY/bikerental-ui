# Task 003: Export LocaleRedirectService from the Shared Library Barrel

> **Applied Skills:** Project convention — all public symbols from `projects/shared/` must be re-exported via `projects/shared/src/public-api.ts` so that `admin` and `operator` apps can inject `LocaleRedirectService` independently (e.g. for standalone testing or future direct use).

## 1. Objective

Add a single `export *` line for `LocaleRedirectService` to the shared library's barrel file so the symbol is part of the library's public API.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — this is an export statement only.

**Code to Add/Replace:**

* **Location:** Insert the new export line directly below the `export * from './core/layout-mode.service';` line (line 18 in the current file). The locale-redirect service is a core concern and belongs in the `// Core — layout mode` section or just after it.

```typescript
// Core — locale redirect
export * from './core/locale-redirect.service';
```

### Resulting block after the change

```typescript
// Core — layout mode
export * from './core/layout-mode.service';

// Core — locale redirect
export * from './core/locale-redirect.service';

// Core — mappers
export * from './core/mappers';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT start the application server.

```bash
# Build the shared library — confirms the export resolves and no circular-dependency errors
npm run build -- --project shared

# Verify the admin and operator builds still compile (they consume the shared library)
npm run build -- --project admin
npm run build -- --project operator
```
