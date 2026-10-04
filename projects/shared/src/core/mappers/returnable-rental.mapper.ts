import { ReturnableRentalResponse } from '@api-models';
import { ReturnableRental } from '../models';
import { RentalDashboardMapper } from './rental-dashboard.mapper';

export class ReturnableRentalMapper {
  static fromResponse(r: ReturnableRentalResponse): ReturnableRental {
    return {
      ...RentalDashboardMapper.toDetailState(r.rental, null, []),
      atThisPoint: r.atThisPoint ?? false,
    };
  }
}
