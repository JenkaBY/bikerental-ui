import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  Labels,
  NotificationService,
} from '@bikerental/shared';

const CHECK_THROTTLE_MS = 15 * 60 * 1000;
const CHECK_TIMEOUT_MS = 30 * 1000;

interface AppVersionData {
  version?: string;
  buildTime?: string;
}

function describeVersion(version: { hash: string; appData?: object }): string {
  const shortHash = version.hash.slice(0, 8);
  const stamped = (version.appData as AppVersionData | undefined)?.version;
  return stamped ? `${stamped} (${shortHash})` : shortHash;
}

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private lastCheckAt = 0;
  private promptOpen = false;

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onVersionEvent(event));

    this.swUpdate.unrecoverable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onUnrecoverable(event.reason));

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
      console.info(
        `PWA update ready: ${describeVersion(event.currentVersion)} -> ${describeVersion(event.latestVersion)}`,
      );
      this.promptReload();
    } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
      console.error(
        `PWA version installation failed for ${describeVersion(event.version)}:`,
        event.error,
      );
    }
  }

  private onUnrecoverable(reason: string): void {
    console.error('PWA service worker unrecoverable:', reason);
    this.prompt(
      {
        title: Labels.PwaUnrecoverableTitle,
        message: Labels.PwaUnrecoverableMessage,
        confirmLabel: Labels.PwaUpdateReload,
      },
      () => document.location.reload(),
    );
  }

  private async checkForUpdate(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCheckAt < CHECK_THROTTLE_MS) return;
    this.lastCheckAt = now;

    try {
      await this.withTimeout(this.swUpdate.checkForUpdate());
    } catch (err) {
      console.error('PWA update check failed:', err);
    }
  }

  private withTimeout<T>(work: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('checkForUpdate timed out')), CHECK_TIMEOUT_MS);
    });
    return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
  }

  private promptReload(): void {
    this.prompt(
      {
        title: Labels.PwaUpdateTitle,
        message: Labels.PwaUpdateMessage,
        confirmLabel: Labels.PwaUpdateReload,
        cancelLabel: Labels.PwaUpdateLater,
      },
      () => void this.activateAndReload(),
    );
  }

  private prompt(data: ConfirmDialogData, onConfirm: () => void): void {
    if (this.promptOpen) return;
    this.promptOpen = true;

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        this.promptOpen = false;
        if (confirmed) onConfirm();
      });
  }

  private async activateAndReload(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch (err) {
      console.error('PWA activate update failed:', err);
      this.notifications.error(Labels.PwaUpdateFailed);
    }
  }
}
