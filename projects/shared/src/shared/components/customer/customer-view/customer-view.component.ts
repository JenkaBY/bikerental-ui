import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Customer } from '@ui-models';
import { Labels } from '../../../constant/labels';

@Component({
  selector: 'app-customer-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule],
  template: `
    <dl class="flex flex-col gap-3 mb-6">
      <div>
        <dt class="text-xs text-slate-500">{{ Labels.CustomerPhoneLabel }}</dt>
        <dd class="font-medium">{{ customer().phone }}</dd>
      </div>
      <div>
        <dt class="text-xs text-slate-500">{{ Labels.CustomerFirstNameLabel }}</dt>
        <dd>{{ customer().firstName }}</dd>
      </div>
      <div>
        <dt class="text-xs text-slate-500">{{ Labels.CustomerLastNameLabel }}</dt>
        <dd>{{ customer().lastName }}</dd>
      </div>
      @if (customer().email) {
        <div>
          <dt class="text-xs text-slate-500">{{ Labels.CustomerEmailLabel }}</dt>
          <dd>{{ customer().email }}</dd>
        </div>
      }
      @if (customer().birthDate) {
        <div>
          <dt class="text-xs text-slate-500">{{ Labels.CustomerBirthDateLabel }}</dt>
          <dd>{{ customer().birthDate | date }}</dd>
        </div>
      }
      @if (customer().notes) {
        <div>
          <dt class="text-xs text-slate-500">{{ Labels.CustomerNotesLabel }}</dt>
          <dd>{{ customer().notes }}</dd>
        </div>
      }
    </dl>
    <button mat-stroked-button (click)="edit.emit()">{{ Labels.CustomerEditButton }}</button>
  `,
})
export class CustomerViewComponent {
  readonly customer = input.required<Customer>();
  readonly edit = output<void>();

  protected readonly Labels = Labels;
}
