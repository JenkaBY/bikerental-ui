# Task 001: Create `ServerTime` Domain Model

> **Applied Skill:** `angular-data-flow-orchestrator` — new domain model declared in `core/models/` following the established pattern (readonly interface with `Date` fields; no API types)

## 1. Objective

Create the `ServerTime` value-object interface in the shared library's domain-model layer. This gives all consumers a typed, API-decoupled representation of the backend's current clock state.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/server-time.model.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
// No imports — this is a pure domain interface with no external dependencies
```

**Code to Add/Replace:**

* **Location:** New file; paste the entire content below.

* **Snippet:**

```typescript
export interface ServerTime {
  readonly instant: Date;
  readonly fixed: boolean;
}
```

## 4. Validation Steps

skip