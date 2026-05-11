import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Customer,
  CustomerFormProvider,
  CustomerStore,
  FormErrorMessages,
  Labels,
  PhoneCharactersOnlyDirective,
} from '@bikerental/shared';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-customer-create-inline-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerStore, CustomerFormProvider],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIcon,
    PhoneCharactersOnlyDirective,
  ],
  template: `
    <div class="mt-3 p-3 border border-slate-200 rounded-lg flex flex-col gap-3">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ Labels.Phone }}</mat-label>
        <input
          matInput
          type="tel"
          appPhoneCharactersOnly
          [value]="phone()"
          [formControl]="formProvider.form.controls.phone"
        />
        <mat-hint>{{ Labels.PhoneFormatHint }}</mat-hint>
        @if (formProvider.form.controls.phone.invalid && formProvider.form.controls.phone.touched) {
          <mat-error>{{ FormErrorMessages.phoneRequired }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ Labels.FirstName }}</mat-label>
        <input matInput [formControl]="formProvider.form.controls.firstName" />
        @if (formProvider.form.controls.firstName.hasError('required')) {
          <mat-error>{{ FormErrorMessages.firstNameRequired }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ Labels.LastName }}</mat-label>
        <input matInput [formControl]="formProvider.form.controls.lastName" />
        @if (formProvider.form.controls.lastName.hasError('required')) {
          <mat-error>{{ FormErrorMessages.lastNameRequired }}</mat-error>
        }
      </mat-form-field>

      <button
        mat-raised-button
        color="primary"
        [disabled]="customerStore.saving()"
        (click)="submit()"
      >
        <mat-icon>add</mat-icon>
        {{ customerStore.saving() ? Labels.Saving : Labels.CreateCustomer }}
      </button>
    </div>
  `,
})
export class CustomerCreateInlineFormComponent implements OnInit {
  protected readonly customerStore = inject(CustomerStore);
  protected readonly formProvider = inject(CustomerFormProvider);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly phone = input.required<string>();
  readonly customerCreated = output<Customer>();

  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;

  ngOnInit(): void {
    this.formProvider.form.controls.phone.setValue(this.phone());
  }

  protected submit(): void {
    this.formProvider.form.markAllAsTouched();
    if (!this.formProvider.isValid || this.customerStore.saving()) return;
    this.customerStore
      .create(this.formProvider.getCustomerWrite())
      .pipe(
        catchError(() => {
          this.snackBar.open(Labels.CustomerCreateError, Labels.Close, { duration: 4000 });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((customer) => this.customerCreated.emit(customer));
  }
}
