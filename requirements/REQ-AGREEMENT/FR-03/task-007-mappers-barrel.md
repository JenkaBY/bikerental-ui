# Task 007: Export agreement-signature mapper from mappers barrel

## 1. Objective

Add the new `agreement-signature.mapper` to the `core/mappers` barrel.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None.

**Code to Add/Replace:**

* **Location:** After the last line, `export * from './agreement-template.mapper';`.
* **Snippet:**

```typescript
export * from './agreement-template.mapper';
export * from './agreement-signature.mapper';
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
