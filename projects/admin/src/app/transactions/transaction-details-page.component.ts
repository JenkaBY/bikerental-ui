import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  Labels,
  PageHeaderComponent,
  TransactionDetailsStore,
  TransactionDetailsViewComponent,
} from '@bikerental/shared';

@Component({
  selector: 'app-transaction-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TransactionDetailsStore],
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    PageHeaderComponent,
    TransactionDetailsViewComponent,
  ],
  template: `
    <app-page-header [title]="Labels.TransactionDetailsTitle" (back)="location.back()" />

    <div class="p-4 md:p-6">
      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (store.error()) {
        <div class="text-center mt-6 flex flex-col items-center gap-2">
          <p class="text-slate-500">{{ Labels.TransactionDetailsLoadError }}</p>
          <button mat-stroked-button (click)="store.load(id())">{{ Labels.Retry }}</button>
        </div>
      } @else if (store.details(); as details) {
        <app-transaction-details-view
          [details]="details"
          [customer]="store.customer() ?? undefined"
          [operatorName]="store.operatorName()"
        />
      }
    </div>
  `,
})
export class TransactionDetailsPageComponent {
  readonly store = inject(TransactionDetailsStore);
  protected readonly location = inject(Location);

  readonly id = input.required<string>();

  protected readonly Labels = Labels;

  constructor() {
    effect(() => this.store.load(this.id()));
  }
}
