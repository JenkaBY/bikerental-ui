# Task 001: Add `timeTravelEnabled` to Development Environment

> **Applied Skill:** `angular.instructions.md` — shared environment object extended with a plain TypeScript boolean field following the existing `apiUrl` / `healthPollIntervalMs` / `defaultLocale` / `brand` pattern

## 1. Objective

Add the `timeTravelEnabled: true` boolean field to the shared development environment file so that the time-travel feature is active by default in all local-development builds of `gateway`, `admin`, and `operator`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/environments/environment.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No new imports — this is a plain object literal modification
```

**Code to Add/Replace:**

* **Location:** Inside the `environment` object literal, add `timeTravelEnabled` as the last property, after the existing `brand` field.

* **Snippet (Replace):**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  healthPollIntervalMs: 300_000,
  defaultLocale: 'ru',
  brand: 'Bike Rental',
  timeTravelEnabled: true,
};
```

## 4. Validation Steps

skip