import type { CustomerAccountBalancesResponse } from '@api-models';
import { type CustomerBalance } from '@ui-models';
import { makeMoney } from './money.mapper';

export class BalanceMapper {
  static fromBalanceResponse(r: CustomerAccountBalancesResponse): CustomerBalance {
    const available = makeMoney(r.walletBalance);
    return {
      available,
      reserved: makeMoney(r.holdBalance),
      lastUpdatedAt: new Date(r.lastUpdatedAt),
      isWithdrawalAvailable: available.amount > 0,
    };
  }
}
