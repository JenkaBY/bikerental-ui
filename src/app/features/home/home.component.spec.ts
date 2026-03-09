import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { provideRouter } from '@angular/router';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the three CTAs and sets layout mode when operator buttons clicked', () => {
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
