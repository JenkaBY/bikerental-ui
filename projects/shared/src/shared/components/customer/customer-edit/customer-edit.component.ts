import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { type Customer, type CustomerWrite } from '@ui-models';
import { Labels } from '../../../constant/labels';
import { CancelButtonComponent } from '../../cancel-button/cancel-button.component';

@Component({
  selector: 'app-customer-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CancelButtonComponent,
    CancelButtonComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    CancelButtonComponent,
    CancelButtonComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerPhoneLabel }}</mat-label>
        <input matInput formControlName="phone" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerFirstNameLabel }}</mat-label>
        <input matInput formControlName="firstName" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerLastNameLabel }}</mat-label>
        <input matInput formControlName="lastName" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerEmailLabel }}</mat-label>
        <input matInput formControlName="email" type="email" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-2">
        <mat-label>{{ Labels.CustomerBirthDateLabel }}</mat-label>
        <input matInput [matDatepicker]="picker" formControlName="birthDate" />
        <mat-datepicker-toggle matIconSuffix [for]="picker" />
        <mat-datepicker #picker />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mb-4">
        <mat-label>{{ Labels.CustomerNotesLabel }}</mat-label>
        <textarea matInput formControlName="notes" rows="3"></textarea>
      </mat-form-field>

      <div class="flex gap-2">
        <button mat-flat-button type="submit" [disabled]="form.invalid || saving()">
          {{ Labels.SaveButton }}
        </button>
        <app-form-cancel-button></app-form-cancel-button>
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

  protected readonly form = new FormGroup({
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl<Date | null>(null),
    notes: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    const c = this.customer();
    this.form.reset({
      phone: c.phone,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? '',
      birthDate: c.birthDate ?? null,
      notes: c.notes ?? '',
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.saveCustomer.emit({
      phone: raw.phone,
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email || undefined,
      birthDate: raw.birthDate ?? undefined,
      notes: raw.notes || undefined,
    });
  }
}
