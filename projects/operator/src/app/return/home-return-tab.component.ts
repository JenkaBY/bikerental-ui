import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  CurrentPointStore,
  Labels,
  QrScanDialogComponent,
  RentalLookupStore,
} from '@bikerental/shared';

@Component({
  selector: 'app-home-return-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  providers: [RentalLookupStore],
  template: `
    <div class="flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      <button
        mat-flat-button
        color="primary"
        class="w-full"
        [disabled]="store.loading()"
        (click)="openScanner()"
      >
        <mat-icon>qr_code_scanner</mat-icon>
        {{ Labels.ScanToReturn }}
      </button>

      @if (store.loading()) {
        <mat-spinner diameter="24" />
      }

      @if (store.notFound()) {
        <p class="text-sm text-amber-700 text-center">{{ Labels.NoActiveRentalForEquipment }}</p>
        <button mat-stroked-button class="w-full" (click)="openActiveRentals()">
          {{ Labels.OpenActiveRentals }}
        </button>
      }
    </div>
  `,
})
export class HomeReturnTabComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalLookupStore);
  private readonly pointStore = inject(CurrentPointStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly scannedUid = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.store.foundRentalId();
      if (id !== null) {
        void this.router.navigate(['/rentals', id], {
          queryParams: { selectUid: this.scannedUid() },
        });
      }
    });
  }

  protected openScanner(): void {
    this.dialog
      .open(QrScanDialogComponent, {
        data: { title: Labels.ScanEquipmentToReturnTitle },
        width: '420px',
      })
      .afterClosed()
      .pipe(
        filter((uid): uid is string => typeof uid === 'string' && uid.length > 0),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((uid) => {
        this.scannedUid.set(uid);
        this.store.lookup(uid, this.pointStore.currentSlug() ?? undefined);
      });
  }

  protected openActiveRentals(): void {
    void this.router.navigate(['/rentals']);
  }
}
