# Task 002: Add `timeTravelEnabled` to Production Environment

> **Applied Skill:** `angular.instructions.md` — production environment file receives a CI/CD-replaceable placeholder expression following the same `BIKE_API_PLACEHOLDER` pattern already used for `apiUrl`

## 1. Objective

Add the `timeTravelEnabled` field to the shared production environment file using the CI/CD-replaceable placeholder expression `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')`. When the CI/CD pipeline does **not** substitute the placeholder, the expression evaluates to `false` at compile time — the feature is silently disabled and the build succeeds. When the pipeline substitutes `'true'` for `BIKE_TIME_TRAVEL_PLACEHOLDER`, the expression evaluates to `true`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/environments/environment.prod.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// No new imports — this is a plain object literal modification
```

**Code to Add/Replace:**

* **Location:** Inside the `environment` object literal, add `timeTravelEnabled` as the last property, after the existing `brand` field.

* **Snippet (Replace entire file):**

```typescript
export const environment = {
  production: true,
  apiUrl: 'BIKE_API_PLACEHOLDER',
  healthPollIntervalMs: 300_000,
  defaultLocale: 'en',
  brand: 'Bike Rental',
  timeTravelEnabled: ('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true'),
};
```

> **Why this expression?**  
> A plain string literal like `'BIKE_TIME_TRAVEL_PLACEHOLDER'` would fail the TypeScript `boolean` type check. The comparison expression `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')` always has type `boolean`, satisfies TypeScript strict mode, and evaluates to `false` when the CI/CD `sed` step is absent (unhappy-path behaviour).

## 4. Validation Steps

skip