import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CancelButtonComponent } from '../../cancel-button/cancel-button.component';
import { CustomerStore } from '@store.customer.store';
import { FormErrorMessages } from '../../../validators/form-error-messages';
import { Labels } from '../../../constant/labels';
import { CustomerFormProvider } from '../customer-form.provider';

@Component({
  selector: 'app-customer-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerStore, CustomerFormProvider],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.CreateCustomer }}</h2>

    <mat-dialog-content>
      <form [formGroup]="formProvider.form" class="flex flex-col gap-4 min-w-100 pt-1">
        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerPhoneLabel }}</mat-label>
          <input matInput formControlName="phone" />
          @if (
            formProvider.form.controls.phone.invalid && formProvider.form.controls.phone.touched
          ) {
            <mat-error>{{ FormErrorMessages.phoneRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerFirstNameLabel }}</mat-label>
          <input matInput formControlName="firstName" />
          @if (
            formProvider.form.controls.firstName.invalid &&
            formProvider.form.controls.firstName.touched
          ) {
            <mat-error>{{ FormErrorMessages.firstNameRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerLastNameLabel }}</mat-label>
          <input matInput formControlName="lastName" />
          @if (
            formProvider.form.controls.lastName.invalid &&
            formProvider.form.controls.lastName.touched
          ) {
            <mat-error>{{ FormErrorMessages.lastNameRequired }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerEmailLabel }}</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (
            formProvider.form.controls.email.invalid && formProvider.form.controls.email.touched
          ) {
            <mat-error>{{ FormErrorMessages.emailInvalid }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
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

        <mat-form-field appearance="outline">
          <mat-label>{{ Labels.CustomerNotesLabel }}</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-cancel-button />
      <button mat-flat-button [disabled]="!this.canSave()" (click)="submit()">
        {{ Labels.Save }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CustomerCreateDialogComponent {
  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;
  protected readonly customerStore = inject(CustomerStore);

  private readonly dialogRef = inject<MatDialogRef<CustomerCreateDialogComponent>>(MatDialogRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly formProvider = inject(CustomerFormProvider);

  public submit(): void {
    if (!this.formProvider.isValid || this.customerStore.saving()) return;

    this.customerStore
      .create(this.formProvider.getCustomerWrite())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.snackBar.open(Labels.CustomerCreateError, undefined, { duration: 4000 });
          return EMPTY;
        }),
      )
      .subscribe((customer) => {
        this.dialogRef.close(customer.id);
      });
  }

  canSave(): boolean {
    return this.formProvider.isValid && !this.customerStore.saving();
  }
}
