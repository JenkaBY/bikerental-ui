import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Labels } from '../../../constant/labels';

@Component({
  selector: 'app-customer-comments-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      @for (comment of comments(); track $index) {
        <p class="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{{ comment }}</p>
      } @empty {
        <p class="text-sm text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
          {{ Labels.CustomerNoComments }}
        </p>
      }
    </div>
  `,
})
export class CustomerCommentsListComponent {
  protected readonly Labels = Labels;

  readonly comments = input<string[]>([]);
}
