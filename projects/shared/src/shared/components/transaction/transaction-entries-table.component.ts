import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { TransactionLedgerEntry } from '../../../core/models/transaction.model';
import { Labels } from '../../constant/labels';
import { MoneyPipe } from '../../pipes/money.pipe';
import { mapLedgerType, mapTransactionDirectionLabel } from '../../transaction.meta';

@Component({
  selector: 'app-transaction-entries-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MoneyPipe],
  template: `
    <div class="flex flex-col gap-1">
      <h3 class="text-sm font-semibold text-slate-700">{{ title() }}</h3>
      <table class="w-full table-fixed text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-400">
            <th class="font-normal py-1 w-[34%]">{{ Labels.TransactionEntryLedgerColumn }}</th>
            <th class="font-normal py-1 w-[14%]">{{ Labels.TransactionEntryDirectionColumn }}</th>
            <th class="font-normal py-1 w-[17%] text-right">{{ Labels.TransactionAmountLabel }}</th>
            <th class="font-normal py-1 w-[17%] text-right">
              {{ Labels.TransactionEntrySignedDeltaColumn }}
            </th>
            <th class="font-normal py-1 w-[18%] text-right">
              {{ Labels.TransactionEntryBalanceAfterColumn }}
            </th>
          </tr>
        </thead>
        <tbody>
          @for (e of entries(); track $index) {
            <tr class="border-t border-slate-100">
              <td class="py-1.5">
                <span class="flex items-center gap-1">
                  <mat-icon
                    class="!h-4 !w-4 !text-base !leading-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                    >{{ ledgerMeta(e.ledgerType).icon }}</mat-icon
                  >
                  {{ ledgerMeta(e.ledgerType).label }}
                </span>
              </td>
              <td class="py-1.5 text-slate-500">{{ directionLabel(e.direction) }}</td>
              <td class="py-1.5 text-right">{{ e.amount | money }}</td>
              <td
                class="py-1.5 text-right font-medium"
                [class.text-emerald-600]="e.signedDelta.amount > 0"
                [class.text-slate-700]="e.signedDelta.amount < 0"
                [class.text-slate-400]="e.signedDelta.amount === 0"
              >
                {{ e.signedDelta | money: true }}
              </td>
              <td class="py-1.5 text-right">
                @if (e.balanceAfter; as b) {
                  {{ b | money }}
                } @else {
                  <span class="text-slate-300">—</span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TransactionEntriesTableComponent {
  readonly entries = input.required<readonly TransactionLedgerEntry[]>();
  readonly title = input.required<string>();

  protected readonly Labels = Labels;

  protected readonly ledgerMeta = mapLedgerType;
  protected readonly directionLabel = mapTransactionDirectionLabel;
}
