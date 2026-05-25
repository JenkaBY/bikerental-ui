import { inject, Injectable } from '@angular/core';
import { TIME_TRAVEL_STORE_TOKEN } from './time-travel-store.token';

@Injectable({ providedIn: 'root' })
export class TimeStore {
  private readonly timeTravelStore = inject(TIME_TRAVEL_STORE_TOKEN, { optional: true });

  getCurrentDate(): Date {
    return this.timeTravelStore?.getCurrentTime() || new Date();
  }
}
