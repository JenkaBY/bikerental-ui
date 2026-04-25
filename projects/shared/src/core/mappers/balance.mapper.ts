import type { CustomerAccountBalancesResponse } from '@api-models';
import { type CustomerBalance } from '@ui-models';
import { makeMoney } from './money.mapper';

export class BalanceMapper {
  static fromBalanceResponse(r: CustomerAccountBalancesResponse): CustomerBalance {
    return {
      available: makeMoney(r.walletBalance),
      reserved: makeMoney(r.holdBalance),
      lastUpdatedAt: new Date(r.lastUpdatedAt),
    };
  }
}
