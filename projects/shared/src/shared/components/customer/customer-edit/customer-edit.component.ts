import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { type Customer, type CustomerWrite } from '@ui-models';
import { Labels } from '../../../constant/labels';
import { CancelButtonComponent } from '../../cancel-button/cancel-button.component';
import { SaveButtonComponent } from '../../save-button/save-button.component';
import { CustomerFormProvider } from '../customer-form.provider';
import { FormErrorMessages } from '../../../validators/form-error-messages';

@Component({
  selector: 'app-customer-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerFormProvider],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    CancelButtonComponent,
    SaveButtonComponent,
  ],
  template: `
    <form [formGroup]="formProvider.form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerPhoneLabel }}</mat-label>
        <input matInput formControlName="phone" />
        @if (formProvider.form.controls.phone.invalid && formProvider.form.controls.phone.touched) {
          <mat-error>{{ FormErrorMessages.phoneRequired }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerFirstNameLabel }}</mat-label>
        <input matInput formControlName="firstName" />
        @if (
          formProvider.form.controls.firstName.invalid &&
          formProvider.form.controls.firstName.touched
        ) {
          <mat-error>{{ FormErrorMessages.firstNameRequired }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerLastNameLabel }}</mat-label>
        <input matInput formControlName="lastName" />
        @if (
          formProvider.form.controls.lastName.invalid && formProvider.form.controls.lastName.touched
        ) {
          <mat-error>{{ FormErrorMessages.lastNameRequired }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerEmailLabel }}</mat-label>
        <input matInput formControlName="email" type="email" />
        @if (formProvider.form.controls.email.invalid && formProvider.form.controls.email.touched) {
          <mat-error>{{ FormErrorMessages.emailInvalid }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerBirthDateLabel }}</mat-label>
        <input matInput [matDatepicker]="picker" formControlName="birthDate" />
        <mat-datepicker-toggle matIconSuffix [for]="picker" />
        <mat-datepicker #picker />
        @if (
          formProvider.form.controls.birthDate.invalid &&
          formProvider.form.controls.birthDate.touched
        ) {
          <mat-error>{{ FormErrorMessages.birthDateFuture }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-4">
        <mat-label>{{ Labels.CustomerNotesLabel }}</mat-label>
        <textarea matInput formControlName="notes" rows="3"></textarea>
      </mat-form-field>

      <div class="flex gap-2 justify-end items-center">
        <app-form-cancel-button />
        <app-form-save-button [saving]="saving()" [disabled]="!this.canSave()" (save)="submit()" />
      </div>
    </form>
  `,
})
export class CustomerEditComponent implements OnInit {
  readonly customer = input.required<Customer>();
  readonly saving = input<boolean>(false);
  readonly saveCustomer = output<CustomerWrite>();
  readonly cancelEdit = output<void>();

  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;
  protected readonly formProvider = inject(CustomerFormProvider);

  ngOnInit(): void {
    this.formProvider.patchValue(this.customer());
  }

  protected submit(): void {
    if (!this.canSave()) return;
    this.saveCustomer.emit(this.formProvider.getCustomerWrite());
  }

  canSave(): boolean {
    return this.formProvider.isValid && !this.saving();
  }
}
