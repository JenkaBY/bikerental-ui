import { Directive, ElementRef, inject } from '@angular/core';

const PHONE_PATTERN = /[^0-9+]/g;
const PHONE_PATTERN_KEY = /[0-9+]/;

@Directive({
  selector: 'input[appPhoneCharactersOnly]',
  host: {
    '(input)': 'onInput()',
    '(keydown)': 'onKeydown($event)',
    '(paste)': 'onPaste($event)',
  },
})
export class PhoneCharactersOnlyDirective {
  private readonly el = inject(ElementRef<HTMLInputElement>);

  onInput(): void {
    const input = this.el.nativeElement;
    const cleaned = this.clean(input.value);
    if (input.value !== cleaned) {
      input.value = cleaned;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const allowed = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (allowed.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!PHONE_PATTERN_KEY.test(event.key)) {
      event.preventDefault();
      return;
    }
    if (event.key === '+' && this.el.nativeElement.selectionStart !== 0) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';

    const input = this.el.nativeElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    const combined = input.value.slice(0, start) + text + input.value.slice(end);
    const cleaned = this.clean(combined);

    input.value = cleaned;
    input.selectionStart = start + cleaned.length;
    input.selectionEnd = start + cleaned.length;

    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private clean(value: string): string {
    const hasPlus = value.startsWith('+');
    const digits = value.replace(PHONE_PATTERN, '');
    return hasPlus ? '+' + digits.slice(1) : digits;
  }
}
