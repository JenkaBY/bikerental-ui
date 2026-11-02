# Task 010: Cash page "Hand in cash" navigates to `cash/collect`

> **Applied Skill:** `angular-routing` - `Router.navigate` with route commands. `angular-component` - only the handler body changes (FR-06 contract). The close-shift handler stays interim (FR-08). Requires task 009.

## 1. Objective

Replace the interim "not available yet" toast of `onHandIn()` with navigation. `onCloseShift()` is NOT touched, so `NotificationService` and `Labels` stay in use.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/operator-cash.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - import.** Add directly below `import { MatProgressBarModule } from '@angular/material/progress-bar';`:

```typescript
import { Router } from '@angular/router';
```

**Step 2 - field.** Add directly below `private readonly notifications = inject(NotificationService);`:

```typescript
  private readonly router = inject(Router);
```

**Step 3 - handler.** Replace

```typescript
  protected onHandIn(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }
```

with

```typescript
  protected onHandIn(): void {
    void this.router.navigate(['/cash', 'collect']);
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/operator-cash.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
