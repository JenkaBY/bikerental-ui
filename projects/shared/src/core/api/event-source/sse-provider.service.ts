import { Injectable, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SseProvider } from './sse-provider.token';

@Injectable({ providedIn: 'root' })
export class SseService implements SseProvider {
  private readonly zone = inject(NgZone);

  stream(url: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        this.zone.run(() => observer.next(event));
      };

      eventSource.onerror = (error) => {
        this.zone.run(() => observer.error(error));
      };

      return () => {
        eventSource.close();
      };
    });
  }
}
