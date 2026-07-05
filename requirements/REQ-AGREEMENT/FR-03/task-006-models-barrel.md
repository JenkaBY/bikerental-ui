# Task 006: Export agreement-signature model from models barrel

## 1. Objective

Add the new `agreement-signature.model` to the `core/models` barrel so it is reachable via
`@ui-models`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None.

**Code to Add/Replace:**

* **Location:** After the last line, `export * from './agreement-template.model';`.
* **Snippet:**

```typescript
export * from './agreement-template.model';
export * from './agreement-signature.model';
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
