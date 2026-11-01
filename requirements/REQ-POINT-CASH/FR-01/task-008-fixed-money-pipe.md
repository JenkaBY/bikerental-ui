# Task 008: FixedMoneyPipe (two decimals, locale grouping, em-dash for unknown, signed mode)

> **Applied Skill:** `angular-component` - standalone pure pipe, `inject(LOCALE_ID)`. FR-01 §2 "money with two decimals, right-aligned"; FR-01 §3 "em-dash in the money columns" when unknown. The existing `MoneyPipe` drops trailing zeros (`parseFloat(toFixed(2))`) and prints an empty string for `null`, so it cannot be reused without changing every screen that uses it; a new pipe is added instead.

## 1. Objective

Add a shared pipe and a pure function that format `Money | null` as `1,250.00 p.` (`en-US`) /
`1 250,00 p.` (`ru`), print `—` for `null`, and in signed mode prefix `+` for inflows and the true
minus sign `−` for outflows. FR-01 uses the unsigned form; FR-02 uses the signed form for movement
amounts and the function inside the summary-card split line.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/pipes/fixed-money.pipe.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/shared/src/shared/pipes/fixed-money.pipe.ts` - full content.
* **Snippet:**

```typescript
import { formatNumber } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import type { Money } from '../../core/models';

export const FIXED_MONEY_EMPTY = '—';
const MINUS_SIGN = '−';

export function formatFixedMoney(
  value: Money | null | undefined,
  locale: string,
  signed = false,
): string {
  if (!value) return FIXED_MONEY_EMPTY;
  const digits = formatNumber(Math.abs(value.amount), locale, '1.2-2');
  const sign = value.amount < 0 ? MINUS_SIGN : signed && value.amount > 0 ? '+' : '';
  return `${sign}${digits} ${value.currency}`;
}

@Pipe({ name: 'fixedMoney', standalone: true })
export class FixedMoneyPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: Money | null | undefined, signed = false): string {
    return formatFixedMoney(value, this.locale, signed);
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below the existing line `export * from './shared/pipes/money.pipe';`
* **Snippet:**

```typescript
export * from './shared/pipes/fixed-money.pipe';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/pipes/fixed-money.pipe.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
