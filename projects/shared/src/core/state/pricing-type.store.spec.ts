import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { TariffsService } from '../api/generated';
import { PricingTypeStore } from './pricing-type.store';

describe('PricingTypeStore', () => {
  let store: PricingTypeStore;
  let service: { getPricingTypes: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = {
      getPricingTypes: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [PricingTypeStore, { provide: TariffsService, useValue: service }],
    });

    store = TestBed.inject(PricingTypeStore);
  });

  it('loads pricing types from API response', () => {
    service.getPricingTypes.mockReturnValue(
      of([
        { slug: 'FLAT_HOURLY', title: 'Flat hourly' },
        { slug: 'SPECIAL', title: 'Special' },
      ]),
    );

    store.load().subscribe();

    expect(service.getPricingTypes).toHaveBeenCalledOnce();
    expect(store.pricingTypes()).toEqual([
      { slug: 'FLAT_HOURLY', title: 'Flat hourly', description: 'call to developer' },
      { slug: 'SPECIAL', title: 'Special', description: 'call to developer' },
    ]);
  });

  it('sets loading true while request is in flight and false when completed', () => {
    const subject = new Subject<{ slug: string; title: string }[]>();
    service.getPricingTypes.mockReturnValue(subject.asObservable());

    store.load().subscribe();
    expect(store.loading()).toBe(true);

    subject.next([{ slug: 'DAILY', title: 'Daily' }]);
    subject.complete();

    expect(store.loading()).toBe(false);
    expect(store.pricingTypes()).toEqual([
      { slug: 'DAILY', title: 'Daily', description: 'call to developer' },
    ]);
  });

  it('keeps store stable when API request fails', () => {
    service.getPricingTypes.mockReturnValue(throwError(() => new Error('fail')));

    store.load().subscribe();

    expect(store.loading()).toBe(false);
    expect(store.pricingTypes()).toEqual([]);
  });
});
