import { InjectionToken } from '@angular/core';
import { TimeTravelStore } from './time-travel.store';

export const TIME_TRAVEL_STORE_TOKEN = new InjectionToken<TimeTravelStore>('TimeTravelStore');
