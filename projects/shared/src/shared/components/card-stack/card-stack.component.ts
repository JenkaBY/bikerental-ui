import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardStackVariant = 'panel' | 'inset';

@Component({
  selector: 'app-card-stack',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
  template: `<ng-content />`,
})
export class CardStackComponent {
  readonly variant = input<CardStackVariant>('panel');

  protected readonly hostClass = computed(() =>
    this.variant() === 'inset'
      ? 'block [&>*]:block [&>*+*]:border-t rounded-lg bg-slate-50 border border-slate-200 [&>*+*]:border-slate-200'
      : 'block [&>*]:block [&>*+*]:border-t rounded-xl bg-white border border-slate-200 shadow-sm [&>*+*]:border-slate-100',
  );
}
