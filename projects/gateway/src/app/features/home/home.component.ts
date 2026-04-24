import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, LOCALE_ID } from '@angular/core';
import { DashboardCardComponent } from '@bikerental/shared';

interface DashboardCardDef {
  id: string;
  title: string;
  description: string;
  ariaLabel: string;
  href: string;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardCardComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <header class="mb-6 text-center">
        <h1 class="text-3xl font-semibold">{{ title }}</h1>
        <p class="text-sm text-slate-500 mt-2">{{ subtitle }}</p>
      </header>

      <div class="grid gap-4 grid-cols-1 sm:grid-cols-3">
        @for (card of cards; track card.id) {
          <app-dashboard-card
            [title]="card.title"
            [description]="card.description"
            [ariaLabel]="card.ariaLabel"
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

  protected readonly title = $localize`Bike Rental`;
  protected readonly subtitle = $localize`Choose your dashboard`;

  protected readonly cards: DashboardCardDef[] = [
    {
      id: 'admin',
      title: $localize`Administrator`,
      description: $localize`Manage equipment, tariffs and customers`,
      ariaLabel: $localize`Open administrator dashboard`,
      href: 'admin/',
    },
    {
      id: 'operator-mobile',
      title: $localize`Operator (Mobile)`,
      description: $localize`Mobile-first operator flow`,
      ariaLabel: $localize`Open operator dashboard (mobile)`,
      href: 'operator/',
    },
    {
      id: 'operator-desktop',
      title: $localize`Operator (Desktop)`,
      description: $localize`Desktop layout with sidebar`,
      ariaLabel: $localize`Open operator dashboard (desktop)`,
      href: 'operator/',
    },
  ];

  onCardSelect(card: DashboardCardDef): void {
    const locale = this.localeId.split('-')[0];
    const baseURL = new URL(this.document.baseURI);
    const rootSegments = baseURL.pathname.split('/').filter(Boolean).slice(0, -1);
    const appBase = rootSegments.length
      ? `${baseURL.origin}/${rootSegments.join('/')}/`
      : `${baseURL.origin}/`;
    this.document.location.href = `${appBase}${card.href}${locale}/`;
  }
}
