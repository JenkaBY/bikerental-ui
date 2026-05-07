# Task 001: Create UserPreferences Model and Update Barrel

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 1: Model Definition rule for creating clean UI domain objects in `core/models/`.

## 1. Objective

Create the `UserPreferences` interface and `DEFAULT_USER_PREFERENCES` constant in the shared library's domain model layer, then re-export them through the `core/models/index.ts` barrel so they are accessible to `admin`, `operator`, and the future `UserStore` (FR-03).

## 2. File to Modify / Create

### 2a. New File

* **File Path:** `projects/shared/src/core/models/user-preferences.model.ts`
* **Action:** Create New File

### 2b. Existing Barrel

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### 3a. New file — `user-preferences.model.ts`

**Imports Required:** _(none)_

**Code to Add:**

* **Location:** New file — entire contents

```typescript
export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  language: string;
  theme: Theme;
}

export const DEFAULT_USER_PREFERENCES: Readonly<UserPreferences> = {
  language: 'en-US',
  theme: 'system',
} as const;
```

---

### 3b. Update barrel — `projects/shared/src/core/models/index.ts`

**Location:** Append a new export line **after** the last existing `export *` line (currently `export * from './user-profile.model';`).

**Current last line:**

```typescript
export * from './user-profile.model';
```

**Replace with:**

```typescript
export * from './user-profile.model';
export * from './user-preferences.model';
```

> **Note on `public-api.ts`:** No change is required. `projects/shared/src/public-api.ts` already contains `export * from './core/models';`, which re-exports everything from the barrel. The new symbols will be transitively available from `@bikerental/shared`.

---

## 4. Validation Steps

Skip validation
