import { InjectionToken, Signal } from '@angular/core';

export interface RefreshableTab {
  refresh(): void;
  readonly isLoading: Signal<boolean>;
}

export const REFRESHABLE_TAB = new InjectionToken<RefreshableTab>('REFRESHABLE_TAB');
