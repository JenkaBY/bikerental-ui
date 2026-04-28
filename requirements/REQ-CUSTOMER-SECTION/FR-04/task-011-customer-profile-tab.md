# Task 011: Customer Profile Tab

> **Applied Skills:** `angular-component` (standalone, OnPush), `angular-forms` (Signal Forms — experimental; see note), `angular-signals` (signal() for editMode), `angular-di` (inject CustomerLayoutStore), `angular-testing` (Vitest, TestBed).

## 1. Objective

Create `CustomerProfileComponent` as a thin consumer tab. It injects `CustomerLayoutStore`, renders customer fields in view mode, toggles to edit mode, and calls `store.updateCustomer(write)` on Save. On success it returns to view mode. On error it stays in edit mode. The `email` field is optional.

**Forms Note:** Use Angular Reactive Forms (`ReactiveFormsModule`) rather than experimental Signal Forms for this component to maintain production stability.

## 2. Files to Modify / Create

### File 1 — Component

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-profile/customer-profile.component.ts`
* **Action:** Create New File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Labels } from '@bikerental/shared';
import { CustomerLayoutStore } from '../../customer-layout.store';

@Component({
  selector: 'app-customer-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  template: `
    <div class="p-4 md:p-6 max-w-lg">
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
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
            <button mat-button type="button" (click)="cancel()">{{ Labels.CancelButton }}</button>
          </div>
        </form>
      } @else {
        <dl class="flex flex-col gap-3 mb-6">
          <div>
            <dt class="text-xs text-slate-500">{{ Labels.CustomerPhoneLabel }}</dt>
            <dd class="font-medium">{{ store.customer()?.phone }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{{ Labels.CustomerFirstNameLabel }}</dt>
            <dd>{{ store.customer()?.firstName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{{ Labels.CustomerLastNameLabel }}</dt>
            <dd>{{ store.customer()?.lastName }}</dd>
          </div>
          @if (store.customer()?.email) {
            <div>
              <dt class="text-xs text-slate-500">{{ Labels.CustomerEmailLabel }}</dt>
              <dd>{{ store.customer()?.email }}</dd>
            </div>
          }
          @if (store.customer()?.birthDate) {
            <div>
              <dt class="text-xs text-slate-500">{{ Labels.CustomerBirthDateLabel }}</dt>
              <dd>{{ store.customer()?.birthDate | date }}</dd>
            </div>
          }
          @if (store.customer()?.notes) {
            <div>
              <dt class="text-xs text-slate-500">{{ Labels.CustomerNotesLabel }}</dt>
              <dd>{{ store.customer()?.notes }}</dd>
            </div>
          }
        </dl>
        <button mat-stroked-button (click)="enterEdit()">{{ Labels.CustomerEditButton }}</button>
      }
    </div>
  `,
})
export class CustomerProfileComponent implements OnInit {
  protected readonly Labels = Labels;

  protected readonly store = inject(CustomerLayoutStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly editMode = signal(false);
  protected readonly saving = signal(false);

  protected readonly form = new FormGroup({
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl<Date | null>(null),
    notes: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {}

  protected enterEdit(): void {
    const c = this.store.customer();
    if (!c) return;
    this.form.reset({
      phone: c.phone,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? '',
      birthDate: c.birthDate ?? null,
      notes: c.notes ?? '',
    });
    this.editMode.set(true);
  }

  protected cancel(): void {
    this.editMode.set(false);
  }

  protected save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.saving.set(true);

    this.store
      .updateCustomer({
        phone: raw.phone,
        firstName: raw.firstName,
        lastName: raw.lastName,
        email: raw.email || undefined,
        birthDate: raw.birthDate ?? undefined,
        notes: raw.notes || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editMode.set(false);
          this.snackBar.open(Labels.CustomerSaveSuccess, undefined, { duration: 3000 });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open(Labels.CustomerSaveError, undefined, { duration: 3000 });
        },
      });
  }
}
```

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-profile/customer-profile.component.spec.ts`
* **Action:** Create New File

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerProfileComponent } from './customer-profile.component';
import { CustomerLayoutStore } from '../../customer-layout.store';

const makeStore = () => ({
  customer: signal({
    id: '1',
    phone: '+375291234567',
    firstName: 'Ivan',
    lastName: 'Ivanov',
    email: undefined,
    birthDate: undefined,
    notes: undefined,
  }),
  updateCustomer: vi.fn().mockReturnValue(of(undefined)),
});

describe('CustomerProfileComponent', () => {
  let fixture: ComponentFixture<CustomerProfileComponent>;
  let store: ReturnType<typeof makeStore>;
  const snackOpen = vi.fn();

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [CustomerProfileComponent, MatNativeDateModule],
      providers: [
        { provide: CustomerLayoutStore, useValue: store },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerProfileComponent);
    fixture.detectChanges();
  });

  it('should render view mode with customer phone', () => {
    expect(fixture.nativeElement.textContent).toContain('+375291234567');
  });

  it('should enter edit mode on edit button click', () => {
    fixture.nativeElement.querySelector('button[mat-stroked-button]').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.editMode()).toBe(true);
  });

  it('should call store.updateCustomer on save', () => {
    fixture.componentInstance.enterEdit();
    fixture.detectChanges();
    fixture.componentInstance.save();
    expect(store.updateCustomer).toHaveBeenCalled();
  });

  it('should show error snackbar when save fails', () => {
    store.updateCustomer.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.enterEdit();
    fixture.componentInstance.save();
    expect(snackOpen).toHaveBeenCalledWith(expect.stringContaining('Failed'), undefined, expect.any(Object));
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-detail/tabs/customer-profile/customer-profile.component.spec.ts
```
