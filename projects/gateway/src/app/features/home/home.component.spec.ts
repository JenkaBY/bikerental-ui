import { TestBed } from '@angular/core/testing';
import { APP_BRAND, BRAND } from '@bikerental/shared';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();
  });

  it('renders two navigation cards', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const adminBtn = el.querySelector('button[aria-label="Open administrator dashboard"]');
    const operatorBtn = el.querySelector('button[aria-label="Open operator dashboard"]');

    expect(adminBtn).toBeTruthy();
    expect(operatorBtn).toBeTruthy();
  });
});
