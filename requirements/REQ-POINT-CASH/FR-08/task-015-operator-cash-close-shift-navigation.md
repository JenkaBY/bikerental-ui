# Task 015: Operator Cash screen navigates to the closure page

> **Applied Skill:** `angular-routing` - `Router.navigate` with segments, never a hand-built URL string. Mirrors `onHandIn()` in the same component. Requires task 014.

## 1. Objective

Replace the interim `onCloseShift` (info "This action is not available yet") in `OperatorCashComponent` with navigation to `['/cash', 'close-shift']`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/operator-cash.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - method.** Replace the whole existing method

```typescript
  protected onCloseShift(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }
```

with:

```typescript
  protected onCloseShift(): void {
    void this.router.navigate(['/cash', 'close-shift']);
  }
```

**Step 2 - remove the now-unused injection.** Delete the field line

```typescript
  private readonly notifications = inject(NotificationService);
```

and delete `NotificationService,` from the `@bikerental/shared` import list at the top of the file (`Labels` is still used by the template; keep it).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/operator-cash.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
