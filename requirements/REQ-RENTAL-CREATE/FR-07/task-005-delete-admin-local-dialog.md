# Task 005: Delete Admin's Local `TopUpDialogComponent` Files

> **Applied Skill:** N/A — File deletion only. The component has been superseded by the shared library version created in task-001.

> **⚠️ Prerequisite:** Requires **task-001**, **task-002**, and **task-004** to be completed first. The admin build must pass after task-004 before deleting.

## 1. Objective

Remove the two files that constituted the admin-specific `TopUpDialogComponent`. After task-004 updates the only consumer (`CustomerAccountComponent`) to import from `@bikerental/shared`, these files become dead code and must be deleted to avoid confusion.

## 2. Files to Delete

| File                                                                                     | Action     |
|------------------------------------------------------------------------------------------|------------|
| `projects/admin/src/app/customers/dialogs/top-up-dialog/top-up-dialog.component.ts`      | **Delete** |
| `projects/admin/src/app/customers/dialogs/top-up-dialog/top-up-dialog.component.spec.ts` | **Delete** |

Run the following commands in the workspace root:

```bash
rm projects/admin/src/app/customers/dialogs/top-up-dialog/top-up-dialog.component.ts
rm projects/admin/src/app/customers/dialogs/top-up-dialog/top-up-dialog.component.spec.ts
```

> **Note for Windows:** Use `del` or the VS Code Explorer context menu "Delete" action instead of `rm` if the shell does not support POSIX commands.

## 3. Code Implementation

No code changes — file deletion only.

## 4. Validation Steps

skip
