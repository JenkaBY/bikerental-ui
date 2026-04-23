import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();
  });

  it('renders three navigation cards', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const adminBtn = el.querySelector('button[aria-label="Open administrator dashboard"]');
    const opMobile = el.querySelector('button[aria-label="Open operator dashboard (mobile)"]');
    const opDesktop = el.querySelector('button[aria-label="Open operator dashboard (desktop)"]');

    expect(adminBtn).toBeTruthy();
    expect(opMobile).toBeTruthy();
    expect(opDesktop).toBeTruthy();
  });
});
