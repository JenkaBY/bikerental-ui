import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutModeService } from '../../core/layout-mode.service';
import { DashboardCardComponent } from '../../shared/components/dashboard-card/dashboard-card.component';

interface DashboardCardDef {
  id: string;
  title: string;
  description: string;
  ariaLabel: string;
  path: string;
  layoutMode?: 'mobile' | 'desktop';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DashboardCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private router = inject(Router);
  private layout = inject(LayoutModeService);

  protected readonly title = $localize`Bike Rental`;
  protected readonly subtitle = $localize`Choose your dashboard`;

  protected readonly cards: DashboardCardDef[] = [
    {
      id: 'admin',
      title: $localize`Administrator`,
      description: $localize`Manage equipment, tariffs and customers`,
      ariaLabel: $localize`Open administrator dashboard`,
      path: '/admin',
    },
    {
      id: 'operator-mobile',
      title: $localize`Operator (Mobile)`,
      description: $localize`Mobile-first operator flow`,
      ariaLabel: $localize`Open operator dashboard (mobile)`,
      path: '/operator',
      layoutMode: 'mobile',
    },
    {
      id: 'operator-desktop',
      title: $localize`Operator (Desktop)`,
      description: $localize`Desktop layout with sidebar`,
      ariaLabel: $localize`Open operator dashboard (desktop)`,
      path: '/operator',
      layoutMode: 'desktop',
    },
  ];

  onCardSelect(card: DashboardCardDef) {
    if (card.layoutMode) {
      this.layout.setMode(card.layoutMode);
    }
    void this.router.navigate([card.path]);
  }
}
