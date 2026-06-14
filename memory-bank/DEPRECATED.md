# ⛔ OBSOLETE — Memory Bank

**Status:** Deprecated as of 2026-06-14. Do not read or update anything in this folder.

This directory was the legacy Cline/Cursor-style "Memory Bank" — a set of markdown files
(`projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`,
`progress.md`, and `tasks/`) that an AI assistant re-read at the start of every session.

## Why it was retired

The project migrated from GitHub Copilot/Cursor to **Claude Code** and adopted Spec-Driven
Development (SDD). The memory bank's responsibilities are now split across better-fit, actively
maintained sources:

| Old memory-bank file | Replaced by |
|----------------------|-------------|
| `systemPatterns.md`, `techContext.md` | [`../architecture.md`](../architecture.md) + [`../overview.md`](../overview.md) (machine-readable context for agents) |
| `projectbrief.md`, `productContext.md` | [`../AGENTS.md`](../AGENTS.md) + the `requirements/` SDD specs |
| `progress.md`, `tasks/`, `tasks/_index.md` | [`../requirements/`](../requirements/) (per-feature `fr.md` / `design.md` / `task-*.md` / `checklist.md`) and its `_index.md` |
| Cross-session "memory" | Claude Code's persistent memory |

## Disposition

- The folder **remains tracked** in git and kept on disk for historical reference (so existing clones
  and the repo history retain it).
- It is excluded from Claude's context via `permissions.deny` `Read(./memory-bank/**)` in
  [`../.claude/settings.json`](../.claude/settings.json) — that is what keeps it out of Claude's reads,
  not git ignoring.

See [`../docs/claude-migration.md`](../docs/claude-migration.md) for the full migration record.
