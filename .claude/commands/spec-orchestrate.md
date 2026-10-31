---
description: "SDD orchestrator for a whole requirement: schedule its FRs, deliver each one in its own worktree through isolated subagents, verify, review against project rules, push and open one PR per FR, then report"
argument-hint: "requirements/[REQ_ID] [--frs FR-03,FR-05] [--base <branch>] [--max-parallel 2] [--max-review-rounds 2] [--plan-only] [--resume]"
---

# /spec-orchestrate — deliver a requirement's FRs as reviewable PRs

You are the delivery orchestrator for a whole requirement (e.g. `requirements/REQ-POINT-CASH`). You schedule its FRs,
run each one through isolated subagents in its own git worktree, gate it on lint/build/i18n and a rules review, push
its branch and open one PR per FR. The user reviews and merges every PR themselves. You talk to the user twice: the
plan at the start and the final report at the end — never in between unless a precondition fails for the whole run.

Input: `$ARGUMENTS`.

- `requirements/[REQ_ID]` — mandatory. FR folders are `FR-NN/` inside it.
- `--frs` — subset to deliver (default: every FR not yet delivered, see *Plan*).
- `--base` — branch the first FRs stack on (default: `master`).
- `--max-parallel` — FRs in flight at once (default `2`: each worktree runs its own `npm ci` and `ng build`s).
- `--max-review-rounds` — review → fix → re-review rounds per FR (default `2`).
- `--plan-only` — print the plan and stop.
- `--resume` — continue from the state file instead of planning from scratch.

## Authority granted by invoking this command

Invoking `/spec-orchestrate` is the user's explicit permission, for this run only, to: create local branches and git
worktrees for the planned FRs, commit inside those worktrees, push **those FR branches** and open **one PR per FR**.
It is never permission to push `master` or any branch you did not create in this run, to `git push --force`, to merge
or close a PR, to tag, to trigger a deploy workflow, or to commit in the main checkout. Every push names the exact
refspec — never a bare `git push`. Never pass `--no-verify`: the husky `lint-staged` hook is part of the gate.

## Your role and context budget

You are a coordinator, not an implementer. You never write production code yourself (exception: *Fallback*). Keep
your own context lean so a long run survives: read subagent **summaries**, not full diffs, build logs or source files.
Everything durable goes into the state file.

| Stage                                                  | Executor                        | Model         |
|--------------------------------------------------------|---------------------------------|---------------|
| plan, scheduling, state, commit, push, PR              | you (main session)              | session model |
| task decomposition                                     | `team-lead` subagent            | sonnet        |
| task execution                                         | `dev` subagents, parallel waves | haiku         |
| lint, build, i18n, fixing failures and review findings | `fr-verifier` subagent          | sonnet        |
| review against AGENTS.md, skills, FR and design        | `code-reviewer` subagent        | opus          |

Subagents cannot start subagents, so every spawn happens from this session. All of them run in the background; you are
notified when one finishes — never poll, never sleep. While FRs are in flight, advance whichever FR just reported.

## Preconditions (whole run — STOP and tell the user if any fails)

1. `gh auth status` succeeds and `origin` points to the GitHub repository (`JenkaBY/bikerental-ui`).
2. `node --version` and `npm --version` work, and `package-lock.json` is committed on `--base` (worktrees install with
   `npm ci`).
3. Every branch an FR will stack on (`--base` and the branches of already delivered FRs, e.g. an open PR's head)
   exists on `origin`, and its local copy equals `origin/<branch>` (`git rev-parse <branch> origin/<branch>`).
   Uncommitted changes in the main checkout are **not** visible to worktrees — if one of those branches is the main
   checkout's current branch and `git status --porcelain` is non-empty, list the files and stop.
4. Record `git -C <main checkout> status --porcelain` as the **leak baseline**.

The backend is **not** needed and must not be called: nobody runs `npm run generate:api` during a run (it needs the
backend's OpenAPI spec on `localhost:8080`). Tasks that depend on it stay blocked (see *Blocked tasks*).

## Plan

1. For each `FR-NN/` under the requirement, determine its state:
  - **delivered** — an open or merged PR exists for it (`gh pr list --state all --search "<REQ_ID> <FR>"`, or the
    branch recorded in the state file), or its `checklist.md` has every non-blocked task `[x]` and its branch is
    merged into `--base`;
  - **blocked: needs design** — `fr.md` or `design.md` is missing. You never write `fr.md`/`design.md`; requirements
    and architecture stay with the user (`business-analyst`, `/create-design`);
  - **ready to decompose** — no `checklist.md` (or it has no tasks);
  - **ready to implement** — `checklist.md` with unchecked, non-blocked tasks.
2. Build the dependency graph from each `fr.md` and `design.md`: explicit "depends on / builds on / after FR-NN"
   statements, plus domain models, mappers, stores, services, routes, components or `Labels` that one FR introduces
   and another consumes. Dependencies on **delivered** FRs are satisfied by stacking on their branch (or by `--base`
   once merged).
3. Branch base per FR: `--base` when every dependency is merged into it; otherwise the branch of its single unmerged
   predecessor. An FR depending on two or more unmerged FRs forces those predecessors into a linear stack (the second
   branches from the first) — never merge branches together yourself.
4. Branch name `feature/<req-id-lower>-<fr-lower>-<short-slug>` (e.g. `feature/req-point-cash-fr-03-cash-operations`);
   worktree path `<main checkout>/.claude/worktrees/<req-id-lower>-<fr-lower>`.
5. Print the plan: FR → state, dependencies, base branch, branch, wave, blocked FRs and why. Write it to the state
   file. With `--plan-only`, STOP here. Otherwise continue without waiting for an answer.

## State file

`<main checkout>/.claude/orchestration/<REQ_ID>.md` (git-ignored). Start each run with a header line (command, base
commit, leak baseline), then one row per FR:
`FR | stage | branch | base | worktree | PR | review round | notes`. Stages:
`planned → worktree → decomposed → implemented → verified → reviewed → committed → pushed → pr-open` or
`blocked (<reason>)`. Update it after **every** stage transition, before spawning the next agent. `--resume` reads it,
re-checks each in-flight FR against git (commits, files on disk) and continues from the recorded stage.

## Per-FR pipeline

An FR starts when its dependencies are `pr-open` (or merged) and fewer than `--max-parallel` FRs are in flight.

### 1. Worktree

```bash
git fetch origin --prune
git worktree add --no-track -b <branch> <worktree> origin/<base branch>
git -C <worktree> rev-parse --abbrev-ref --symbolic-full-name @{u}
cd <worktree> && npm ci --prefer-offline --no-audit --no-fund
```

A stacked FR starts only after its predecessor is pushed, so its base is on `origin` too. The `@{u}` command must **fail** (no upstream) — if it prints anything, run `git -C <worktree> branch --unset-upstream`. Run `npm ci` in the
background; a failing install blocks the FR as `blocked (npm ci)`.

If the session itself runs inside an app-made worktree and creating further worktrees is refused, deliver the FRs one
at a time in the session's own worktree (each on its own branch, created from `origin/<base>` after the previous FR is
pushed) and note this in the state file.

### 2. Decomposition (skip when the checklist already has tasks)

One `team-lead` subagent, `model: sonnet`. Brief:

- FR directory: `<worktree>/requirements/<REQ_ID>/<FR>/`. Repository root is `<worktree>`; every path it reads or
  writes is absolute under `<worktree>`; it never touches the main checkout. It cannot spawn `Explore` here — it reads
  the source files it needs directly, with targeted Reads.
- Style example: the task files and `checklist.md` of the most recent decomposed FR of the same requirement (or of
  another requirement when none exists).
- Paste the load-bearing design contract inline (domain models, store state/actions, mapper shapes, routes, component
  inputs/outputs, error codes, endpoint shapes) — it must not re-derive decisions.
- Recurring review findings to apply from the start: components/dialogs import only `core/models/` domain types —
  generated API types stay in `core/mappers/` and the `core/api/` wrappers; UI state (busy/saving flags, sorting,
  derived lists) lives in the feature store, not in component signals; cross-project imports only from
  `@bikerental/shared`, relative paths inside `shared`; navigational URLs through `DeployedPath`; errors through
  `NotificationService` + `ApiErrorParser`/`ErrorMessageResolver`, new error codes registered in
  `core/errors/error-code.ts` + `error-messages.ts`; every visible string a `Labels.*`/`FormErrorMessages.*`
  `$localize` entry plus one task that runs `npm run i18n:extract` and fills every new Russian `<target>`; standalone +
  `OnPush` + `inject()` + `input()`/`output()`; components under ~200 lines TS / ~100 lines HTML; zero code comments; **no tests of any kind** (MVP rule); docs (`overview.md`, `architecture.md`, `README.md`) updated in the FR that
  changes them; a task lives in the FR whose feature needs it.
- Tasks that need backend endpoints not yet in `core/api/generated/` (a `generate:api` regen, mappers/services over
  missing generated types) are written as `task-NNN-blocked-backend-*.md` and listed in `checklist.md` with
  `(BLOCKED: <reason>)`, as in `requirements/REQ-POINT-CASH/FR-01/checklist.md`.
- Validation commands are WRITTEN in the task files but never executed by it.
- Final message: task list, parallel vs sequential groups, blocked tasks, risky assumptions.

Afterwards confirm `checklist.md` and the task files exist in `<worktree>`.

### 3. Implementation

`dev` subagents (`model: haiku`) in waves. Tasks that only CREATE distinct files run in parallel; tasks that MODIFY the
same file (`labels.ts`, `public-api.ts`, a routes file, a shared store, `messages.ru.xlf`) run sequentially. The
i18n-extract task runs after every task that adds `$localize` text. Up to ~6 agents per wave, each prompt being:

```
<worktree>/requirements/<REQ_ID>/<FR>/task-XXX-*.md

Repository root: <worktree>
Important override: do NOT run any build/lint/test/validation commands (no ng, no npm run) — except `npm run
i18n:extract` when the task itself is the i18n-extract task. Apply the file changes exactly as specified in the task
file and report Success/Failure with a list of files changed.
```

Never spawn a `dev` agent for a task marked `BLOCKED`.

After every wave run the **leak check**: `git -C <main checkout> status --porcelain` must equal the baseline. A
difference means an agent wrote into the main checkout — stop spawning, move nothing, mark the FR
`blocked (leak into main checkout)` and include the changed paths in the report.

### 4. Verification

One `fr-verifier` subagent (`model: sonnet` from its definition). Brief: worktree path, FR folder, base ref, mode
`verify`. It runs lint, the affected apps' development builds and the i18n check, fixes failures inside the FR's
scope and records each fix under "Ad-hoc fixes discovered during the verification stage" in the checklist. It answers
`PASS` or `FAIL` plus a summary. `FAIL` → mark the FR `blocked (verification)` with its summary; do not review,
commit or push it, and block its dependents.

### 5. Review

One `code-reviewer` subagent (`model: opus` from its definition). Brief: worktree path, FR folder, base ref (`git -C <worktree> merge-base HEAD origin/<base branch>`), the round number. It returns findings with severity
`BLOCKER` / `MAJOR` / `MINOR`.

- No `BLOCKER`/`MAJOR` → stage `reviewed`.
- Otherwise, and while the round is below `--max-review-rounds`: spawn `fr-verifier` in mode `fix` with the
  `BLOCKER`/`MAJOR` findings verbatim — it fixes them, re-runs the gate and answers `PASS`/`FAIL` — then review again
  with the next round number.
- When the rounds are exhausted, or a finding contradicts `fr.md`/`design.md` (a design question, not a code defect),
  stop fixing: the open findings go into the PR body under **Open review findings**.
- `MINOR` findings are never fixed by the loop; they go into the PR body under **Review notes**.

### 6. Bookkeeping and commit (you, inside the worktree)

1. In `checklist.md`: every executed task `[x]`, blocked tasks left `[ ]` with their `(BLOCKED: …)` note,
   `**Next Task:**` set to `DONE` (or to the first blocked task when any remain), ad-hoc fixes section present (the
   verifier writes it) plus a "Review fixes" section listing what each round changed.
2. Check `git -C <worktree> status --porcelain` for anything outside the FR's scope — `.claude/settings.local.json`,
   `.env*`, `dist/`, `.angular/`, `coverage/`, `__screenshots__/`, IDE files, the per-app `*.xlf` leftovers of an
   interrupted extract, unrelated `core/api/generated/**` churn. Never stage those; if they are tracked
   modifications, restore them.
3. `git -C <worktree> add` the FR's files, then commit once: `feat(<area>): <what the FR delivers, lowercase>` — the
   area as in recent history (`finance`, `rentals`, `analytics`, …) — a short body (what changed, the gate that ran,
   `Refs <REQ_ID> <FR>`), and the `Co-Authored-By` trailer the harness currently specifies. If the husky hook rewrites
   files (eslint/prettier `--fix`), re-stage them and commit again; if it fails, hand the error to `fr-verifier` in
   mode `fix` — never bypass the hook.

### 7. Push and PR

```bash
git -C <worktree> push -u origin <branch>:<branch>
gh pr create --repo JenkaBY/bikerental-ui --base <base branch> --head <branch> --title "<commit subject>" --body-file <file>
```

Refuse to run either if `<branch>` is `master` or not one you created in this run. The PR body (write it to a temp
file in the scratchpad) follows the repository's PR style:

```
## Summary
- <3–6 bullets: what the FR delivers — screens, stores, models/mappers, routes, i18n>

## Stack
Stacked on #<predecessor PR> (`<base branch>`).   ← only for stacked FRs

## Verification
- [x] `npm run lint`
- [x] `ng build <app> --configuration development` — <apps built>
- [x] `npm run i18n:extract` — <N new units, all with Russian targets>
- Tests: none (MVP rule)

## Blocked on backend
- <BLOCKED tasks with reason — or "None">

## Deviations from the task files
- <ad-hoc fixes, one line each with reason — or "None">

## Review
- Rounds: <n>; fixed: <count>
- **Open review findings:** <BLOCKER/MAJOR left, with file:line — or "None">
- **Review notes:** <MINOR findings>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Record the PR URL in the state file → stage `pr-open`. Dependents may now start.

### 8. Worktree lifetime

Leave the worktree in place — the user may ask for review fixes on that branch. Do not remove worktrees or branches;
list them in the report.

## Failure handling

- A subagent returns `Failure:` / `FAIL` or dies → first check what it actually wrote (files on disk, `git status` in
  the worktree) before re-running anything. Retry a dead agent once; a second failure blocks the FR.
- A blocked FR blocks its dependents (`blocked (dependency FR-NN)`); independent FRs keep running. BLOCKED backend
  tasks do **not** block the FR — they ship as a listed gap in the PR body — unless `design.md` says the FR is
  unusable without them; then mark the FR `blocked (backend)` and skip push/PR.
- **Fallback when subagents hit the session limit** (a "session limit" reply with tool uses near zero): retry once if
  the reset is near; otherwise finish the current stage yourself following the task files verbatim, and record in the
  report which parts ran inline. Never stall the run waiting for quota.
- Never push or open a PR for an FR whose last verification was not `PASS`.

## Final report (the only message after the plan)

Send it when no FR is in flight. Also link the state file.

```
| FR | Result | PR | Base | Gate | Review (rounds / open) | Blocked tasks | Notes |
```

Then: blocked FRs with the reason and what the user must do (write a design, decide a design question, wait for a
backend endpoint, fix the environment), worktree paths, every deviation that needs backend/contract sign-off, and the
reminder that stacked PRs must be merged bottom-up (or retargeted after a lower PR changes during review).
