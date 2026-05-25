import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface SseProvider {
  stream(url: string): Observable<MessageEvent>;
}

export const SSE_PROVIDER = new InjectionToken<SseProvider>('SSE_PROVIDER');
