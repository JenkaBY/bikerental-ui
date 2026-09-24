import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
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
  PointAdminStore,
  suppressErrorNotification,
} from '@bikerental/shared';
import type { Point, PointWrite } from '@ui-models';
import { PointStatusActionsComponent } from './point-status-actions.component';
import { POINT_STATUS_CLASSES, POINT_STATUS_LABELS } from './point-status';

@Component({
  selector: 'app-point-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    PointStatusActionsComponent,
  ],
  templateUrl: './point-detail.component.html',
})
export class PointDetailComponent {
  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;
  protected readonly statusLabels = POINT_STATUS_LABELS;
  protected readonly statusClasses = POINT_STATUS_CLASSES;
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

  private readonly store = inject(PointAdminStore);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = new ErrorMessageResolver();
  private readonly destroyRef = inject(DestroyRef);

  protected readonly point = this.store.selected;
  protected readonly creating = this.store.creating;
  protected readonly editing = this.store.editing;
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
    effect(() => this.resetForm(this.point(), this.creating(), this.editing()));
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;
    clearServerErrors(this.form);
    const write: PointWrite = this.form.getRawValue();
    const options = { context: suppressErrorNotification() };
    const current = this.point();
    const request$ = current
      ? this.store.update(current.id, write, options)
      : this.store.create(write, options);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.notifications.success(Labels.PointSaved),
      error: (err) => this.handleSaveError(err),
    });
  }

  protected edit(): void {
    this.store.startEdit();
  }

  protected cancel(): void {
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
