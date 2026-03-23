import { TariffV2Request, TariffV2Response } from '../models';
import { Tariff, TariffWrite } from '../domain';
import { toIsoDate } from '../../shared/utils/date.util';

export class TariffMapper {
  static fromResponse(r: TariffV2Response): Tariff {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      equipmentType: r.equipmentType,
      pricingType: r.pricingType,
      params: { ...r.params },
      validFrom: new Date(r.validFrom + 'T00:00:00'),
      validTo: r.validTo ? new Date(r.validTo + 'T00:00:00') : undefined,
      status: r.status ?? 'INACTIVE',
    };
  }

  static toRequest(w: TariffWrite): TariffV2Request {
    return {
      name: w.name,
      description: w.description,
      equipmentTypeSlug: w.equipmentTypeSlug,
      pricingType: w.pricingType,
      params: { ...w.params },
      validFrom: toIsoDate(w.validFrom),
      validTo: w.validTo ? toIsoDate(w.validTo) : undefined,
    };
  }
}
