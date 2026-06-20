import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RentalsService } from '../api/generated';
import { EquipmentSearchItemMapper } from '../mappers';
import { EquipmentTypeStore } from './equipment-type.store';
import type { EquipmentSearchItem } from '@ui-models';

@Injectable({ providedIn: 'root' })
export class EquipmentScanResolverService {
  private readonly rentalsService = inject(RentalsService);
  private readonly equipmentTypeStore = inject(EquipmentTypeStore);

  resolve(uid: string): Observable<EquipmentSearchItem | null> {
    const normalized = uid.trim().toLowerCase();
    return this.rentalsService.getAvailableEquipments({ size: 1 }, uid).pipe(
      map((page) => {
        const response = page.items?.[0];
        if (!response) return null;
        const types = this.equipmentTypeStore.typesForEquipment();
        const item = EquipmentSearchItemMapper.fromAvailableResponse(response, types);
        return item.uid.trim().toLowerCase() === normalized ? item : null;
      }),
    );
  }
}
