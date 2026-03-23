import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipmentTypeResponse } from '../models';
import { EquipmentType, EquipmentTypeWrite } from '../domain';
import { EquipmentTypeMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class EquipmentTypeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipment-types`;

  // refresh trigger allows invalidating and reloading the cached list when changes occur
  private readonly refresh$ = new Subject<void>();

  private readonly allTypes$ = this.refresh$
    .pipe(
      startWith(void 0),
      switchMap(() =>
        this.http
          .get<EquipmentTypeResponse[]>(this.baseUrl)
          .pipe(map((list) => (list ?? []).map(EquipmentTypeMapper.fromResponse))),
      ),
    )
    .pipe(shareReplay(1));

  getAll(): Observable<EquipmentType[]> {
    return this.allTypes$;
  }

  create(write: EquipmentTypeWrite): Observable<EquipmentType> {
    return this.http
      .post<EquipmentTypeResponse>(this.baseUrl, EquipmentTypeMapper.toCreateRequest(write))
      .pipe(
        map(EquipmentTypeMapper.fromResponse),
        tap(() => this.refresh$.next()),
      );
  }

  update(write: EquipmentTypeWrite): Observable<EquipmentType> {
    return this.http
      .put<EquipmentTypeResponse>(
        `${this.baseUrl}/${write.slug}`,
        EquipmentTypeMapper.toUpdateRequest(write),
      )
      .pipe(
        map(EquipmentTypeMapper.fromResponse),
        tap(() => this.refresh$.next()),
      );
  }
}
