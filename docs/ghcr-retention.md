# GHCR retention policy — `bike-rental-ui`

Every merge to `master` publishes an immutable `ghcr.io/jenkaby/bike-rental-ui:sha-<7>` image. A
retention workflow keeps the package from growing without bound.

## What is deleted

After every successful publish (`Build and Deploy` on a push to `main`/`master`),
`.github/workflows/ghcr-cleanup.yml` deletes `sha-*` tagged and untagged versions **older than 4
weeks**. It uses `dataaxiom/ghcr-cleanup-action`, which is multi-arch aware: platform manifests of a
kept tag are never removed.

## What is never deleted

- `latest`, `v*`
- the environment tags `preview` and `prod`
- every other tag of an image that carries one of the above (so the `sha-<7>` currently on `preview`
  or `prod` stays pullable, however old it is)

## Environment tags

`build-and-deploy.yml` moves them with `docker buildx imagetools create` (no pull):

| Tag       | Moved when                                                              |
|-----------|-------------------------------------------------------------------------|
| `preview` | every publish on `main`/`master`                                        |
| `prod`    | the `disable_service_worker` kill switch publishes to production        |

Production is otherwise promoted by hand in `bike-rental`, which does not notify this repository. To
protect the version you promoted, move `prod` yourself:

```bash
docker buildx imagetools create --tag ghcr.io/jenkaby/bike-rental-ui:prod ghcr.io/jenkaby/bike-rental-ui:sha-<7>
```

## Safety guard

The cleanup **fails and deletes nothing** while `preview` or `prod` does not exist on the package.

## Manual run

Actions → *GHCR Cleanup* → *Run workflow*:

- `older_than` — default `4 weeks`
- `dry_run` — default `true`; lists candidates without deleting

## One-time setup

Package settings → *Manage Actions access* → give this repository the **Admin** role, otherwise
`GITHUB_TOKEN` cannot delete versions. Create `prod` once (command above) before the first run.

Do not use `actions/delete-package-versions`: it treats platform manifests as untagged versions and
deletes them from under live multi-arch tags.
