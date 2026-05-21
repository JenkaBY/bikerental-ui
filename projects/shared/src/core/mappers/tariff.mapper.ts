import {
  EquipmentType,
  FALLBACK_EQUIPMENT_TYPE,
  FALLBACK_PRICING_TYPE,
  PricingType,
  Tariff,
  TariffStatus,
  TariffWrite,
} from '@ui-models';
import { TariffV2Request, TariffV2Response } from '@api-models';
import { toIsoDate, parseDate } from '../../shared/utils/date.util';

export class TariffMapper {
  static fromResponse(
    r: TariffV2Response,
    equipmentTypes: EquipmentType[] = [],
    pricingTypes: PricingType[] = [],
  ): Tariff {
    const validFromStr = r.validFrom as unknown as string;
    const validToStr = r.validTo as unknown as string | undefined;

    const equipmentType = equipmentTypes.find((et) => et.slug === r.equipmentType) ?? {
      ...FALLBACK_EQUIPMENT_TYPE,
    };

    const pricingType = pricingTypes.find((pt) => pt.slug === r.pricingType) ?? {
      ...FALLBACK_PRICING_TYPE,
    };

    return {
      id: r.id,
      name: r.name,
      description: r.description,
      equipmentType,
      pricingType,
      params: { ...r.params },
      validFrom: parseDate(validFromStr) ?? new Date(0),
      validTo: validToStr ? (parseDate(validToStr) ?? undefined) : undefined,
      status: r.status as TariffStatus,
      isActive: r.status === 'ACTIVE',
      isSpecial: pricingType.slug === 'SPECIAL',
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
