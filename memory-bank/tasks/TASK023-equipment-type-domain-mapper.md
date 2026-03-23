# TASK023 - EquipmentType Domain Model + Mapper

**Status:** Completed  
**Added:** 2026-03-23  
**Updated:** 2026-03-23, 2026-03-23 (implementation completed)  
**Depends on:** TASK005 (equipment type CRUD complete), TASK015 (domain/mappers pattern established)  
**Blocks:** TASK018 (TariffDialogData.types must use EquipmentType)  
**Related:** TASK008 (tariff domain)

## Original Request

Apply the Backend → Response → Mapper → Domain → UI pattern to the Equipment Type domain.
Currently `EquipmentTypeListComponent`, `EquipmentTypeDialogComponent`, and `TariffDialogData` all
import and use `EquipmentTypeResponse` directly from `core/models/`. This task introduces
`EquipmentType` (domain), `EquipmentTypeMapper`, and updates all consumers to the domain type.

## Thought Process

TASK005 predates the mapper pattern — it was implemented before the architecture decision was made.
This task is a **targeted refactoring** of existing working code, following the same structure
established in TASK015 for Tariff.

### Why this is needed before TASK018

`TariffDialogData` has:
```typescript
types: EquipmentTypeResponse[];   // ← raw API type leaking into a dialog interface
```
Once TASK023 is done it becomes:
```typescript
types: EquipmentType[];           // ← clean domain type
```

### API types (no change — stay in core/models/)

```typescript
// Already exists in core/models/equipment-type.model.ts
interface EquipmentTypeRequest        { slug, name?, description? }
interface EquipmentTypeUpdateRequest  { name?, description? }
interface EquipmentTypeResponse       { slug, name, description? }
```

### Domain types (new — core/domain/equipment-type.model.ts)

```typescript
export interface EquipmentType {       // read — what list/selects display
  slug: string;
  name: string;
  description?: string;
}

export interface EquipmentTypeWrite {  // create AND update — slug always present
  slug: string;                        // mandatory; used as path param on update, in body on create
  name?: string;
  description?: string;
}
```

`slug` is immutable after creation. For the update path the mapper sends `slug` as the URL path parameter
and omits it from the request body. The dialog always works with one type: `slug` field is enabled in
create mode and disabled (read-only) in edit mode.

### Mapper (core/mappers/equipment-type.mapper.ts)

```typescript
export class EquipmentTypeMapper {
  static fromResponse(r: EquipmentTypeResponse): EquipmentType {
    return { slug: r.slug, name: r.name, description: r.description };
  }

  static toCreateRequest(w: EquipmentTypeWrite): EquipmentTypeRequest {
    return { slug: w.slug, name: w.name, description: w.description };
  }

  static toUpdateRequest(w: EquipmentTypeWrite): EquipmentTypeUpdateRequest {
    return { name: w.name, description: w.description };  // slug → path param only, not in body
  }
}
```

### Updated EquipmentTypeService method signatures

```typescript
getAll(): Observable<EquipmentType[]>
create(write: EquipmentTypeWrite): Observable<EquipmentType>
update(write: EquipmentTypeWrite): Observable<EquipmentType>   // write.slug → path param
```

Service applies mapper internally, with **lazy `shareReplay(1)` cache** on `getAll()`:
```typescript
private readonly allTypes$ = defer(() =>
  this.http.get<EquipmentTypeResponse[]>(this.baseUrl)
    .pipe(map(list => list.map(EquipmentTypeMapper.fromResponse)))
).pipe(shareReplay(1));

getAll(): Observable<EquipmentType[]> {
  return this.allTypes$;
}

create(write: EquipmentTypeWrite): Observable<EquipmentType> {
  return this.http.post<EquipmentTypeResponse>(this.baseUrl, EquipmentTypeMapper.toCreateRequest(write))
    .pipe(map(EquipmentTypeMapper.fromResponse));
}

update(write: EquipmentTypeWrite): Observable<EquipmentType> {
  return this.http.put<EquipmentTypeResponse>(
    `${this.baseUrl}/${write.slug}`,           // slug as path param
    EquipmentTypeMapper.toUpdateRequest(write)  // body has only name/description
  ).pipe(map(EquipmentTypeMapper.fromResponse));
}
```

### Component changes

**`EquipmentTypeListComponent`**:
- `types = signal<EquipmentType[]>([])` — import from `core/domain/`
- `loadTypes()` receives `EquipmentType[]` directly
- `openEditDialog(type: EquipmentType)` — parameter type changes from `EquipmentTypeResponse` to `EquipmentType`
- `EquipmentTypeDialogData.type?: EquipmentType` (reflects dialog change below)

**`EquipmentTypeDialogComponent`**:
- `EquipmentTypeDialogData.type?: EquipmentType` — updated to domain type
- Form always typed as `EquipmentTypeWrite` — `slug` field **disabled** in edit mode (immutable), **enabled** in create mode
- `save()` builds one `EquipmentTypeWrite` for both create and update:
  ```typescript
  const write: EquipmentTypeWrite = this.form.getRawValue(); // getRawValue() includes disabled slug
  const call$ = this.isCreate
    ? this.service.create(write)
    : this.service.update(write);   // service uses write.slug as path param
  ```
- Remove `EquipmentTypeRequest`, `EquipmentTypeUpdateRequest`, and `EquipmentTypeUpdate` imports

## Implementation Plan

### Files to create

1. **`src/app/core/domain/equipment-type.model.ts`**
   - `EquipmentType` + `EquipmentTypeWrite` interfaces (no `EquipmentTypeUpdate` — single write type)

2. **`src/app/core/mappers/equipment-type.mapper.ts`**
   - `EquipmentTypeMapper` with `fromResponse`, `toCreateRequest(w: EquipmentTypeWrite)`, `toUpdateRequest(w: EquipmentTypeWrite)`

### Files to modify

3. **`src/app/core/domain/index.ts`** — add `export * from './equipment-type.model'`

4. **`src/app/core/mappers/index.ts`** — add `export * from './equipment-type.mapper'`

5. **`src/app/core/api/equipment-type.service.ts`**
   - Import `EquipmentType`, `EquipmentTypeWrite` from `core/domain` (no `EquipmentTypeUpdate`)
   - Import `EquipmentTypeMapper` from `core/mappers`
   - `update(write: EquipmentTypeWrite)` — extracts `write.slug` as path param internally

6. **`src/app/features/admin/equipment-types/equipment-type-list.component.ts`**
   - Change import: `EquipmentType` from `core/domain` (remove `EquipmentTypeResponse` from `core/models`)
   - Update `types` signal type and `openEditDialog` parameter type

7. **`src/app/features/admin/equipment-types/equipment-type-dialog.component.ts`**
   - Change `EquipmentTypeDialogData.type` to `EquipmentType`
   - Form typed as `EquipmentTypeWrite`; `slug` control disabled in edit mode
   - `save()` calls `service.create(write)` or `service.update(write)` — no separate slug argument
   - Remove `EquipmentTypeRequest`, `EquipmentTypeUpdateRequest`, `EquipmentTypeUpdate` imports

8. **`src/app/core/api/equipment-type.service.spec.ts`**
   - Update mock `EquipmentTypeResponse` in HTTP flush → keep as `EquipmentTypeResponse` in flush
   - Update expected return values to `EquipmentType` domain shape (same fields, no conversion needed)

9. **`src/app/features/admin/equipment-types/equipment-type-list.component.spec.ts`**
   - Update mock data from `EquipmentTypeResponse` → `EquipmentType`

10. **`src/app/features/admin/equipment-types/equipment-type-dialog.component.spec.ts`**
    - Update `MAT_DIALOG_DATA.type` from `EquipmentTypeResponse` → `EquipmentType`

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID    | Description                                                  | Status      | Updated    | Notes |
|-------|--------------------------------------------------------------|-------------|------------|-------|
| 23.1  | Create EquipmentType + EquipmentTypeWrite in core/domain/ (no EquipmentTypeUpdate) | Not Started | 2026-03-23 | single write type covers both create and update |
| 23.2  | Create EquipmentTypeMapper in core/mappers/                  | Not Started | 2026-03-23 | toCreateRequest + toUpdateRequest both accept EquipmentTypeWrite |
| 23.3  | Update domain/index.ts + mappers/index.ts exports            | Not Started | 2026-03-23 |       |
| 23.4  | Update EquipmentTypeService (domain types + mapper)          | Not Started | 2026-03-23 | update(write) uses write.slug as path param |
| 23.5  | Update EquipmentTypeListComponent (EquipmentType signal)     | Not Started | 2026-03-23 |       |
| 23.6  | Update EquipmentTypeDialogComponent (single EquipmentTypeWrite for create + update) | Not Started | 2026-03-23 | getRawValue() gives slug even when disabled |
| 23.7  | Update equipment-type.service.spec.ts                        | Not Started | 2026-03-23 |       |
| 23.8  | Update equipment-type-list/dialog component specs            | Not Started | 2026-03-23 |       |
| 23.9  | Update TariffDialogData.types: EquipmentType[] (TASK018 prerequisite) | Not Started | 2026-03-23 | superseded: types removed from dialog data in TASK024 |
| 23.10 | Add `shareReplay(1)` lazy cache to `EquipmentTypeService.getAll()`     | Not Started | 2026-03-23 | required by TASK024 EquipmentTypeDropdown |

### Updated Subtasks

| ID    | Description                                                        | Status    | Updated    | Notes                                                                                                  |
|-------|--------------------------------------------------------------------|-----------|------------|--------------------------------------------------------------------------------------------------------|
| 23.1  | Create EquipmentType + EquipmentTypeWrite in core/domain/          | Completed | 2026-03-23 | Added `src/app/core/domain/equipment-type.model.ts` and exported in `core/domain/index.ts`             |
| 23.2  | Create EquipmentTypeMapper in core/mappers/                        | Completed | 2026-03-23 | Added `src/app/core/mappers/equipment-type.mapper.ts` and `core/mappers/index.ts`                      |
| 23.3  | Update domain/index.ts + mappers/index.ts exports                  | Completed | 2026-03-23 | Exports added                                                                                          |
| 23.4  | Update EquipmentTypeService (domain types + mapper)                | Completed | 2026-03-23 | Modified `src/app/core/api/equipment-type.service.ts` to use domain types and mapper; added lazy cache |
| 23.5  | Update EquipmentTypeListComponent (EquipmentType signal)           | Completed | 2026-03-23 | Modified `equipment-type-list.component.ts` to use domain types                                        |
| 23.6  | Update EquipmentTypeDialogComponent (single EquipmentTypeWrite)    | Completed | 2026-03-23 | Modified `equipment-type-dialog.component.ts` to use domain types and write object                     |
| 23.7  | Update equipment-type.service.spec.ts                              | Completed | 2026-03-23 | Tests updated to expect domain outputs and new signatures                                              |
| 23.8  | Update equipment-type-list/dialog component specs                  | Completed | 2026-03-23 | Tests updated to use domain types                                                                      |
| 23.10 | Add `shareReplay(1)` lazy cache to `EquipmentTypeService.getAll()` | Completed | 2026-03-23 | Implemented in service using `defer` + `shareReplay(1)`                                                |

## Progress Log

### 2026-03-23

- Task created: EquipmentType domain/mapper refactoring to unblock TASK018's TariffDialogData
- TASK005 predates the mapper pattern — this task retrofits the pattern on completed work
- Structural change only: EquipmentType domain fields are identical to EquipmentTypeResponse (no Date conversions)
- TASK018 dependency updated to include TASK023
- **Decision**: single `EquipmentTypeWrite` replaces separate `EquipmentTypeWrite` + `EquipmentTypeUpdate` — `slug` is always required and present; on update it becomes the URL path param via `write.slug`; dialog re-uses same type with `slug` control disabled in edit mode

---

## Final Progress Entry

### 2026-03-23 (Completed)

- Implemented `EquipmentType` (domain) and `EquipmentTypeWrite` in `src/app/core/domain/equipment-type.model.ts` and exported via `core/domain/index.ts`.
- Implemented `EquipmentTypeMapper` in `src/app/core/mappers/equipment-type.mapper.ts` and exported via `core/mappers/index.ts`.
- Refactored `src/app/core/api/equipment-type.service.ts` to return domain types, use the mapper internally, and introduce a refreshable cached observable for `getAll()` using a `refresh$` Subject + `startWith` + `switchMap` and `shareReplay(1)`. `create()` and `update()` now trigger a cache refresh after successful responses.
- Updated `equipment-type-list.component.ts` and `equipment-type-dialog.component.ts` to consume domain types and the new service signatures. The dialog builds a `EquipmentTypeWrite` from `form.getRawValue()` and coerces an empty description to `undefined` to match API expectations.
- Updated related components (`equipment` list/dialog) and all affected unit tests. Ran the full test suite (Vitest) — all tests pass locally (56 spec files, 302 tests).

## Notes and Next Steps

- TASK024 (EquipmentTypeDropdownComponent) can now be implemented to consume the cached `EquipmentTypeService.getAll()` and provide a `ControlValueAccessor` dropdown that displays the `name` and binds the `slug`.
- Optionally implement optimistic UI updates to append newly-created items to the cache immediately for an instant user experience; current approach refreshes after server success to ensure correctness.
- If you want me to update `TariffDialogData` to use `EquipmentType[]` now, I can do that as a follow-up (TASK018/TASK015 scope dependent).


