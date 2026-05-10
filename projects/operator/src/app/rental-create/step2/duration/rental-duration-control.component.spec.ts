import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RentalStore } from '@bikerental/shared';
import { vi } from 'vitest';
import { RentalDurationControlComponent } from './rental-duration-control.component';

function makeStore(durationMinutes = 60) {
  return {
    durationMinutes: signal(durationMinutes),
    setDurationMinutes: vi.fn(),
  };
}

describe('RentalDurationControlComponent', () => {
  let fixture: ComponentFixture<RentalDurationControlComponent>;
  let component: RentalDurationControlComponent;
  let store: ReturnType<typeof makeStore>;

  async function setup(duration = 60) {
    store = makeStore(duration);

    await TestBed.configureTestingModule({
      imports: [RentalDurationControlComponent],
      providers: [provideAnimationsAsync()],
    })
      .overrideComponent(RentalDurationControlComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalDurationControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should call setDurationMinutes with 60 when exact snap value is passed', async () => {
    await setup();
    component['onDurationChange'](60);
    expect(store.setDurationMinutes).toHaveBeenCalledWith(60);
  });

  it('should snap 90 minutes to 120 (nearest snap point)', async () => {
    await setup();
    component['onDurationChange'](90);
    expect(store.setDurationMinutes).toHaveBeenCalledWith(120);
  });

  it('should snap 50 minutes to 60 (nearest snap point)', async () => {
    await setup();
    component['onDurationChange'](50);
    expect(store.setDurationMinutes).toHaveBeenCalledWith(60);
  });

  it('should snap 2000 minutes to 1440 (nearest snap point)', async () => {
    await setup();
    component['onDurationChange'](2000);
    expect(store.setDurationMinutes).toHaveBeenCalledWith(1440);
  });
});
