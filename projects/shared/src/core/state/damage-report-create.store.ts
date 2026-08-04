import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { RequestOptions, MaintenanceService } from '../api/generated';
import { DamageReportMapper } from '../mappers/damage-report.mapper';
import type { DamageReport, DamageReportWrite } from '../models';

@Injectable()
export class DamageReportCreateStore {
  private readonly service = inject(MaintenanceService);

  private readonly _saving = signal(false);

  readonly saving = computed(() => this._saving());

  register(write: DamageReportWrite, options?: RequestOptions<'json'>): Observable<DamageReport> {
    this._saving.set(true);
    return this.service
      .registerDamageReport(DamageReportMapper.toRequest(write), undefined, options)
      .pipe(
        map(DamageReportMapper.fromResponse),
        finalize(() => this._saving.set(false)),
      );
  }
}
