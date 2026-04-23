import { PricingTypeResponse } from '@api-models';
import { PricingType, PricingTypeSlug } from '@ui-models';

export class PricingTypeMapper {
  static fromResponse(response: PricingTypeResponse): PricingType {
    return {
      slug: response.slug as PricingTypeSlug,
      title: response.title,
      description: response.description || 'call to developer',
    };
  }
}
