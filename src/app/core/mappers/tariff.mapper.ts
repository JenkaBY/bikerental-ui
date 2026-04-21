import { Tariff, TariffWrite } from '@ui-models';
import { TariffV2Request, TariffV2Response } from '@api-models';
import { toIsoDate } from '../../shared/utils/date.util';

export class TariffMapper {
  static fromResponse(r: TariffV2Response): Tariff {
    const validFromStr = r.validFrom as unknown as string;
    const validToStr = r.validTo as unknown as string | undefined;
    return {
      id: r.id ?? 0,
      name: r.name ?? '',
      description: r.description,
      equipmentType: r.equipmentType ?? '',
      pricingType: r.pricingType ?? 'FLAT_HOURLY',
      params: { ...r.params },
      validFrom: new Date(validFromStr + 'T00:00:00'),
      validTo: validToStr ? new Date(validToStr + 'T00:00:00') : undefined,
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
      validFrom: toIsoDate(w.validFrom) as unknown as Date,
      validTo: w.validTo ? (toIsoDate(w.validTo) as unknown as Date) : undefined,
    };
  }
}
