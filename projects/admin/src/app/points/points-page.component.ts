import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PointAdminStore } from '@bikerental/shared';
import { PointDetailComponent } from './point-detail.component';
import { PointListComponent } from './point-list.component';

@Component({
  selector: 'app-points-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PointListComponent, PointDetailComponent],
  providers: [PointAdminStore],
  template: `
    <div class="grid grid-cols-[minmax(18rem,1fr)_2fr] gap-6 p-4">
      <section class="min-w-0">
        <app-point-list
          [points]="store.points()"
          [selectedId]="store.selectedId()"
          (pointSelect)="store.select($event)"
          (create)="store.startCreate()"
        />
      </section>
      <section class="min-w-0">
        <app-point-detail />
      </section>
    </div>
  `,
})
export class PointsPageComponent implements OnInit {
  protected readonly store = inject(PointAdminStore);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.store.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
