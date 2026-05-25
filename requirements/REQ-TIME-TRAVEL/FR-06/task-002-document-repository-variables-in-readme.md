# Task 002: Document Repository Variables in `README.md`

> **Applied Skill:** `update-docs-on-code-change.instructions.md` — documentation updated alongside the code change that introduces the new CI/CD variable

## 1. Objective

Add a **Repository Variables** subsection to the `## CI/CD` section of `README.md`, documenting both `BIKE_RENTAL_API` (existing, undocumented) and `BIKE_TIME_TRAVEL_ENABLED` (new). The table records the variable name, whether it is required, its allowed values, and the effect of leaving it unset.

## 2. File to Modify / Create

* **File Path:** `README.md`
* **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:**

* **Location:** Append the new subsection immediately **after** the `### GitHub Pages Setup` subsection (which ends with the line `2. Set **Source** to **GitHub Actions**`).

* **Snippet (Add after the GitHub Pages Setup section):**

```markdown
### Repository Variables

Set the following variables under **Settings → Secrets and variables → Variables** (not Secrets — these values are not sensitive):

| Variable | Required | Allowed values | Effect when unset |
|---|---|---|---|
| `BIKE_RENTAL_API` | Yes | Full API base URL, e.g. `https://api.example.com` | Empty string is substituted; app builds but cannot reach the backend |
| `BIKE_TIME_TRAVEL_ENABLED` | No | `true` or `false` | Placeholder stays unreplaced; expression evaluates to `false`; time-travel feature is disabled; build succeeds |
```

## 4. Validation Steps

skip