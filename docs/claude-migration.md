# AI Assistant Migration: GitHub Copilot/Cursor → Claude Code

**Date:** 2026-06-14

This repository's AI-assistant configuration was migrated from **GitHub Copilot** and **Cursor** to
**Claude Code**. Copilot/Cursor config was adapted into Claude-native equivalents, the legacy
"memory bank" was retired, and the active development methodology — **Spec-Driven Development
(SDD)** — was preserved and is now driven by Claude subagents. No application/source code changed.

## Migration decisions

1. **Deprecated configs** remain **tracked in git** for historical reference (so the repo, existing
   clones, and history retain them). They are kept out of Claude's context solely via
   `permissions.deny` `Read(...)` rules in `.claude/settings.json` — not by git-ignoring them.
2. **`CLAUDE.md` imports `AGENTS.md`** (`@AGENTS.md`) so `AGENTS.md` remains the single cross-tool
   source of truth, with Claude-specific additions layered on top.
3. **Skills were copied** (not moved) from `.github/skills/` to `.claude/skills/`; the originals and
   `skills-lock.json` are left intact.

## What was created (Claude config)

| File / folder | Purpose |
|---------------|---------|
| `CLAUDE.md` | Project entry point for Claude; imports `@AGENTS.md`, documents the SDD chain, subagents/commands/skills/MCP, enterprise Angular patterns, and the memory-bank deprecation. |
| `.mcp.json` | Project MCP servers — `angular-cli` (Angular CLI MCP), migrated from `.vscode/mcp.json`. |
| `.claude/settings.json` | Permissions allowlist for common npm commands + `deny` `Read(...)` rules excluding retired configs from context. |
| `.claude/agents/` | 5 subagents: `business-analyst`, `architect`, `team-lead`, `dev-manager`, `dev`. |
| `.claude/commands/` | 7 slash commands: `project-architecture`, `component-overview`, `create-store`, `dev-manager-delegator`, `todo`, `update-task`, `caveman`. |
| `.claude/skills/` | 11 Angular skills copied verbatim + 4 created: `typescript-es2022`, `playwright-testing`, `github-actions`, `skill-authoring`. |
| `memory-bank/DEPRECATED.md` | Obsolescence marker for the legacy memory bank. |
| `docs/claude-migration.md` | This document. |

## Old → new mapping

| Old (Copilot/Cursor) | New (Claude) | Notes |
|----------------------|--------------|-------|
| `.github/copilot-instructions.md` | `CLAUDE.md` (+ `@AGENTS.md`) | Always-on rules now in AGENTS.md; enterprise-rules delta + MCP reminder folded into CLAUDE.md. |
| `AGENTS.md` | `AGENTS.md` (kept) | Canonical; stale `memory-bank/*` "Key Files" rows redirected to `architecture.md`/`overview.md`/`requirements/_index.md`. |
| `.github/agents/*.agent.md` (5) | `.claude/agents/*.md` (5) | Copilot tool lists → Claude tools; dropped Copilot `model:`/`agents:` keys; `runSubagent` → Task tool; Gradle/.NET examples → npm in `dev`. |
| `.github/prompts/*.prompt.md` (7) | `.claude/commands/*.md` (7) | `{project}`/`{path}` placeholders → `$1`/`$ARGUMENTS`; `runSubagent` → Explore via Task tool; `dev-manger`→`dev-manager` typo fixed. |
| `.github/skills/<n>/SKILL.md` (11) | `.claude/skills/<n>/SKILL.md` (11) | Copied verbatim (format is identical). |
| `.github/instructions/typescript-5-es2022.instructions.md` | `.claude/skills/typescript-es2022/` | Converted to on-demand skill. |
| `.github/instructions/playwright-typescript.instructions.md` | `.claude/skills/playwright-testing/` | Converted to on-demand skill. |
| `.github/instructions/github-actions-ci-cd-best-practices.instructions.md` | `.claude/skills/github-actions/` | Condensed SKILL.md + `references/` deep-dive. |
| `.github/instructions/agent-skills.instructions.md` | `.claude/skills/skill-authoring/` | Converted to a skill-authoring guide. |
| `.github/instructions/angular.instructions.md` | `AGENTS.md` + `CLAUDE.md` enterprise patterns | Folded into existing always-on docs and the Angular skills. |
| `.github/instructions/update-docs-on-code-change.instructions.md` | `CLAUDE.md` "Keep docs in sync" | Folded as a guideline. |
| `.github/instructions/angular-material-design.instructions.md` | — (deprecated, not migrated) | Skipped per decision. |
| `.cursor/rules/angular-material-20.mdc` | — (deprecated, not migrated) | Skipped per decision. |
| `.github/instructions/memory-bank.instructions.md.DISABLED` | — (deprecated) | Already disabled; memory bank retired. |
| `.vscode/mcp.json` (`"servers"`) | `.mcp.json` (`"mcpServers"`) | Schema key differs between tools. |
| `memory-bank/` | `architecture.md` / `overview.md` / `requirements/` / Claude memory | Marked obsolete; kept tracked. |

## Deprecated (kept tracked, excluded from Claude's context)

`.github/copilot-instructions.md`, `.github/instructions/`, `.github/prompts/`, `.github/agents/`,
`.cursor/`, `.vscode/mcp.json`, and `memory-bank/`.

These remain **tracked in git** for historical reference. They are excluded from Claude's reads
**only** via `permissions.deny` `Read(...)` rules in `.claude/settings.json` — they are *not*
git-ignored, so existing clones and repo history keep them intact.

**Kept and untouched:** `.github/skills/` (originals), `skills-lock.json`, `.github/workflows/`,
`.github/CODEOWNERS`, `.spec-workflow/` (tech-agnostic SDD templates), `requirements/`,
`architecture.md`, `overview.md`.

## Active methodology: SDD (confirmed)

Spec-Driven Development via the `spec-workflow` toolkit remains the project's methodology. The 4-step
chain (`business-analyst` → `architect` → `team-lead` → `dev-manager`/`dev`) now runs as Claude
subagents instead of the VS Code "Agents" dropdown. Templates live in `.spec-workflow/`; outputs land
under `requirements/<REQ_ID>/<FR_INDEX>/`. See [`../README-spec-flow.MD`](../README-spec-flow.MD) and
[`../CLAUDE.md`](../CLAUDE.md).

## Notes & follow-ups

- **No native `.claudeignore`.** Claude Code does not honor a `.claudeignore` file; context exclusion
  is done with `permissions.deny` `Read(...)` rules in `.claude/settings.json` (plus `.gitignore` for
  git). This is why no `.claudeignore` was created.
- **Subagent interactivity.** Claude subagents run non-interactively, so the `business-analyst`'s
  "ask the user / get approval" steps now return questions to the orchestrator, which relays them to
  the user (documented in the agent file).
- **Regenerate context files.** `architecture.md` and `overview.md` still list `memory-bank/` in their
  folder maps. Regenerate them with `/project-architecture` and `/component-overview` to reflect the
  new `.claude/` layout and drop the memory-bank entry.
- **Skill duplication.** The Angular skills now exist in both `.github/skills/` (vendored, tracked via
  `skills-lock.json`) and `.claude/skills/` (Claude-discovered). Keep them in sync when updating, or
  consolidate later if Copilot support is fully dropped.
