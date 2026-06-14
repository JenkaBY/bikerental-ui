# TASK026 - Admin: Rental History Page

**Status:** Pending  
**Added:** 2026-03-24  
**Updated:** 2026-03-24  
**Depends on:** TASK003  
**Blocks:** None

## Original Request

Rental History page: paginated list with filters by status (and customerId/equipmentUid). Edit rental dialog supported (status transitions via JSON Patch).

## Thought Process

- API supports filters: status, customerId, equipmentUid — no date range filter available
- Paginated via `mat-paginator`
- Edit dialog: fetches full `RentalResponse` via `RentalService.getById()`, allows status transitions via JSON Patch (`/status` path)
- Status transitions: DRAFT→ACTIVE, ACTIVE→COMPLETED, ACTIVE→CANCELLED
- Follows TASK007 paginated equipment pattern

## Implementation Plan

- 26.1 RentalHistoryComponent — paginated table + filters (status, customerId, equipmentUid)
- 26.2 RentalDialogComponent — view/edit dialog with status transition select
- 26.3 Labels / error messages
- 26.4 Unit tests

## Progress Tracking

**Overall Status:** In Progress — 50%

### Subtasks

| ID   | Description            | Status      | Updated    | Notes |
|------|------------------------|-------------|------------|-------|
| 26.1 | RentalHistoryComponent | Complete    | 2026-03-24 |       |
| 26.2 | RentalDialogComponent  | Complete    | 2026-03-24 |       |
| 26.3 | Labels                 | Complete    | 2026-03-24 |       |
| 26.4 | Unit tests             | Not Started | 2026-03-24 |       |

## Progress Log

### 2026-03-24

- Task created, split from TASK009
- Implemented RentalHistoryComponent and RentalDialogComponent

