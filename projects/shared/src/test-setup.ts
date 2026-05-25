import '@angular/localize/init';

class MockEventSource {
  url: string;
  readyState = 0;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  // store normalized listeners (functions taking an Event)
  private listeners = new Map<string, Set<(ev: Event) => void>>();
  // map original callback objects/functions to the stored handler so they can be removed
  private cbMap = new WeakMap<EventListenerOrEventListenerObject, (ev: Event) => void>();

  constructor(url: string) {
    this.url = url;
    this.readyState = 1;
  }

  addEventListener(type: string, cb: EventListenerOrEventListenerObject) {
    const set = this.listeners.get(type) ?? new Set<(ev: Event) => void>();
    let handler: (ev: Event) => void;
    if (typeof cb === 'function') {
      handler = cb as (ev: Event) => void;
    } else {
      const existing = this.cbMap.get(cb);
      if (existing) {
        handler = existing;
      } else {
        handler = (ev: Event) => (cb as EventListenerObject).handleEvent(ev);
        this.cbMap.set(cb, handler);
      }
    }
    set.add(handler);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, cb: EventListenerOrEventListenerObject) {
    const set = this.listeners.get(type);
    if (!set) return;
    const handler = typeof cb === 'function' ? (cb as (ev: Event) => void) : this.cbMap.get(cb);
    if (handler) set.delete(handler);
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  dispatchMessage(data: unknown) {
    const event = { data } as MessageEvent;
    if (this.onmessage) {
      try {
        this.onmessage(event as unknown as { data: unknown });
      } catch {
        void 0; // ignore listener errors in test harness
      }
    }
    const set = this.listeners.get('message');
    if (set) {
      for (const cb of Array.from(set)) {
        try {
          cb(event as unknown as Event);
        } catch {
          void 0; // ignore listener errors in test harness
        }
      }
    }
  }
}

(globalThis as unknown as { EventSource?: unknown }).EventSource = MockEventSource;
