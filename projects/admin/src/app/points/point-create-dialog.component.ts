import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Labels, type Point, PointAdminStore } from '@bikerental/shared';
import { PointProfileFormComponent } from './point-profile-form.component';

export interface PointCreateDialogResult {
  readonly slug: string;
}

@Component({
  selector: 'app-point-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointAdminStore],
  imports: [MatDialogModule, PointProfileFormComponent],
  template: `
    <h2 mat-dialog-title>{{ labels.PointRegisterTitle }}</h2>
    <mat-dialog-content>
      <app-point-profile-form [mode]="'create'" (saved)="close($event)" (cancelled)="dismiss()" />
    </mat-dialog-content>
  `,
})
export class PointCreateDialogComponent {
  protected readonly labels = Labels;

  private readonly dialogRef =
    inject<MatDialogRef<PointCreateDialogComponent, PointCreateDialogResult>>(MatDialogRef);

  protected close(point: Point): void {
    this.dialogRef.close({ slug: point.slug });
  }

  protected dismiss(): void {
    this.dialogRef.close();
  }
}
