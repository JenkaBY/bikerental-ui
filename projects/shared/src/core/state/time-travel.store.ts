import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TimeTravelControllerService } from '../api/generated';
import { TimeTravelMapper } from '../mappers';
import type { ServerTime } from '@ui-models';

@Injectable({ providedIn: 'root' })
export class TimeTravelStore {
  private readonly service = inject(TimeTravelControllerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly timeTravelEnabled = environment.timeTravelEnabled;

  private readonly _serverTime = signal<ServerTime | null>(null);
  readonly serverTime = computed(() => this._serverTime());

  constructor() {
    if (!this.timeTravelEnabled) return;

    const source = new EventSource(`${environment.apiUrl}/api/dev/time`);
    source.onmessage = (event: MessageEvent) => {
      this._serverTime.set(TimeTravelMapper.fromSseMessage(event.data as string));
    };
    this.destroyRef.onDestroy(() => source.close());
  }

  setTime(date: Date): Observable<void> {
    return this.service.setTime(TimeTravelMapper.toSetRequest(date)).pipe(map(() => undefined));
  }

  resetTime(): Observable<void> {
    return this.service.resetTime().pipe(map(() => undefined));
  }
}
