# CLAUDE.md

Guidance for Claude Code working in this repository. The canonical project conventions live in
`AGENTS.md` (imported below) — this file adds the Claude-specific workflow on top.

@AGENTS.md

---

## Active methodology: Spec-Driven Development (SDD)

This project delivers features **spec-first** using the `spec-workflow` toolkit (see
[README-spec-flow.MD](README-spec-flow.MD)). Requirements, designs, and tasks are written as
documents *before* code. A chain of subagents reads the previous step's output:

| Step | Subagent | Reads | Writes |
|------|----------|-------|--------|
| 1. Requirements | `business-analyst` | `architecture.md`, `overview.md` | `requirements/<REQ>/<FR>/fr.md` |
| 2. System design | `architect` | `fr.md`, `architecture.md`, `overview.md` | `requirements/<REQ>/<FR>/design.md` |
| 3. Task decomposition | `team-lead` | `fr.md`, `design.md`, source code | `task-*.md` + `checklist.md` |
| 4. Implementation | `dev-manager` | `checklist.md`, `task-*.md` | code via `dev` subagent + checklist progress |

Outputs land under `requirements/<REQ_ID>/<FR_INDEX>/`. Templates the subagents consume live in
`.spec-workflow/` (`fr_template.md`, `task_file_template.md`, `checklist_file_template.md`) — these
are technology-agnostic; do not edit them per-feature.

**Context files** (regenerate with the slash commands below, do not hand-maintain structure):
- `architecture.md` — system-level topology and how projects communicate (entry point for agents).
- `overview.md` — component-level detail, call sequences, data flow.

## Claude tooling in this repo

- **Subagents** (`.claude/agents/`): `business-analyst`, `architect`, `team-lead`, `dev-manager`,
  `dev`. Invoke with the Task tool (`subagent_type: <name>`) or `@<name>`. `dev-manager` delegates
  to `dev` via the Task tool; `dev` is a leaf executor and never spawns subagents.
- **Slash commands** (`.claude/commands/`): `/project-architecture`, `/component-overview`,
  `/create-store`, `/dev-manager-delegator`, `/todo`, `/update-task`, `/caveman`.
- **Skills** (`.claude/skills/`): auto-discovered, loaded on demand by description. Angular skills
  (component, signals, forms, http, routing, di, directives, testing, ssr, tooling,
  data-flow-orchestrator) plus `typescript-es2022`, `playwright-testing`, `github-actions`, and
  `skill-authoring` (how to write new skills).
- **MCP** (`.mcp.json`): the `angular-cli` server exposes Angular tools (`find_examples`,
  `get_best_practices`, `list_projects`, `onpush_zoneless_migration`, `search_documentation`). Use
  them to fetch the latest official Angular docs, examples, and best practices when working with
  Angular SDKs, and let that documentation guide design decisions.

## Enterprise Angular patterns (in addition to AGENTS.md)

- **Signal Store pattern** — class-based store: `private readonly _state = signal<T>(initial);`
  expose `readonly x = computed(() => this._state().x);` mutate via
  `update(patch: Partial<T>) { this._state.update(...) }`. Global stores (dictionaries, user
  prefs, auth) are `providedIn: 'root'`; feature stores are provided in the **parent component**
  `providers: []` so sibling tabs share one instance. Persist with `effect()` ↔ `localStorage`.
- **Smart vs dumb** — smart/page components own DI, router inputs, and store orchestration; dumb
  components use `input()`/`output()` + `OnPush` only. Keep components < 200 lines; push logic into
  services/stores.
- **Error handling layering** — success notifications in **components**; domain errors in **stores**
  via `catchError`; system errors (404/500) in a global `HttpInterceptor`.
- **Logging** — use a custom `LoggerService` with levels (DEBUG/INFO/WARN/ERROR); never log PII —
  log IDs and event context only.
- **Lifecycle & navigation** — `provideAppInitializer()` for non-blocking background data load
  (return `Promise.resolve()` immediately); enable `withComponentInputBinding()` and treat the URL
  as the source of truth for IDs; reset `pageIndex` to 0 in the store whenever filters/IDs change.

## Keep docs in sync with code

When a change adds/alters features, public APIs, CLI commands, config, or setup steps, update the
matching docs in the same change: `README.md`, `requirements/` specs, and the context files
(`architecture.md` / `overview.md`). Don't leave stale examples or undocumented breaking changes.

## Deprecated: `memory-bank/`

The legacy `memory-bank/` directory (Cline/Cursor-style "Memory Bank") is **obsolete** — see
[memory-bank/DEPRECATED.md](memory-bank/DEPRECATED.md). Do **not** read or update it. Its role is
replaced by `architecture.md` + `overview.md` (machine-readable context), the `requirements/` SDD
specs, and Claude's own persistent memory. The folder **remains tracked in git** for historical
reference but is excluded from Claude's context via `permissions.deny` in `.claude/settings.json`.

See [docs/claude-migration.md](docs/claude-migration.md) for the full Copilot/Cursor → Claude
migration record.
