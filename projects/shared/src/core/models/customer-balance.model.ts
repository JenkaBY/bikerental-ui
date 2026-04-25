import type { Money } from '@ui-models';

export interface CustomerBalance {
  readonly available: Money;
  readonly reserved: Money;
  readonly lastUpdatedAt: Date;
}
