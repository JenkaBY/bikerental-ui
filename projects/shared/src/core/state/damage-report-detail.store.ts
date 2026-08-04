import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { EquipmentsCatalogueService, MaintenanceService } from '../api/generated';
import type { DamageReportResponse } from '@api-models';
import { DamageReportMapper } from '../mappers/damage-report.mapper';
import type { DamageReport } from '../models';
import type { ApiError } from '../errors/api-error.model';
import { ApiErrorParser } from '../errors/api-error.parser';
import { suppressErrorNotification } from '../errors/http-error-context';

@Injectable()
export class DamageReportDetailStore {
  private readonly service = inject(MaintenanceService);
  private readonly equipmentService = inject(EquipmentsCatalogueService);

  private readonly _report = signal<DamageReport | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);
  private readonly _lastId = signal<number | null>(null);

  readonly report = computed(() => this._report());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  load(id: number): void {
    this._lastId.set(id);
    this._loading.set(true);
    this._error.set(null);
    this.service
      .getDamageReport(id, 'body', { context: suppressErrorNotification() })
      .pipe(
        switchMap((response) => this.withEquipmentNames(response)),
        catchError((err: unknown) => {
          this._error.set(ApiErrorParser.parse(err));
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((report) => {
        if (report) this._report.set(report);
      });
  }

  reload(): void {
    const id = this._lastId();
    if (id !== null) this.load(id);
  }

  private withEquipmentNames(response: DamageReportResponse): Observable<DamageReport> {
    const report = DamageReportMapper.fromResponse(response);
    const equipmentIds = report.items.map((item) => item.equipmentId).filter((id) => id > 0);
    if (equipmentIds.length === 0) return of(report);

    return this.equipmentService
      .getBatchEquipments(equipmentIds, 'body', { context: suppressErrorNotification() })
      .pipe(
        map((equipments) => {
          const modelById = new Map(equipments.map((e) => [e.id, e.model]));
          return {
            ...report,
            items: report.items.map((item) => ({
              ...item,
              equipmentModel: modelById.get(item.equipmentId),
            })),
          };
        }),
        catchError(() => of(report)),
      );
  }
}
