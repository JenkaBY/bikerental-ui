# Task 001: Create LocaleRedirectService

> **Applied Skills:** `angular-di` — new `@Injectable({ providedIn: 'root' })` service using `inject()` and the `LOCALE_ID` token to read the active compiled locale at runtime.

## 1. Objective

Create `LocaleRedirectService` in `projects/shared/src/core/`. It owns the entire URL-construction and navigation logic for locale switching: it reads the active locale via `LOCALE_ID`, maps locale tags to URL path prefixes via an internal allow-list, and calls `window.location.assign()` to reload the page at the equivalent path in the target locale. Unsupported locale tags are silently ignored, eliminating open-redirect risk.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/locale-redirect.service.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { inject, Injectable, LOCALE_ID } from '@angular/core';
```

**Code to Add/Replace:**

* **Location:** New file — paste the entire snippet as the file contents.

```typescript
import { inject, Injectable, LOCALE_ID } from '@angular/core';

const SUPPORTED_LOCALE_PREFIX: Readonly<Record<string, string>> = {
  'en-US': '',
  en: '',
  ru: '/ru',
};

@Injectable({ providedIn: 'root' })
export class LocaleRedirectService {
  private readonly localeId = inject(LOCALE_ID);

  redirect(targetLocale: string): void {
    const targetPrefix = SUPPORTED_LOCALE_PREFIX[targetLocale];
    if (targetPrefix === undefined) {
      return;
    }

    const currentPrefix = SUPPORTED_LOCALE_PREFIX[this.localeId] ?? '';
    const currentPathname = window.location.pathname;
    const strippedPathname =
      currentPrefix && currentPathname.startsWith(currentPrefix)
        ? currentPathname.slice(currentPrefix.length)
        : currentPathname;

    const targetUrl = window.location.origin + targetPrefix + strippedPathname;
    window.location.assign(targetUrl);
  }
}
```

### Key Implementation Notes

| Point                                       | Detail                                                                                                                                                                                              |
|---------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SUPPORTED_LOCALE_PREFIX`                   | Module-level `const`; not exported — internal allow-list only                                                                                                                                       |
| `'en-US'` and `'en'` both map to `''`       | Angular may compile with either tag; both must be present                                                                                                                                           |
| `targetPrefix === undefined` guard          | Silently returns for unsupported locales — no error thrown (FR-05 Scenario 4)                                                                                                                       |
| `currentPrefix ?? ''` fallback              | Protects against a runtime locale that is not in the allow-list                                                                                                                                     |
| `currentPathname.startsWith(currentPrefix)` | Only strips the prefix when it is actually present at the start of the path                                                                                                                         |
| `window.location.assign(targetUrl)`         | Causes a full-page reload; `targetUrl` is assembled exclusively from `window.location.origin` (trusted) + allow-listed prefix + the sanitised stripped pathname — no raw user input is concatenated |

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT start the application server.

```bash
# Verify the shared library compiles without errors
npm run build -- --project shared

# Run the full shared test suite (new service has no spec yet — that is Task 004)
npx vitest run --project shared
```
