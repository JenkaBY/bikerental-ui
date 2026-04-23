import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AppBrandComponent } from './app-brand.component';
import { APP_BRAND } from '../../../app.tokens';

@Component({
  standalone: true,
  imports: [AppBrandComponent],
  template: `<app-brand [brand]="brand"></app-brand>`,
})
class HostWithBrandComponent {
  brand = 'Test Brand';
}

describe('AppBrandComponent', () => {
  it('uses input brand when provided', async () => {
    await TestBed.configureTestingModule({
      imports: [HostWithBrandComponent],
      providers: [{ provide: APP_BRAND, useValue: 'Bike Rental' }],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostWithBrandComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test Brand');
  });

  it('falls back to APP_BRAND token when input not provided', async () => {
    await TestBed.configureTestingModule({
      imports: [AppBrandComponent],
      providers: [{ provide: APP_BRAND, useValue: 'TokenBrand' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppBrandComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('TokenBrand');
  });
});
