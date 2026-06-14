# GitHub Actions — Review Checklist & Troubleshooting

Companion reference for the `github-actions` skill. Use the checklist when reviewing a workflow, and
the troubleshooting section when a pipeline misbehaves.

## Comprehensive review checklist

### General structure and design
- [ ] Workflow `name` is clear, descriptive, unique.
- [ ] `on` triggers fit the purpose; path/branch filters used effectively.
- [ ] `concurrency` set for critical/shared-resource workflows.
- [ ] Global `permissions` follow least privilege (`contents: read` default) with per-job overrides.
- [ ] Reusable workflows (`workflow_call`) used for common patterns.
- [ ] Logical organization with meaningful job/step names.

### Jobs and steps
- [ ] Jobs clearly named and represent distinct phases (build, lint, test, deploy).
- [ ] `needs` dependencies correctly ordered.
- [ ] `outputs` used for inter-job communication.
- [ ] `if` conditions used for conditional execution.
- [ ] All `uses` actions pinned to a full SHA or major tag — never `main`/`latest`.
- [ ] `run` commands efficient and clean (combined with `&&`, temp files removed).
- [ ] `env` defined at appropriate scope; no hardcoded sensitive data.
- [ ] `timeout-minutes` set on long-running jobs.

### Security
- [ ] Secrets accessed only via `secrets.*`; never hardcoded or printed.
- [ ] OIDC used for cloud auth where possible.
- [ ] `GITHUB_TOKEN` scope explicitly limited.
- [ ] SCA (dependency review) integrated.
- [ ] SAST (CodeQL or equivalent) integrated; critical findings block builds.
- [ ] Secret scanning enabled; pre-commit secret checks suggested.
- [ ] Container image signing/verification if images are used.
- [ ] Self-hosted runners hardened and network-restricted.

### Optimization
- [ ] Caching used for dependencies and build outputs; keys via `hashFiles`.
- [ ] `strategy.matrix` parallelizes tests/builds.
- [ ] `fetch-depth: 1` unless full history required.
- [ ] Artifacts used instead of rebuilding/refetching.

### Testing
- [ ] Unit tests run early in a dedicated job.
- [ ] Integration tests leverage `services`, run after unit tests.
- [ ] E2E tests run against staging with flakiness mitigation.
- [ ] Test reports published as checks/annotations and artifacts; coverage enforced.

### Deployment and reliability
- [ ] Staging/production use `environment` rules with protections and approvals.
- [ ] Rollback strategy in place and automated where possible.
- [ ] Deployment type appropriate to risk (rolling/blue-green/canary/dark launch).
- [ ] Post-deploy health checks / smoke tests implemented.

### Observability
- [ ] Adequate logging for debugging failures.
- [ ] Alerts for critical failures and deployment issues.
- [ ] Artifact `retention-days` configured appropriately.

## Troubleshooting

### Workflow not triggering / steps skipping
- Verify `on` matches the event; check `branches`/`tags`/`paths` filters (`*-ignore` takes precedence).
- For `workflow_dispatch`, the file must be on the default branch and required `inputs` provided.
- Review `if` conditions at workflow/job/step level; print `${{ toJson(github) }}` from a debug step.
- Check `concurrency` for a blocking in-progress run; check branch protection rules.

### Permissions errors ("Resource not accessible by integration")
- Review `permissions` at workflow and job level; grant only needed write scopes.
- Confirm secrets exist at the right scope (repo/org/environment) and names match exactly.
- For OIDC, verify the cloud trust policy trusts GitHub's OIDC issuer and the role has needed permissions.

### Caching issues (miss / not found)
- Validate `key`/`restore-keys`; a too-dynamic key always misses.
- Ensure the cached `path` matches where deps/artifacts actually live.
- Use `actions/cache/restore` with `lookup-only: true` to inspect keys; mind cache size limits.

### Long-running workflows / timeouts
- Profile the run summary to find the slowest jobs/steps.
- Combine `run` commands, clean temp files, install only what's needed.
- Improve caching; parallelize with matrix; choose larger/self-hosted runners; split workflows.

### Flaky tests (passes locally, fails in CI)
- Ensure test isolation and cleanup between tests.
- Replace `sleep` with explicit waits; add retries for transient external calls.
- Standardize CI vs local environment (versions, `services` containers).
- Use stable selectors (`data-testid`) for E2E; capture screenshots/video on failure.

### Deployment failures (app broken after deploy)
- Review deployment and application logs.
- Validate env vars/config injected into the target environment.
- Confirm all runtime dependencies are bundled/installed.
- Run post-deploy health checks; verify network connectivity between components.
- Roll back immediately on production degradation; diagnose in non-production.
