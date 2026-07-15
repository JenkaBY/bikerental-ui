import { Pipe, PipeTransform } from '@angular/core';
import { Labels } from '../constant/labels';
import type { EquipmentUnitPriceKind } from '../components/equipment-unit/equipment-unit-card.component';

@Pipe({ name: 'pricePrefix', standalone: true })
export class PricePrefixPipe implements PipeTransform {
  transform(kind: EquipmentUnitPriceKind): string {
    switch (kind) {
      case 'current':
        return `${Labels.ApproxPricePrefix} `;
      case 'final':
        return `${Labels.FinalPricePrefix} `;
      default:
        return '';
    }
  }
}
