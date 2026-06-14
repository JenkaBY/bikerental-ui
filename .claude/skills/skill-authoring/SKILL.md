---
name: skill-authoring
description: How to author high-quality, portable Agent Skills for this repo (SKILL.md format, description triggers, progressive loading, bundling references/scripts/assets/templates). Use when creating a new skill, editing an existing skill, or fixing a skill that never activates.
---

# Authoring Agent Skills

Agent Skills are self-contained folders with instructions and bundled resources that teach the agent
specialized capabilities. Unlike always-on project instructions, skills load **on demand** when a
task matches their description.

Key characteristics: portable, progressively loaded, resource-bundled, and activated automatically
based on prompt relevance.

## Location

Place project skills in `.claude/skills/<skill-name>/`. Each skill **must** have its own
subdirectory containing at minimum a `SKILL.md`. (Personal, user-wide skills live in
`~/.claude/skills/<skill-name>/`.)

## Required SKILL.md frontmatter

```yaml
---
name: webapp-testing
description: Toolkit for testing local web apps with Playwright. Use when asked to verify frontend
  functionality, debug UI behavior, capture screenshots, or view browser console logs.
---
```

| Field         | Required | Constraints |
|---------------|----------|-------------|
| `name`        | Yes      | Lowercase, hyphens for spaces, ≤ 64 chars; should match the folder name. |
| `description` | Yes      | Clear statement of capabilities AND when to use, ≤ 1024 chars. |

### The description is everything

The agent reads ONLY `name` and `description` to decide whether to load a skill. A vague description
means the skill never activates. Include:

1. **WHAT** the skill does (capabilities).
2. **WHEN** to use it (specific triggers, scenarios, file types, user requests).
3. **Keywords** users would actually mention.

- Good: "Toolkit for testing local web apps with Playwright. Use when asked to verify frontend
  functionality, debug UI behavior, capture screenshots, check visual regressions, or view console logs."
- Poor: "Web testing helpers." (no triggers, no keywords, no capabilities)

## Body content

Loaded after the skill activates. Recommended sections: a short title/overview, **When to Use This
Skill**, **Prerequisites**, **Step-by-Step Workflows**, **Troubleshooting**, **References**.

Writing style: imperative mood ("Run", "Create"), specific and actionable, exact commands, scannable
sections. Keep `SKILL.md` under ~500 lines — split large or >5-step content into `references/`.

## Progressive loading

| Level | What loads | When |
|-------|------------|------|
| 1. Discovery | `name` + `description` | always (lightweight metadata) |
| 2. Instructions | full `SKILL.md` body | when the request matches the description |
| 3. Resources | scripts, references, templates | only when referenced |

So you can keep many skills installed cheaply; only relevant content loads per task.

## Bundling resources

| Folder | Purpose | Loaded into context? |
|--------|---------|----------------------|
| `references/` | docs the agent reads to inform decisions | yes, when referenced |
| `scripts/` | executable automation | when executed |
| `assets/` | static files used **as-is** in output (logos, fonts, templates copied unchanged) | no |
| `templates/` | starter code/scaffolds the agent **modifies** | yes, when referenced |

Rule of thumb: if the agent reads and builds upon the file → `templates/`; if used unchanged in
output → `assets/`. Reference resources with relative paths, e.g.
`See [API reference](references/api_reference.md)` or `Run [helper](scripts/helper.py)`.

When bundling scripts: prefer cross-platform languages (Python, pwsh, Node), include `--help`/usage,
handle errors clearly, use relative paths, and never store credentials or secrets.

## Validation checklist

- [ ] Valid frontmatter with `name` and `description`.
- [ ] `name` lowercase-with-hyphens, ≤ 64 chars, matches folder.
- [ ] `description` states WHAT, WHEN, and relevant KEYWORDS.
- [ ] Body covers when-to-use, prerequisites, and step-by-step workflows.
- [ ] `SKILL.md` under ~500 lines; large/>5-step content split into `references/`.
- [ ] Scripts include help and error handling; relative paths used; no hardcoded secrets.
