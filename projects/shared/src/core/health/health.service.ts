import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HealthResponse, HealthStatus, ServerInfo } from './health.model';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  readonly status = signal<HealthStatus>('UNKNOWN');
  readonly components = signal<Record<string, { status: HealthStatus }> | null>(null);
  readonly serverInfo = signal<ServerInfo | null>(null);
  readonly lastChecked = signal<Date | null>(null);
  readonly error = signal<string | null>(null);

  checkHealth(): void {
    this.http
      .get<HealthResponse>(`${this.baseUrl}/actuator/health`)
      .pipe(
        catchError(() => {
          this.status.set('UNKNOWN');
          this.error.set('Unable to reach server');
          this.lastChecked.set(new Date());
          return EMPTY;
        }),
      )
      .subscribe((response) => {
        this.status.set(response.status);
        this.components.set(response.components ?? null);
        this.lastChecked.set(new Date());
        this.error.set(null);

        if (response.status === 'UP' && this.serverInfo() === null) {
          this.fetchInfo();
        }
      });
  }

  private fetchInfo(): void {
    this.http
      .get<ServerInfo>(`${this.baseUrl}/actuator/info`)
      .pipe(catchError(() => EMPTY))
      .subscribe((info) => {
        this.serverInfo.set(info);
      });
  }
}
