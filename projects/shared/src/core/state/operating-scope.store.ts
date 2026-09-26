import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OperatingScopeStore {
  private readonly _notEstablished = signal(false);

  readonly notEstablished = computed(() => this._notEstablished());

  markNotEstablished(): boolean {
    const firstTime = !this._notEstablished();
    this._notEstablished.set(true);
    return firstTime;
  }
}
