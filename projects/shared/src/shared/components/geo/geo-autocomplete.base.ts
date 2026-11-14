import { Directive, signal } from '@angular/core';
import { GeoControlBase } from './geo-control.base';

export const GEO_SEARCH_DEBOUNCE_MS = 250;

@Directive()
export abstract class GeoAutocompleteBase<T, P = T> extends GeoControlBase<T, P> {
  protected readonly text = signal('');
  protected readonly displayWith = (value: T | null): string => this.display(value);

  override writeValue(value: T | null): void {
    super.writeValue(value);
    this.text.set(this.display(value ?? null));
  }

  protected abstract display(value: T | null): string;

  protected abstract valueFromText(text: string): T | null;

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.text.set(text);
    this.commit(this.valueFromText(text));
  }

  protected select(value: T, pickedValue: P): void {
    this.text.set(this.display(value));
    this.commit(value);
    this.onTouched();
    this.picked.emit(pickedValue);
  }
}
