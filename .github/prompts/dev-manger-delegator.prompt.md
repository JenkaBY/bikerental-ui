---
agent: 'dev-manager'
name: dev-manager-delegator
description: This prompt is used to ask dev-manager delegate work to a `dev` agent.
---

INPUT: the reference to a checklist.md file with the list of tasks to be done.

CONSTRAINT: Don't start without the link to checklist.md

Delegate the tasks to a developer and control their completion. Iterate until all tasks from this list are done.