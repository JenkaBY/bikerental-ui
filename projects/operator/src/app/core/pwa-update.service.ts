import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConfirmDialogComponent, ConfirmDialogData, Labels } from '@bikerental/shared';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private checking = false;
  private promptOpen = false;

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onVersionEvent(event));

    this.swUpdate.unrecoverable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => console.error('PWA service worker unrecoverable:', event.reason));

    void this.checkForUpdate();

    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => void this.checkForUpdate());
  }

  private onVersionEvent(event: VersionEvent): void {
    if (event.type === 'VERSION_READY') {
      this.promptReload();
    } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
      console.error('PWA version installation failed:', event.error);
    }
  }

  private async checkForUpdate(): Promise<void> {
    if (this.checking) return;
    this.checking = true;
    try {
      await this.swUpdate.checkForUpdate();
    } catch (err) {
      console.error('PWA update check failed:', err);
    } finally {
      this.checking = false;
    }
  }

  private promptReload(): void {
    if (this.promptOpen) return;
    this.promptOpen = true;

    const data: ConfirmDialogData = {
      title: Labels.PwaUpdateTitle,
      message: Labels.PwaUpdateMessage,
      confirmLabel: Labels.PwaUpdateReload,
    };

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data,
        disableClose: true,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.activateAndReload());
  }

  private async activateAndReload(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
    } catch (err) {
      console.error('PWA activate update failed:', err);
    } finally {
      document.location.reload();
    }
  }
}
