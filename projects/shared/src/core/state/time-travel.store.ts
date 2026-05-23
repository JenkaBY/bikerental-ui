import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TimeTravelControllerService } from '../api/generated';
import { SetTimeRequest } from '@api-models';

interface ServerTime {
  readonly instant: Date;
  readonly fixed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TimeTravelStore {
  private readonly service = inject(TimeTravelControllerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly timeTravelEnabled = environment.timeTravelEnabled;

  private readonly _serverTime = signal<ServerTime | null>(null);
  private readonly _uiTime = signal<Date | null>(null);
  readonly serverTime = computed(() => this._serverTime()?.instant);
  readonly uiTime = computed(() => this._uiTime());

  constructor() {
    if (!this.timeTravelEnabled) return;

    const source = new EventSource(`${environment.apiUrl}/api/dev/time`);

    source.onmessage = (event: MessageEvent) => {
      this._serverTime.set(TimeTravelStore.fromSseMessage(event.data as string));
    };

    source.onerror = () => {
      this._uiTime.set(null);
      this._serverTime.set(null);
    };

    this.destroyRef.onDestroy(() => source.close());
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
