import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  ApiErrorParser,
  ClientRegistryStore,
  ErrorMessageResolver,
  GeoLocationLookupStore,
  Labels,
  PageHeaderComponent,
  suppressErrorNotification,
} from '@bikerental/shared';
import type { Client } from '@bikerental/shared';
import { ClientStatusBadgeComponent } from './client-status-badge.component';
import { ClientFormDialogComponent } from './client-form-dialog.component';
import { ClientChangeHistoryComponent } from './client-change-history.component';
import type { ClientFormDialogData } from './client-form-dialog.component';

@Component({
  selector: 'app-client-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeaderComponent,
    ClientStatusBadgeComponent,
    ClientChangeHistoryComponent,
  ],
  templateUrl: './client-details.component.html',
})
export class ClientDetailsComponent {
  readonly slug = input.required<string>();

  protected readonly Labels = Labels;
  protected readonly store = inject(ClientRegistryStore);
  protected readonly lookup = inject(GeoLocationLookupStore);
  protected readonly error = signal<string | null>(null);
  protected readonly client = computed(() => {
    const client = this.store.client();
    return client?.slug === this.slug() ? client : null;
  });

  private readonly resolver = inject(ErrorMessageResolver);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => this.load(slug));
    });
  }

  protected reload(): void {
    this.load(this.slug());
  }

  protected back(): void {
    void this.router.navigate(['clients']);
  }

  protected edit(client: Client): void {
    this.dialog.open<ClientFormDialogComponent, ClientFormDialogData, Client>(
      ClientFormDialogComponent,
      { data: { client } },
    );
  }

  private load(slug: string): void {
    this.error.set(null);
    this.store
      .loadClient(slug, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (client) => this.lookup.ensure([client.businessGeoLocationId]),
        error: (err: unknown) => this.error.set(this.resolver.resolve(ApiErrorParser.parse(err))),
      });
  }
}
