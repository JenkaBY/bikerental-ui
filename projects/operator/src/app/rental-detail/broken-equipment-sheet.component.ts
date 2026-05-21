import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import type { BrokenEquipmentEntry, RentalEquipmentItem } from '@ui-models';
import { Labels } from '@bikerental/shared';

interface BrokenSheetData {
  equipmentItems: RentalEquipmentItem[];
  existingEntries: BrokenEquipmentEntry[];
}

interface RowState {
  item: RentalEquipmentItem;
  checked: boolean;
  penalty: string;
}

@Component({
  selector: 'app-broken-equipment-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCheckboxModule, MatDividerModule],
  template: `
    <div class="px-4 pt-4 pb-2">
      <h2 class="text-base font-bold text-slate-900">{{ Labels.BrokenEquipmentTitle }}</h2>
      <p class="text-sm text-slate-500 mt-0.5">{{ Labels.BrokenEquipmentSubtitle }}</p>
    </div>

    <mat-divider />

    <div class="overflow-y-auto max-h-[50vh] px-4 py-2">
      @for (row of rows(); track row.item.id; let i = $index) {
        <div class="flex items-center gap-3 py-2">
          <mat-checkbox [checked]="row.checked" (change)="onCheck(i, $event)" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-900 truncate">{{ row.item.model }}</p>
            <p class="text-xs text-slate-500 truncate">
              {{ row.item.type.name }} · {{ row.item.uid }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span class="text-xs text-slate-500">{{ Labels.CurrencySymbol }}</span>
            <input
              type="number"
              inputmode="numeric"
              class="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-right
                     disabled:opacity-40 disabled:bg-slate-100 disabled:cursor-not-allowed
                     focus:outline-none focus:border-blue-500"
              [value]="row.penalty"
              [disabled]="!row.checked"
              (change)="onPenaltyChange(i, $event)"
            />
          </div>
        </div>
        <mat-divider />
      }

      @if (returnedCount > 0) {
        <p class="text-xs text-slate-400 py-2 italic">
          {{ returnedCount }} {{ Labels.ItemsAlreadyReturned }}
        </p>
      }

      <div class="flex items-start gap-2 bg-blue-50 rounded p-3 my-2">
        <span class="text-blue-500 text-sm leading-none mt-0.5">ℹ</span>
        <p class="text-xs text-blue-700">{{ Labels.BrokenEquipmentPenaltyUnderDevelopment }}</p>
      </div>
    </div>

    <mat-divider />

    <div class="flex gap-3 px-4 py-3">
      <button mat-stroked-button class="flex-1" (click)="onCancel()">
        {{ Labels.Cancel }}
      </button>
      <button mat-stroked-button color="warn" class="flex-1" (click)="onApply()">
        {{ Labels.Apply }}
      </button>
    </div>
  `,
})
export class BrokenEquipmentSheetComponent {
  private readonly data = inject<BrokenSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<BrokenEquipmentSheetComponent>);

  protected readonly Labels = Labels;
  protected readonly returnedCount: number;

  protected readonly rows = signal<RowState[]>([]);

  constructor() {
    const activeItems = this.data.equipmentItems.filter((item) => !item.isReturned);
    const returnedItems = this.data.equipmentItems.filter((item) => item.isReturned);
    this.returnedCount = returnedItems.length;

    this.rows.set(
      activeItems.map((item) => {
        const existing = this.data.existingEntries.find((e) => e.equipmentItemId === item.id);
        return {
          item,
          checked: !!existing,
          penalty: existing?.penaltyAmount != null ? String(existing.penaltyAmount) : '',
        };
      }),
    );
  }

  protected onCheck(index: number, event: MatCheckboxChange): void {
    this.rows.update((rows) =>
      rows.map((r, i) =>
        i === index ? { ...r, checked: event.checked, penalty: event.checked ? r.penalty : '' } : r,
      ),
    );
  }

  protected onPenaltyChange(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.rows.update((rows) => rows.map((r, i) => (i === index ? { ...r, penalty: value } : r)));
  }

  protected onApply(): void {
    const entries: BrokenEquipmentEntry[] = this.rows()
      .filter((r) => r.checked)
      .map((r) => ({
        equipmentItemId: r.item.id,
        penaltyAmount: r.penalty !== '' ? +r.penalty : undefined,
      }));
    this.sheetRef.dismiss(entries);
  }

  protected onCancel(): void {
    this.sheetRef.dismiss();
  }
}
