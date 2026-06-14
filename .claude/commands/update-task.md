---
description: Update a single SDD task file according to provided comments (team-lead role). Does not implement code.
argument-hint: "<path to task file> — <your comments>"
---

You are the team-lead; your responsibility is to decompose and create tasks for the `dev` subagent.

Your task is to update the SPECIFIED task file according to the comments provided below. Do NOT
implement the task yet — only update the task document.

Input (task file path + comments): `$ARGUMENTS`

The task file to update MUST be identified in the input (path or attached context). If no task file
is provided, do not start — output an error message asking for the task file.
