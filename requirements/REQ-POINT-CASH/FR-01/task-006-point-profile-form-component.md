# Task 006: `PointProfileFormComponent` (input-driven point form, create + edit modes)

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `input()` / `output()`, `inject()`. `angular-forms` - typed reactive `FormGroup` with `nonNullable` controls (fields and validators copied unchanged from `PointDetailComponent`). `error-handling` - request sent with `suppressErrorNotification()`, `ApiErrorParser.parse` + `ErrorMessageResolver.resolve`, `point.slug.duplicate` bound to the slug control, other field errors via `applyServerErrors`, toasts only through `NotificationService`.

## 1. Objective

Extract the point form out of the store-selection-driven `PointDetailComponent` into a reusable, input-driven `PointProfileFormComponent`. FR-01 hosts it in `mode="create"` inside the "New point" dialog (Task 007). FR-02's Profile tab will host the same component in `mode="edit"` (do NOT build any FR-02 tab here). Fields, validators, server-error binding and the `Labels.PointSaved` success toast are identical to today. The header (title, status pill, status actions) is intentionally NOT part of the form: the dialog provides its own title, and FR-02's page header provides name/status.

`PointDetailComponent` is NOT touched in this task; it is deleted in Task 009 once the page no longer uses it.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-profile-form.component.ts`
* **Action:** Create New File

* **File Path:** `projects/admin/src/app/points/point-profile-form.component.html`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/admin/src/app/points/point-profile-form.component.ts`
* **Snippet:**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyServerErrors,
  clearServerErrors,
  ErrorCode,
  ErrorMessageResolver,
  FormErrorMessages,
  Labels,
  NotificationService,
  phonePatternValidator,
  type Point,
  PointAdminStore,
  type PointWrite,
  suppressErrorNotification,
} from '@bikerental/shared';

export type PointProfileFormMode = 'create' | 'edit';

@Component({
  selector: 'app-point-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './point-profile-form.component.html',
})
export class PointProfileFormComponent {
  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;
  protected readonly addressFields = [
    { key: 'street', label: Labels.PointStreet },
    { key: 'city', label: Labels.PointCity },
    { key: 'country', label: Labels.PointCountry },
  ] as const;
  protected readonly contactFields = [
    { key: 'primaryPhone', label: Labels.PointPrimaryPhone, type: 'tel' },
    { key: 'additionalPhone', label: Labels.PointAdditionalPhone, type: 'tel' },
    { key: 'email', label: Labels.Email, type: 'email' },
  ] as const;

  readonly mode = input.required<PointProfileFormMode>();
  readonly point = input<Point | null>(null);

  readonly saved = output<Point>();
  readonly cancelled = output<void>();

  private readonly store = inject(PointAdminStore);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = new ErrorMessageResolver();
  private readonly destroyRef = inject(DestroyRef);

  protected readonly creating = computed(() => this.mode() === 'create');
  protected readonly editing = computed(() => this.creating() || this.store.editing());
  protected readonly saving = this.store.saving;
  protected readonly closed = computed(() => this.point()?.status === 'PERMANENTLY_CLOSED');

  protected readonly form = new FormGroup({
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormGroup({
      street: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      country: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    }),
    contacts: new FormGroup({
      primaryPhone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, phonePatternValidator()],
      }),
      additionalPhone: new FormControl('', {
        nonNullable: true,
        validators: [phonePatternValidator()],
      }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    }),
  });

  constructor() {
    effect(() =>
      this.resetForm(this.creating() ? null : this.point(), this.creating(), this.editing()),
    );
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;
    clearServerErrors(this.form);
    const write: PointWrite = this.form.getRawValue();
    const options = { context: suppressErrorNotification() };
    const current = this.point();
    const request$ =
      this.creating() || !current
        ? this.store.create(write, options)
        : this.store.update(current.slug, write, options);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (point) => {
        this.notifications.success(Labels.PointSaved);
        this.saved.emit(point);
      },
      error: (err) => this.handleSaveError(err),
    });
  }

  protected edit(): void {
    this.store.startEdit();
  }

  protected cancel(): void {
    if (this.creating()) {
      this.cancelled.emit();
      return;
    }
    this.store.cancelEdit();
  }

  private handleSaveError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    const message = this.resolver.resolve(apiError);
    if (apiError.code === ErrorCode.POINT_SLUG_DUPLICATE) {
      this.form.controls.slug.setErrors({ server: message });
      this.form.controls.slug.markAsTouched();
      return;
    }
    const summary = applyServerErrors(this.form, apiError);
    if (summary.length) {
      this.notifications.error(summary.join(' '));
    } else if (apiError.fieldErrors.length === 0) {
      this.notifications.error(message);
    }
  }

  private resetForm(point: Point | null, creating: boolean, editing: boolean): void {
    this.form.reset({
      slug: point?.slug ?? '',
      name: point?.name ?? '',
      address: point?.address ?? { street: '', city: '', country: '' },
      contacts: {
        primaryPhone: point?.contacts.primaryPhone ?? '',
        additionalPhone: point?.contacts.additionalPhone ?? '',
        email: point?.contacts.email ?? '',
      },
    });
    if (creating) {
      this.form.enable();
    } else if (!editing) {
      this.form.disable();
    } else {
      this.form.enable();
      this.form.controls.slug.disable();
    }
  }
}
```

* **Location:** Whole content of NEW file `projects/admin/src/app/points/point-profile-form.component.html`
* **Snippet:**

```html
@if (point() || creating()) {
  <form [formGroup]="form" class="flex flex-col gap-2" (ngSubmit)="save()">
    @if (closed()) {
      <p class="text-slate-500">{{ labels.PointClosedReadOnly }}</p>
    }

    <div class="grid grid-cols-2 gap-x-4">
      <mat-form-field appearance="outline">
        <mat-label>{{ labels.Slug }}</mat-label>
        <input matInput formControlName="slug" />
        @if (creating()) {
          <mat-hint>{{ labels.PointSlugHint }}</mat-hint>
        }
        @if (form.controls.slug.hasError('required')) {
          <mat-error>{{ errors.slugRequired }}</mat-error>
        }
        @if (form.controls.slug.hasError('server')) {
          <mat-error>{{ form.controls.slug.getError('server') }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ labels.Name }}</mat-label>
        <input matInput formControlName="name" />
        @if (form.controls.name.hasError('required')) {
          <mat-error>{{ errors.nameRequired }}</mat-error>
        }
        @if (form.controls.name.hasError('server')) {
          <mat-error>{{ form.controls.name.getError('server') }}</mat-error>
        }
      </mat-form-field>
    </div>

    <h3 class="text-base font-medium m-0">{{ labels.PointAddressTitle }}</h3>
    <div formGroupName="address" class="grid grid-cols-3 gap-x-4">
      @for (f of addressFields; track f.key) {
        <mat-form-field appearance="outline">
          <mat-label>{{ f.label }}</mat-label>
          <input matInput [formControlName]="f.key" />
          @if (form.controls.address.controls[f.key].hasError('required')) {
            <mat-error>{{ errors.required }}</mat-error>
          }
          @if (form.controls.address.controls[f.key].hasError('server')) {
            <mat-error>{{ form.controls.address.controls[f.key].getError('server') }}</mat-error>
          }
        </mat-form-field>
      }
    </div>

    <h3 class="text-base font-medium m-0">{{ labels.PointContactsTitle }}</h3>
    <div formGroupName="contacts" class="grid grid-cols-3 gap-x-4">
      @for (f of contactFields; track f.key) {
        <mat-form-field appearance="outline">
          <mat-label>{{ f.label }}</mat-label>
          <input matInput [type]="f.type" [formControlName]="f.key" />
          @if (form.controls.contacts.controls[f.key].hasError('required')) {
            <mat-error>{{ errors.phoneRequired }}</mat-error>
          }
          @if (form.controls.contacts.controls[f.key].hasError('phonePattern')) {
            <mat-error>{{ errors.phonePattern }}</mat-error>
          }
          @if (form.controls.contacts.controls[f.key].hasError('email')) {
            <mat-error>{{ errors.emailInvalid }}</mat-error>
          }
          @if (form.controls.contacts.controls[f.key].hasError('server')) {
            <mat-error>{{ form.controls.contacts.controls[f.key].getError('server') }}</mat-error>
          }
        </mat-form-field>
      }
    </div>

    @if (editing()) {
      <div class="flex justify-end gap-2">
        <button mat-button type="button" [disabled]="saving()" (click)="cancel()">
          {{ labels.Cancel }}
        </button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          {{ labels.Save }}
        </button>
      </div>
    } @else if (point() && !closed()) {
      <div class="flex justify-end gap-2">
        <button mat-stroked-button type="button" (click)="edit()">{{ labels.Edit }}</button>
      </div>
    }
  </form>
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint admin
```
