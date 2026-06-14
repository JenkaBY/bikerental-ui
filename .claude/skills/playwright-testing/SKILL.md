---
name: playwright-testing
description: Standards for writing Playwright end-to-end tests in TypeScript — resilient role-based locators, web-first auto-retrying assertions, test structure, and file organization. Use when generating, reviewing, or debugging Playwright (.spec.ts) browser/e2e tests.
---

# Playwright Test Writing

> The project's primary test runner is **Vitest** for unit/component tests. Use this skill for
> browser-level **end-to-end** tests written with Playwright.

## Code quality standards

- **Locators:** prioritize user-facing, role-based locators (`getByRole`, `getByLabel`, `getByText`)
  for resilience and accessibility. Use `test.step()` to group interactions and improve readability
  and reporting.
- **Assertions:** use auto-retrying web-first assertions that start with `await` (e.g.,
  `await expect(locator).toHaveText(...)`). Avoid `expect(locator).toBeVisible()` unless specifically
  testing visibility changes.
- **Timeouts:** rely on Playwright's built-in auto-waiting; avoid hard-coded waits or inflated default
  timeouts.
- **Clarity:** descriptive test and step titles that state intent. Comment only complex or non-obvious
  interactions.

## Test structure

- **Imports:** `import { test, expect } from '@playwright/test';`
- **Organization:** group related tests for a feature under `test.describe()`.
- **Hooks:** use `beforeEach` for setup common to a describe block (e.g., navigation).
- **Titles:** `Feature - Specific action or scenario`.

## File organization

- **Location:** store test files in `tests/`.
- **Naming:** `<feature-or-page>.spec.ts` (e.g., `login.spec.ts`, `search.spec.ts`).
- **Scope:** aim for one test file per major feature or page.

## Assertion best practices

- **UI structure:** `toMatchAriaSnapshot` to verify the accessibility tree of a component.
- **Element counts:** `toHaveCount`.
- **Text content:** `toHaveText` (exact) / `toContainText` (partial).
- **Navigation:** `toHaveURL` after an action.

## Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Movie Search Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://debs-obrien.github.io/playwright-movies-app');
  });

  test('Search for a movie by title', async ({ page }) => {
    await test.step('Activate and perform search', async () => {
      await page.getByRole('search').click();
      const searchInput = page.getByRole('textbox', { name: 'Search Input' });
      await searchInput.fill('Garfield');
      await searchInput.press('Enter');
    });

    await test.step('Verify search results', async () => {
      await expect(page.getByRole('main')).toMatchAriaSnapshot(`
        - main:
          - heading "Garfield" [level=1]
          - heading "search results" [level=2]
      `);
    });
  });
});
```

## Execution strategy

1. Initial run: `npx playwright test --project=chromium`.
2. Debug failures and identify root causes.
3. Iterate on locators, assertions, or test logic.
4. Validate the tests pass consistently.

## Quality checklist

- [ ] Locators are accessible, specific, and avoid strict-mode violations.
- [ ] Tests are grouped logically with clear structure.
- [ ] Assertions are meaningful and reflect user expectations.
- [ ] Consistent naming conventions.
- [ ] Code is properly formatted; comments only where needed.
