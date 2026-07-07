---
description: "SDD orchestrator: deliver one FR end-to-end by delegating decomposition and implementation to subagents (sonnet → haiku dev waves), then verify and commit"
argument-hint: "requirements/[REQ_ID]/[FR] [--branch feature/name] [--base <branch>] [--decomposer-model sonnet|opus] [--no-commit]"
---

# /spec-delegate — delegate one FR to subagents

You are the delivery orchestrator for ONE functional requirement. You do not write production code yourself unless a
subagent is unavailable (see Fallback). Input: `$ARGUMENTS` — the FR folder (e.g. `requirements/AGR-001/FR-03`),
optionally `--branch`/`--base`/`--decomposer-model`/`--no-commit`.

## Preconditions (verify before spawning anything)

1. `fr.md` and `design.md` exist in the FR folder. If missing — STOP and tell the user to run `/spec-requirements` /
   `/spec-design` first (or offer to produce them yourself in this session; the main-session model owns architecture).
2. Working tree contains no unrelated uncommitted changes you might sweep into the commit.
3. Git branch: create `--branch` (default `feature/<req-id>-<fr>`), stacked on `--base` (default: current HEAD).

## Stage 1 — Task decomposition (ONE `general-purpose` subagent, model **sonnet** by default)

Model: `--decomposer-model` if given, else **sonnet**. Decomposition is mechanical translation of an already-written
`design.md` into task files — the design contract is pasted inline, so no architectural reasoning is required.
Escalate to **opus** only if sonnet decompositions produce a growing "Ad-hoc fixes" section in `checklist.md` at
Stage 3/4 (that section is the decomposition-quality metric — compare it across FRs).

Spawn a single agent with a prompt built from this checklist — every bullet becomes an explicit instruction:

- Read, in order: `.claude/commands/spec-tasks.md` (process; forbid it from executing builds), the two templates in
  `.spec-workflow/`, the FR's `fr.md` + `design.md`, ALL files in `.claude/rules/` matching the touched paths, and one
  recent task file + checklist from a completed FR as a style example.
- Give it an EXPLICIT file list of the current sources it will prescribe edits for — targeted Reads, not broad exploration; opus agents
  have died from budget exhaustion during unguided exploration.
- Paste the load-bearing design contract inline (table schemas, ordered service steps, error codes, endpoint shapes) —
  the agent must not re-derive decisions.
- Require: one file created/modified per task; exact imports + copy-paste snippets + insertion locations; validation
  commands WRITTEN but not executed; zero inline comments in Java; checklist.md in execution order; final message =
  task list + parallelizable vs sequential groups + risky assumptions.

## Stage 2 — Implementation (parallel `dev` subagents, model **haiku**)

- Build waves from the opus agent's dependency groups. Tasks that only CREATE distinct files are safe to parallelize;
  serialize only tasks that MODIFY the same file (master changelog, advice, controller, DbSteps).
- Spawn up to ~6 dev agents per wave. Each prompt is EXACTLY:

  ```
  <absolute path to task-XXX-*.md>

  Important override: do NOT run any build/test/validation commands (no gradle). Apply the file changes exactly as
  specified in the task file and report Success/Failure with a list of files changed.
  ```

- Wait for the whole wave before launching dependents. Do not re-implement what an agent already applied — if an agent
  dies mid-task, first CHECK whether the file was already written before redoing it.
- No intermediate builds between tasks (per project agreement) — compilation happens once at Stage 3.

## Stage 3 — Verification (you, in this session)

1. perform verification on the last slice step. The apps must pass lint, build.

## Stage 4 — Bookkeeping and commit

1. Mark every task `[x]` in `checklist.md`; append an "Ad-hoc fixes discovered during the test stage" section listing
   every change made outside the task files, with one-line reasons.
2. If code review feedback (FIXME comments) was addressed, list those refactors in the checklist too and check whether
   a rule in `.claude/rules/` should be extended — propose the rule change in the same commit.
3. Commit everything belonging to the FR (SDD docs + code + tests) to the FR branch with a message describing the
   feature (not the process); exclude local-only files. Skip when `--no-commit`.
4. Report: branch, commit, test results, deviations from task files, anything requiring frontend/contract sign-off.

## Fallback when subagents hit the session limit

A limit-hit agent returns a "session limit" message with tool_uses near zero. Then: (a) check what it managed to write,
(b) retry ONCE later if the reset is near, otherwise (c) continue the stage YOURSELF in this session following the same
task files verbatim — never stall the FR waiting for quota. Record in the final report which parts ran inline.

## Model assignment

| Stage                                             | Executor                        | Model                                                                     |
|---------------------------------------------------|---------------------------------|---------------------------------------------------------------------------|
| fr.md / design.md, failure analysis, ad-hoc fixes | main session                    | (session model)                                                           |
| task decomposition                                | `general-purpose` subagent      | sonnet (default; `--decomposer-model opus` if Ad-hoc fixes sections grow) |
| task execution                                    | `dev` subagents, parallel waves | haiku (fixed)                                                             |
