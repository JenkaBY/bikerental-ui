import { TestBed } from '@angular/core/testing';
import { LayoutModeService } from './layout-mode.service';

describe('LayoutModeService', () => {
  const STORAGE_KEY = 'bikerental.operatorLayoutMode';
  const realLocalStorage = window.localStorage;

  beforeEach(() => {
    // clear storage before each test if available
    if (
      typeof window !== 'undefined' &&
      realLocalStorage &&
      typeof realLocalStorage.removeItem === 'function'
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    // restore original localStorage (if possible)
    if (typeof window !== 'undefined') {
      (window as unknown as { localStorage: Storage }).localStorage = realLocalStorage;
    }
  });

  it('defaults to mobile when no stored value', () => {
    TestBed.configureTestingModule({ providers: [LayoutModeService] });
    const svc = TestBed.inject(LayoutModeService);
    expect(svc.mode()).toBe('mobile');
    expect(svc.isMobile()).toBe(true);
  });

  it('setMode updates mode and persists to localStorage', () => {
    TestBed.configureTestingModule({ providers: [LayoutModeService] });
    const svc = TestBed.inject(LayoutModeService);
    svc.setMode('desktop');
    expect(svc.mode()).toBe('desktop');
    expect(svc.isMobile()).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('desktop');
  });

  it('toggle switches between mobile and desktop', () => {
    TestBed.configureTestingModule({ providers: [LayoutModeService] });
    const svc = TestBed.inject(LayoutModeService);
    svc.setMode('mobile');
    svc.toggle();
    expect(svc.mode()).toBe('desktop');
    svc.toggle();
    expect(svc.mode()).toBe('mobile');
  });

  it('initializes from localStorage when present', () => {
    if (
      typeof window !== 'undefined' &&
      realLocalStorage &&
      typeof realLocalStorage.setItem === 'function'
    ) {
      realLocalStorage.setItem(STORAGE_KEY, 'desktop');
    }
    TestBed.configureTestingModule({ providers: [LayoutModeService] });
    const svc = TestBed.inject(LayoutModeService);
    expect(svc.mode()).toBe('desktop');
  });

  it('gracefully handles localStorage.getItem throwing', () => {
    // mock localStorage to throw on getItem
    const mockLS: Partial<Storage> = {
      getItem: () => {
        throw new Error('fail get');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    // assign via unknown cast
    (window as unknown as { localStorage: Partial<Storage> }).localStorage = mockLS;

    TestBed.configureTestingModule({ providers: [LayoutModeService] });
    const svc = TestBed.inject(LayoutModeService);
    // should fall back to default mobile
    expect(svc.mode()).toBe('mobile');
  });

  it('does not throw when setItem throws', () => {
    // mock localStorage to throw on setItem
    const mockLS2: Partial<Storage> = {
      getItem: () => null,
      setItem: () => {
        throw new Error('fail set');
      },
      removeItem: () => undefined,
    };

    (window as unknown as { localStorage: Partial<Storage> }).localStorage = mockLS2;

    TestBed.configureTestingModule({ providers: [LayoutModeService] });
    const svc = TestBed.inject(LayoutModeService);
    // calling setMode should not throw even if storage fails
    expect(() => svc.setMode('desktop')).not.toThrow();
    expect(svc.mode()).toBe('desktop');
  });
});
