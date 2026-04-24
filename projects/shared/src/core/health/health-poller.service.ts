import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { environment } from '../../environments/environment';
import { HealthService } from './health.service';

@Injectable({ providedIn: 'root' })
export class HealthPollerService {
  private readonly healthService = inject(HealthService);

  constructor() {
    this.healthService.checkHealth();

    interval(environment.healthPollIntervalMs)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.healthService.checkHealth());
  }
}
