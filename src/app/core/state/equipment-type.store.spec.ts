import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EquipmentTypesService } from '../api/generated';
import { EquipmentTypeStore } from './equipment-type.store';

describe('EquipmentTypeStore', () => {
  let store: EquipmentTypeStore;
  let service: {
    getAllEquipmentTypes: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      getAllEquipmentTypes: vi.fn().mockReturnValue(of([])),
      create: vi.fn(),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [EquipmentTypeStore, { provide: EquipmentTypesService, useValue: service }],
    });

    store = TestBed.inject(EquipmentTypeStore);
  });

  it('loads equipment types sorted by slug and applies type config', () => {
    service.getAllEquipmentTypes.mockReturnValue(
      of([
        { slug: 'SPECIAL', name: 'Special', description: 'Special rental only' },
        { slug: 'bike', name: 'Bike', description: 'Regular bike' },
      ]),
    );

    store.load().subscribe();

    expect(service.getAllEquipmentTypes).toHaveBeenCalledOnce();
    expect(store.types()).toEqual([
      {
        slug: 'bike',
        name: 'Bike',
        description: 'Regular bike',
        isForSpecialTariff: false,
      },
      {
        slug: 'SPECIAL',
        name: 'Special',
        description: 'Special rental only',
        isForSpecialTariff: true,
      },
    ]);
    expect(store.typesForEquipment()).toEqual([
      {
        slug: 'bike',
        name: 'Bike',
        description: 'Regular bike',
        isForSpecialTariff: false,
      },
    ]);
  });

  it('sets loading while load request is in flight and resets when completed', () => {
    const subject = new Subject<{ slug: string; name: string; description?: string }[]>();
    service.getAllEquipmentTypes.mockReturnValue(subject.asObservable());

    store.load().subscribe();
    expect(store.loading()).toBe(true);

    subject.next([{ slug: 'bike', name: 'Bike' }]);
    subject.complete();

    expect(store.loading()).toBe(false);
  });

  it('keeps previous types when load fails', () => {
    service.getAllEquipmentTypes.mockReturnValue(of([{ slug: 'bike', name: 'Bike' }]));
    store.load().subscribe();

    service.getAllEquipmentTypes.mockReturnValue(throwError(() => new Error('fail')));
    store.load().subscribe();

    expect(store.loading()).toBe(false);
    expect(store.types()).toEqual([
      {
        slug: 'bike',
        name: 'Bike',
        description: undefined,
        isForSpecialTariff: false,
      },
    ]);
  });

  it('creates a type and appends it in sorted order', () => {
    service.getAllEquipmentTypes.mockReturnValue(of([{ slug: 'z-bike', name: 'Z Bike' }]));
    store.load().subscribe();

    service.create.mockReturnValue(of({ slug: 'a-bike', name: 'A Bike', description: 'First' }));

    let createdSlug = '';
    store
      .create({ slug: 'a-bike', name: 'A Bike', description: 'First' })
      .subscribe((created) => (createdSlug = created.slug));

    expect(service.create).toHaveBeenCalledWith({
      slug: 'a-bike',
      name: 'A Bike',
      description: 'First',
    });
    expect(createdSlug).toBe('a-bike');
    expect(store.types().map((t) => t.slug)).toEqual(['a-bike', 'z-bike']);
  });

  it('updates existing type by slug', () => {
    service.getAllEquipmentTypes.mockReturnValue(
      of([
        { slug: 'bike', name: 'Bike' },
        { slug: 'roller', name: 'Roller' },
      ]),
    );
    store.load().subscribe();

    service.update.mockReturnValue(of({ slug: 'bike', name: 'Bike Pro', description: 'Updated' }));

    store.update({ slug: 'bike', name: 'Bike Pro', description: 'Updated' }).subscribe();

    expect(service.update).toHaveBeenCalledWith('bike', {
      name: 'Bike Pro',
      description: 'Updated',
    });
    expect(store.types()).toEqual([
      {
        slug: 'bike',
        name: 'Bike Pro',
        description: 'Updated',
        isForSpecialTariff: false,
      },
      {
        slug: 'roller',
        name: 'Roller',
        description: undefined,
        isForSpecialTariff: false,
      },
    ]);
  });

  it('sets saving while create and update operations are in flight', () => {
    const createSubject = new Subject<{ slug: string; name: string }>();
    const updateSubject = new Subject<{ slug: string; name: string }>();
    service.create.mockReturnValue(createSubject.asObservable());
    service.update.mockReturnValue(updateSubject.asObservable());

    store.create({ slug: 'bike', name: 'Bike' }).subscribe();
    expect(store.saving()).toBe(true);
    createSubject.next({ slug: 'bike', name: 'Bike' });
    createSubject.complete();
    expect(store.saving()).toBe(false);

    store.update({ slug: 'bike', name: 'Bike+' }).subscribe();
    expect(store.saving()).toBe(true);
    updateSubject.next({ slug: 'bike', name: 'Bike+' });
    updateSubject.complete();
    expect(store.saving()).toBe(false);
  });
});
