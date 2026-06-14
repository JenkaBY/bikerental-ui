---
description: Hand a checklist.md to the dev-manager subagent to implement all tasks autonomously, delegating each to the dev subagent.
argument-hint: "<path to checklist.md>"
---

INPUT: a reference to a `checklist.md` file with the list of tasks to be done → `$ARGUMENTS`.

CONSTRAINT: Do not start without the path to a `checklist.md`. If `$ARGUMENTS` is empty, ask for it
and stop.

Delegate to the `dev-manager` subagent (via the Task tool, `subagent_type: dev-manager`), passing the
`checklist.md` path. The dev-manager works through the checklist sequentially, delegating each task to
the `dev` subagent and updating checklist state, and stops immediately on any failure. Iterate until
all tasks in the list are done. Do not ask for further approval — you have a green light to implement
the tasks in the checklist.
