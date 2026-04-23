import { computed, Injectable, signal } from '@angular/core';

export type LayoutMode = 'mobile' | 'desktop';

const STORAGE_KEY = 'bikerental.operatorLayoutMode';

@Injectable({ providedIn: 'root' })
export class LayoutModeService {
  private initial = ((): LayoutMode => {
    try {
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return 'mobile';
      }
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === 'desktop' || v === 'mobile') return v as LayoutMode;
      return 'mobile';
    } catch {
      return 'mobile';
    }
  })();

  private _mode = signal<LayoutMode>(this.initial);

  readonly mode = computed(() => this._mode());

  readonly isMobile = computed(() => this._mode() === 'mobile');

  setMode(mode: LayoutMode) {
    this._mode.set(mode);
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, mode);
      }
    } catch {
      // ignore storage errors
    }
  }

  toggle() {
    this.setMode(this._mode() === 'mobile' ? 'desktop' : 'mobile');
  }
}
