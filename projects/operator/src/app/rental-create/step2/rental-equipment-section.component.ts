import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { EquipmentSearchItem, EquipmentSearchStore, Labels, RentalStore } from '@bikerental/shared';
import { EquipmentItemRowComponent } from './equipment-item-row.component';

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
    EquipmentItemRowComponent,
  ],
  template: `
    <div class="flex flex-col gap-3">
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
          disabled
          [matTooltip]="Labels.ComingSoon"
          [attr.aria-label]="Labels.ScanQr"
        >
          <mat-icon>qr_code_scanner</mat-icon>
        </button>
      </div>

      <div class="flex flex-col gap-2">
        @for (item of store.equipmentItems(); track item.id) {
          <app-equipment-item-row
            [item]="item"
            (removeRequested)="store.removeEquipmentItem($event)"
          />
        }
      </div>
    </div>
  `,
  providers: [EquipmentSearchStore],
})
export class RentalEquipmentSectionComponent {
  protected readonly equipmentSearchStore = inject(EquipmentSearchStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;
  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  private readonly selectedIds = computed(
    () => new Set(this.store.equipmentItems().map((e) => e.id)),
  );

  protected readonly searchResults = computed(() =>
    this.equipmentSearchStore.results().filter((r) => !this.selectedIds().has(r.id)),
  );

  protected readonly loading = this.equipmentSearchStore.loading;

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
    this.store.addEquipmentItem(item);
    this.searchControl.setValue('', { emitEvent: false });
    this.equipmentSearchStore.search(null);
  }
}
