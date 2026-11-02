import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ShiftClosureDialogComponent } from './shift-closure-dialog.component';
import type {
  ShiftClosureDialogData,
  ShiftClosureDialogResult,
} from './shift-closure-dialog.model';

const DIALOG_WIDTH = '480px';

@Injectable({ providedIn: 'root' })
export class ShiftClosureLauncher {
  private readonly dialog = inject(MatDialog);

  open(data: ShiftClosureDialogData): Observable<ShiftClosureDialogResult | undefined> {
    return this.dialog
      .open<
        ShiftClosureDialogComponent,
        ShiftClosureDialogData,
        ShiftClosureDialogResult
      >(ShiftClosureDialogComponent, { data, width: DIALOG_WIDTH })
      .afterClosed();
  }
}
