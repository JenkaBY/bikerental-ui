# Task 001: Create UserProfile Domain Model

> **Applied Skill:** `angular-data-flow-orchestrator` — domain model must live in `core/models/`, be a pure TypeScript interface, and be re-exported through the barrel so components never reference internal paths

## 1. Objective

Create the `UserProfile` domain interface in the shared library's model layer and register it in the barrel exports so it is available to `admin`, `operator`, and `UserStore`.

## 2. File to Modify / Create

### 2a. New File

* **File Path:** `projects/shared/src/core/models/user-profile.model.ts`
* **Action:** Create New File

### 2b. Existing Barrel

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### 2a — `user-profile.model.ts`

**Imports Required:** _(none — pure interface, no runtime imports)_

**Code to Add:**

* **Location:** New file — full content

```typescript
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isAdmin: boolean;
  isOperator: boolean;
}
```

### 2b — `core/models/index.ts`

**Code to Add:**

* **Location:** Append as the last line of `projects/shared/src/core/models/index.ts`

```typescript
export * from './user-profile.model';
```

The file currently ends with:

```typescript
export * from './transaction.model';
```

Add the new line directly after it.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npm run build -- --project=shared
```
