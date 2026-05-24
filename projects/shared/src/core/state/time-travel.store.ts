import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TimeTravelControllerService } from '../api/generated';
import { SSE_PROVIDER } from '../api/event-source';
import { SetTimeRequest } from '@api-models';

interface ServerTime {
  readonly instant: Date;
  readonly fixed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TimeTravelStore {
  private sse = inject(SSE_PROVIDER, { optional: true });
  private readonly service = inject(TimeTravelControllerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly timeTravelEnabled = environment.timeTravelEnabled;

  private readonly _serverTime = signal<ServerTime | null>(null);
  private readonly _uiTime = signal<Date | null>(null);
  readonly serverTime = computed(() => this._serverTime()?.instant);
  readonly uiTime = computed(() => this._uiTime());

  constructor() {
    if (!this.timeTravelEnabled || !this.sse) return;

    const sub: Subscription = this.sse.stream(`${environment.apiUrl}/api/dev/time`).subscribe({
      next: (event: MessageEvent) => {
        this._serverTime.set(TimeTravelStore.fromSseMessage(event.data as string));
      },
      error: () => {
        this._uiTime.set(null);
        this._serverTime.set(null);
      },
    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  setTime(date: Date): Observable<void> {
    this._uiTime.set(date);
    return this.service.setTime(TimeTravelStore.toSetRequest(date)).pipe(map(() => undefined));
  }

  resetTime(): Observable<void> {
    this._uiTime.set(null);
    return this.service.resetTime().pipe(map(() => undefined));
  }

  getCurrentTime(): Date {
    const st = this._uiTime();
    return st ?? new Date();
  }

  private static fromSseMessage(raw: string): ServerTime {
    const parsed = JSON.parse(raw) as { instant: string; fixed: boolean };
    return {
      instant: new Date(parsed.instant),
      fixed: parsed.fixed,
    };
  }

  private static toSetRequest(date: Date): SetTimeRequest {
    return { instant: date.toISOString() };
  }
}
