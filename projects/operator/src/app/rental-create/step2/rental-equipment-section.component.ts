import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import {
  EquipmentScanResolverService,
  EquipmentSearchItem,
  EquipmentSearchStore,
  EquipmentUnitCardComponent,
  Labels,
  QrScanDialogComponent,
  RentalCostCalculationStore,
  RentalStore,
} from '@bikerental/shared';
import type { EquipmentUnitViewModel, Money, RentalCostBreakdown } from '@bikerental/shared';

@Component({
  selector: 'app-rental-equipment-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    EquipmentUnitCardComponent,
  ],
  template: `
    <div class="flex flex-col gap-1">
      <div class="flex gap-2">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>{{ Labels.Equipment }}</mat-label>
          <input
            matInput
            type="text"
            [formControl]="searchControl"
            [matAutocomplete]="auto"
            [placeholder]="Labels.SearchEquipmentPlaceholder"
          />
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onEquipmentSelected($event)">
            @for (item of searchResults(); track item.id) {
              <mat-option [value]="item">
                <span class="font-mono">{{ item.uid }}</span>
                <span class="text-slate-500 ml-2">{{ item.model }} · {{ item.type.name }}</span>
              </mat-option>
            } @empty {
              @if (equipmentSearchStore.searchQuery() && !loading()) {
                <mat-option disabled>{{ Labels.NoAvailableEquipment }}</mat-option>
              }
            }
          </mat-autocomplete>
        </mat-form-field>

        <button
          mat-icon-button
          type="button"
          (click)="openScanner()"
          [matTooltip]="Labels.ScanQr"
          [attr.aria-label]="Labels.ScanQr"
        >
          <mat-icon>qr_code_scanner</mat-icon>
        </button>
      </div>

      <div class="flex flex-col gap-2">
        @for (item of items(); track item.id) {
          <app-equipment-unit-card
            [unit]="unitFor(item)"
            [showRemove]="true"
            (removed)="itemRemoved.emit(item.id)"
          />
        }
      </div>
    </div>
  `,
  providers: [EquipmentSearchStore],
})
export class RentalEquipmentSectionComponent {
  protected readonly equipmentSearchStore = inject(EquipmentSearchStore);
  protected readonly store = inject(RentalStore);
  private readonly costStore = inject(RentalCostCalculationStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly scanResolver = inject(EquipmentScanResolverService);

  readonly items = input.required<EquipmentSearchItem[]>();
  readonly itemAdded = output<EquipmentSearchItem>();
  readonly itemRemoved = output<number>();

  protected readonly Labels = Labels;
  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  private readonly selectedIds = computed(() => new Set(this.items().map((e) => e.id)));

  protected readonly searchResults = computed(() =>
    this.equipmentSearchStore.results().filter((r) => !this.selectedIds().has(r.id)),
  );

  protected readonly loading = this.equipmentSearchStore.loading;

  private breakdownFor(equipmentId: number): RentalCostBreakdown | null {
    return this.costStore.breakdowns().find((b) => b.equipmentId === equipmentId) ?? null;
  }

  private priceFor(equipmentId: number): Money | null {
    return this.breakdownFor(equipmentId)?.itemCost ?? null;
  }

  protected unitFor(item: EquipmentSearchItem): EquipmentUnitViewModel {
    const price = this.priceFor(item.id);
    return {
      uid: item.uid,
      name: item.model || item.type.name,
      price,
      priceKind: 'estimated',
      plannedCost: price,
      plannedDurationMinutes: this.store.durationMinutes(),
      breakdown: this.breakdownFor(item.id),
    };
  }

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        filter((v): v is string => typeof v === 'string'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.equipmentSearchStore.search(value));
  }

  protected onEquipmentSelected(event: MatAutocompleteSelectedEvent): void {
    const item = event.option.value as EquipmentSearchItem;
    this.itemAdded.emit(item);
    this.searchControl.setValue('', { emitEvent: false });
    this.equipmentSearchStore.search(null);
  }

  protected openScanner(): void {
    this.dialog
      .open(QrScanDialogComponent, {
        data: { title: Labels.ScanEquipmentTitle },
        width: '420px',
      })
      .afterClosed()
      .pipe(
        filter((uid): uid is string => typeof uid === 'string' && uid.length > 0),
        switchMap((uid) => this.scanResolver.resolve(uid)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((item) => this.handleScanned(item));
  }

  private handleScanned(item: EquipmentSearchItem | null): void {
    if (!item) {
      this.notify(Labels.EquipmentNotAvailableOrNotFound);
      return;
    }
    if (this.selectedIds().has(item.id)) {
      this.notify(Labels.EquipmentAlreadyAdded);
      return;
    }
    this.itemAdded.emit(item);
    this.notify(Labels.EquipmentAdded);
  }

  private notify(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000 });
  }
}
