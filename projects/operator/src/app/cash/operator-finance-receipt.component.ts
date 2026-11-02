import { ChangeDetectionStrategy, Component, inject, LOCALE_ID } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FinanceReceiptStore, FixedMoneyPipe, Labels } from '@bikerental/shared';
import { buildReceiptView, type FinanceReceiptView } from './finance-receipt.view';

@Component({
  selector: 'app-operator-finance-receipt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, FixedMoneyPipe],
  template: `
    @if (view; as receipt) {
      <div class="flex flex-col items-center gap-4 py-8 text-center">
        <mat-icon class="!h-14 !w-14 !text-5xl text-green-600">check_circle</mat-icon>
        <h1 class="m-0 text-xl font-semibold">{{ receipt.title }}</h1>
        @if (receipt.amount) {
          <div class="text-3xl font-semibold tabular-nums">{{ receipt.amount | fixedMoney }}</div>
        }
        <dl class="m-0 grid w-full grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-left">
          @for (row of receipt.rows; track row.label) {
            <dt class="text-slate-500">{{ row.label }}</dt>
            <dd class="m-0 text-right font-medium tabular-nums">{{ row.value }}</dd>
          }
        </dl>
        <button
          mat-flat-button
          color="primary"
          type="button"
          class="!h-12 w-full"
          (click)="onDone()"
        >
          {{ labels.Done }}
        </button>
      </div>
    }
  `,
})
export class OperatorFinanceReceiptComponent {
  protected readonly labels = Labels;
  protected readonly view: FinanceReceiptView | null;

  private readonly router = inject(Router);

  constructor() {
    const receipt = inject(FinanceReceiptStore).take();
    this.view = receipt ? buildReceiptView(receipt, inject(LOCALE_ID)) : null;
    if (!this.view) this.onDone();
  }

  protected onDone(): void {
    void this.router.navigate(['/cash'], { replaceUrl: true });
  }
}
