import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Labels } from '../../constant/labels';

interface Point {
  readonly x: number;
  readonly y: number;
}

const STROKE_COLOR = '#1e293b';
const STROKE_WIDTH = 2.5;

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="flex flex-col gap-2">
      <div
        class="relative w-full overflow-hidden rounded-lg border border-slate-300 bg-white"
        [style.height.px]="height()"
      >
        <canvas
          #canvas
          class="absolute inset-0 h-full w-full touch-none select-none"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerEnd($event)"
          (pointercancel)="onPointerEnd($event)"
        ></canvas>
        @if (isEmpty()) {
          <span
            class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400"
          >
            {{ Labels.SignatureHint }}
          </span>
        }
      </div>
      <div class="flex justify-end">
        <button
          mat-stroked-button
          type="button"
          [disabled]="isEmpty() || disabled()"
          (click)="clear()"
        >
          <mat-icon>backspace</mat-icon>
          {{ Labels.SignatureClear }}
        </button>
      </div>
    </div>
  `,
})
export class SignaturePadComponent {
  protected readonly Labels = Labels;

  readonly height = input(200);
  readonly disabled = input(false);
  readonly emptyChanged = output<boolean>();

  readonly isEmpty = signal(true);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private strokes: Point[][] = [];
  private activePointerId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas();
      this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
      this.resizeObserver.observe(this.canvasRef().nativeElement);
    });
    inject(DestroyRef).onDestroy(() => this.resizeObserver?.disconnect());
  }

  toDataUrl(): string | null {
    if (this.isEmpty()) return null;
    return this.canvasRef().nativeElement.toDataURL('image/png');
  }

  clear(): void {
    this.strokes = [];
    this.activePointerId = null;
    this.redraw();
    this.setEmpty(true);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.disabled() || this.activePointerId !== null) return;
    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.canvasRef().nativeElement.setPointerCapture(event.pointerId);
    this.strokes.push([this.toCanvasPoint(event)]);
    this.redraw();
    this.setEmpty(false);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    event.preventDefault();
    const stroke = this.strokes[this.strokes.length - 1];
    stroke.push(this.toCanvasPoint(event));
    this.drawSegment(stroke);
  }

  protected onPointerEnd(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    this.activePointerId = null;
  }

  private toCanvasPoint(event: PointerEvent): Point {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef().nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    this.redraw();
  }

  private context(): CanvasRenderingContext2D {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = STROKE_COLOR;
    ctx.fillStyle = STROKE_COLOR;
    return ctx;
  }

  private redraw(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = this.context();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (const stroke of this.strokes) {
      this.paintStroke(ctx, stroke);
    }
  }

  private drawSegment(stroke: Point[]): void {
    const ctx = this.context();
    const from = stroke[stroke.length - 2] ?? stroke[stroke.length - 1];
    const to = stroke[stroke.length - 1];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  private paintStroke(ctx: CanvasRenderingContext2D, stroke: Point[]): void {
    if (stroke.length === 0) return;
    if (stroke.length === 1) {
      ctx.beginPath();
      ctx.arc(stroke[0].x, stroke[0].y, STROKE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (const point of stroke.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }

  private setEmpty(empty: boolean): void {
    if (this.isEmpty() !== empty) {
      this.isEmpty.set(empty);
      this.emptyChanged.emit(empty);
    }
  }
}
