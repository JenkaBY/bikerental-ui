# Task 002: Enable `withComponentInputBinding()` in `app.config.ts`

> **Applied Skill:** `angular-routing` — `withComponentInputBinding()` must be added to `provideRouter()` so that Angular automatically binds URL query parameters (such as `id`) to `input()` signal properties on the loaded component.

## 1. Objective

Add `withComponentInputBinding()` to the `provideRouter()` call in the operator app's `ApplicationConfig` so that the `id` query parameter in URLs like `/rentals/new?id=42` is automatically bound to the `id = input<number>()` signal declared on `RentalCreateComponent`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/app.config.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import { provideRouter, withComponentInputBinding } from '@angular/router';
```

Add `withComponentInputBinding` to the existing `@angular/router` import statement. The current import is:

```typescript
import { provideRouter } from '@angular/router';
```

Replace it with:

```typescript
import { provideRouter, withComponentInputBinding } from '@angular/router';
```

**Code to Add/Replace:**

* **Location:** Inside the `providers` array in the exported `appConfig` object, update the `provideRouter()` call — it is the first or second entry in the `providers` array.
* **Snippet:**

Replace:

```typescript
    provideRouter(routes),
```

With:

```typescript
    provideRouter(routes, withComponentInputBinding()),
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build operator --configuration=development
```
