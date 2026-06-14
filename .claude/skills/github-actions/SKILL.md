---
name: github-actions
description: Best practices for authoring and reviewing GitHub Actions CI/CD workflows — secure secrets/permissions, caching, matrix parallelization, testing stages, and deployment strategies. Use when creating or editing .github/workflows/*.yml, debugging pipeline failures, or hardening CI/CD security.
---

# GitHub Actions CI/CD Best Practices

Guidance for building secure, efficient, reliable workflows in `.github/workflows/*.yml`. For the
comprehensive review checklist and troubleshooting deep-dive, see
[references/review-and-troubleshooting.md](references/review-and-troubleshooting.md).

## Structure

- **Naming:** descriptive workflow files (`build-and-test.yml`, `deploy-prod.yml`).
- **Triggers (`on`):** pick the narrowest fit — `push`, `pull_request`, `workflow_dispatch` (manual,
  with inputs), `schedule`, `workflow_call` (reusable). Use path/branch filters effectively.
- **Concurrency:** set `concurrency` for critical/shared-resource workflows to avoid races and wasted runs.
- **Reuse:** extract common patterns into reusable workflows (`workflow_call`).

## Jobs & steps

- **`runs-on`:** `ubuntu-latest` by default; other runners only when needed.
- **`needs`:** declare dependencies so jobs run in the right order; pass data via `outputs`.
- **`if`:** gate jobs/steps by branch, event, or prior status (`success()`, `failure()`, `always()`).
- **Pin actions:** reference `uses` by full commit SHA or at least a major tag (`@v4`). Never `main`/`latest`.
- **`timeout-minutes`:** set on long-running jobs to prevent hangs.
- **Named steps:** every step has a descriptive `name` for log readability.

## Security (priority)

- **Secrets:** store sensitive values in GitHub Secrets; access via `secrets.<NAME>`. Never hardcode
  or echo them, even though logs are masked. Prefer environment-scoped secrets with approvals for deploys.
- **`GITHUB_TOKEN` least privilege:** set `permissions` explicitly; default to `contents: read` and
  add write scopes only where strictly required.
- **OIDC for cloud auth:** use OpenID Connect to obtain short-lived cloud credentials instead of
  long-lived static keys.
- **Supply chain:** integrate dependency review / SCA (e.g. `dependency-review-action`) and SAST
  (e.g. CodeQL); enable secret scanning; audit marketplace actions before use.

```yaml
permissions:
  contents: read        # secure default
  pull-requests: write  # only if the workflow updates PRs
```

## Optimization

- **Caching:** use `actions/cache` with keys from `hashFiles('**/package-lock.json')` and
  `restore-keys` fallbacks for high hit rates.
- **Matrix:** use `strategy.matrix` to parallelize across OS / language versions; tune with
  `include`/`exclude` and `fail-fast`.
- **Fast checkout:** `actions/checkout` with `fetch-depth: 1` unless full history is required; skip
  submodules/LFS when not needed.
- **Artifacts:** pass build outputs / reports between jobs with `actions/upload-artifact` /
  `download-artifact`; set `retention-days` to control cost.

## Testing in the pipeline

- **Unit:** run on every push/PR, early and fast; collect coverage and publish reports.
- **Integration:** provision dependencies via `services` containers; run after unit tests.
- **E2E:** run against a staging-like environment; mitigate flakiness with robust selectors, explicit
  waits, and retries; capture screenshots/video on failure.
- **Visibility:** publish results as GitHub Checks/annotations and artifacts.

## Deployment

- Use GitHub **Environments** with protection rules (required reviewers, branch restrictions) for
  staging and production; require manual approval for production.
- Keep versioned artifacts and a tested **rollback** strategy; run post-deploy smoke tests/health
  checks and roll back on failure.
- Choose a strategy to fit risk: rolling, blue/green, canary, or feature-flag dark launch.
