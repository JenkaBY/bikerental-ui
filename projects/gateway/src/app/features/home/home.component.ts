import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, LOCALE_ID } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { map } from 'rxjs';
import {
  APP_BRAND,
  DashboardCardComponent,
  DeployedPath,
  environment,
  FormErrorMessages,
  Labels,
  localeSegment,
  TENANT_APPS,
  TENANT_SLUG_PATTERN,
} from '@bikerental/shared';

interface DashboardCardDef {
  id: string;
  title: string;
  description: string;
  ariaLabel: string;
  app: string;
}

const normalizeSlug = (value: string): string => value.trim().toLowerCase();

function businessSlugValidator(control: AbstractControl<string>): ValidationErrors | null {
  return !control.value || TENANT_SLUG_PATTERN.test(normalizeSlug(control.value))
    ? null
    : { pattern: true };
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardCardComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <header class="mb-6 text-center">
        <h1 class="text-3xl font-semibold">{{ title }}</h1>
        <p class="text-sm text-slate-500 mt-2">{{ subtitle }}</p>
      </header>

      <form class="mb-4" (submit)="$event.preventDefault(); openBusinessApp('admin')">
        <mat-form-field class="w-full">
          <mat-label>{{ labels.BusinessSlug }}</mat-label>
          <input
            matInput
            [formControl]="slug"
            autocomplete="organization"
            autocapitalize="none"
            spellcheck="false"
          />
          <mat-hint>{{ labels.BusinessSlugHint }}</mat-hint>
          @if (slug.hasError('required')) {
            <mat-error>{{ errors.slugRequired }}</mat-error>
          } @else if (slug.hasError('pattern')) {
            <mat-error>{{ errors.businessSlugPattern }}</mat-error>
          }
        </mat-form-field>
      </form>

      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
        @for (card of cards; track card.id) {
          <app-dashboard-card
            [title]="card.title"
            [description]="card.description"
            [ariaLabel]="card.ariaLabel"
            [disabled]="isTenantApp(card.app) && !slugValid()"
            (activate)="onCardSelect(card)"
          ></app-dashboard-card>
        }
      </div>
    </div>
  `,
})
export class HomeComponent {
  private readonly document = inject(DOCUMENT);
  private readonly localeId = inject(LOCALE_ID);

  protected readonly title = inject(APP_BRAND);
  protected readonly subtitle = $localize`Choose your dashboard`;
  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;

  protected readonly slug = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, businessSlugValidator],
  });

  protected readonly slugValid = toSignal(this.slug.statusChanges.pipe(map((s) => s === 'VALID')), {
    initialValue: false,
  });

  protected readonly cards: DashboardCardDef[] = [
    {
      id: 'admin',
      title: $localize`Administrator`,
      description: $localize`Manage equipment, tariffs and customers`,
      ariaLabel: $localize`Open administrator dashboard`,
      app: 'admin',
    },
    {
      id: 'operator',
      title: $localize`Operator`,
      description: $localize`Operator rental flow`,
      ariaLabel: $localize`Open operator dashboard`,
      app: 'operator',
    },
    {
      id: 'platform',
      title: $localize`Platform`,
      description: $localize`Manage the platform and its managers`,
      ariaLabel: $localize`Open platform dashboard`,
      app: 'platform',
    },
  ];

  protected isTenantApp(app: string): boolean {
    return TENANT_APPS.includes(app);
  }

  onCardSelect(card: DashboardCardDef): void {
    if (this.isTenantApp(card.app)) {
      this.openBusinessApp(card.app);
      return;
    }
    this.document.location.href = this.appPath(card.app).toString();
  }

  protected openBusinessApp(app: string): void {
    this.slug.markAsTouched();
    if (this.slug.invalid) {
      return;
    }
    const slug = normalizeSlug(this.slug.value);
    const template =
      app === 'admin' ? environment.adminAddressTemplate : environment.operatorAddressTemplate;
    this.document.location.href = template
      ? template.replace('{slug}', slug)
      : this.appPath(app).withSlug(slug).toString();
  }

  private appPath(app: string): DeployedPath {
    const locale = localeSegment(this.localeId) ?? this.localeId.split('-')[0];
    return DeployedPath.fromBase(this.document.baseURI).withApp(app).withLocale(locale);
  }
}
