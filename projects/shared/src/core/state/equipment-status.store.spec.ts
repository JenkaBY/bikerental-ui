import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EquipmentStatusesService } from '../api/generated';
import { EquipmentStatusStore } from './equipment-status.store';

describe('EquipmentStatusStore', () => {
  let store: EquipmentStatusStore;
  let service: {
    getAllEquipmentStatuses: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      getAllEquipmentStatuses: vi.fn().mockReturnValue(of([])),
      create: vi.fn(),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [EquipmentStatusStore, { provide: EquipmentStatusesService, useValue: service }],
    });

    store = TestBed.inject(EquipmentStatusStore);
  });

  it('loads statuses sorted by slug and maps allowed transitions', () => {
    service.getAllEquipmentStatuses.mockReturnValue(
      of([
        { slug: 'retired', name: 'Retired' },
        { slug: 'available', name: 'Available', allowedTransitions: ['maintenance'] },
      ]),
    );

    store.load().subscribe();

    expect(service.getAllEquipmentStatuses).toHaveBeenCalledOnce();
    expect(store.statuses()).toEqual([
      {
        slug: 'available',
        name: 'Available',
        description: undefined,
        allowedTransitions: ['maintenance'],
      },
      {
        slug: 'retired',
        name: 'Retired',
        description: undefined,
        allowedTransitions: [],
      },
    ]);
  });

  it('sets loading while load request is in flight and resets when completed', () => {
    const subject = new Subject<{ slug: string; name: string }[]>();
    service.getAllEquipmentStatuses.mockReturnValue(subject.asObservable());

    store.load().subscribe();
    expect(store.loading()).toBe(true);

    subject.next([{ slug: 'available', name: 'Available' }]);
    subject.complete();

    expect(store.loading()).toBe(false);
  });

  it('keeps previous statuses when load fails', () => {
    service.getAllEquipmentStatuses.mockReturnValue(of([{ slug: 'available', name: 'Available' }]));
    store.load().subscribe();

    service.getAllEquipmentStatuses.mockReturnValue(throwError(() => new Error('fail')));
    store.load().subscribe();

    expect(store.loading()).toBe(false);
    expect(store.statuses()).toEqual([
      {
        slug: 'available',
        name: 'Available',
        description: undefined,
        allowedTransitions: [],
      },
    ]);
  });

  it('creates a status and appends it in sorted order', () => {
    service.getAllEquipmentStatuses.mockReturnValue(of([{ slug: 'retired', name: 'Retired' }]));
    store.load().subscribe();

    service.create.mockReturnValue(
      of({
        slug: 'available',
        name: 'Available',
        description: 'Ready for rent',
        allowedTransitions: ['maintenance'],
      }),
    );

    store
      .create({
        slug: 'available',
        name: 'Available',
        description: 'Ready for rent',
        allowedTransitions: ['maintenance'],
      })
      .subscribe();

    expect(service.create).toHaveBeenCalledWith({
      slug: 'available',
      name: 'Available',
      description: 'Ready for rent',
      allowedTransitions: ['maintenance'],
    });
    expect(store.statuses().map((s) => s.slug)).toEqual(['available', 'retired']);
  });

  it('updates an existing status by the provided slug', () => {
    service.getAllEquipmentStatuses.mockReturnValue(
      of([
        { slug: 'available', name: 'Available', allowedTransitions: [] },
        { slug: 'maintenance', name: 'Maintenance', allowedTransitions: ['available'] },
      ]),
    );
    store.load().subscribe();

    service.update.mockReturnValue(
      of({
        slug: 'available',
        name: 'Available+',
        description: 'Updated',
        allowedTransitions: ['maintenance'],
      }),
    );

    store
      .update('available', {
        slug: 'available',
        name: 'Available+',
        description: 'Updated',
        allowedTransitions: ['maintenance'],
      })
      .subscribe();

    expect(service.update).toHaveBeenCalledWith('available', {
      name: 'Available+',
      description: 'Updated',
      allowedTransitions: ['maintenance'],
    });
    expect(store.statuses()).toEqual([
      {
        slug: 'available',
        name: 'Available+',
        description: 'Updated',
        allowedTransitions: ['maintenance'],
      },
      {
        slug: 'maintenance',
        name: 'Maintenance',
        description: undefined,
        allowedTransitions: ['available'],
      },
    ]);
  });

  it('sets saving while create and update operations are in flight', () => {
    const createSubject = new Subject<{
      slug: string;
      name: string;
      allowedTransitions?: string[];
    }>();
    const updateSubject = new Subject<{
      slug: string;
      name: string;
      allowedTransitions?: string[];
    }>();
    service.create.mockReturnValue(createSubject.asObservable());
    service.update.mockReturnValue(updateSubject.asObservable());

    store.create({ slug: 'available', name: 'Available', allowedTransitions: [] }).subscribe();
    expect(store.saving()).toBe(true);
    createSubject.next({ slug: 'available', name: 'Available' });
    createSubject.complete();
    expect(store.saving()).toBe(false);

    store
      .update('available', { slug: 'available', name: 'Available+', allowedTransitions: [] })
      .subscribe();
    expect(store.saving()).toBe(true);
    updateSubject.next({ slug: 'available', name: 'Available+' });
    updateSubject.complete();
    expect(store.saving()).toBe(false);
  });
});
