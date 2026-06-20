import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { BarcodeScannerService, QrDetector } from './barcode-scanner.service';
import { QR_PAYLOAD_PARSER } from './qr-payload-parser';

export type QrScanError = 'permission-denied' | 'no-camera' | 'engine';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full overflow-hidden rounded-lg bg-black">
      <video #video class="block w-full" muted autoplay playsinline></video>
      <div class="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/70"></div>
    </div>
  `,
})
export class QrScannerComponent {
  private readonly scanner = inject(BarcodeScannerService);
  private readonly parse = inject(QR_PAYLOAD_PARSER);

  readonly active = input(true);
  readonly scanned = output<string>();
  readonly scanError = output<QrScanError>();

  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  private stream: MediaStream | null = null;
  private detector: QrDetector | null = null;
  private rafId = 0;
  private lastValue: string | null = null;
  private running = false;

  constructor() {
    effect(() => {
      if (this.active()) {
        void this.start();
      } else {
        this.stop();
      }
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  private async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch (e) {
      this.running = false;
      this.scanError.emit(this.toError(e));
      return;
    }
    const video = this.video().nativeElement;
    video.srcObject = this.stream;
    try {
      await video.play();
      this.detector = await this.scanner.createDetector();
    } catch {
      this.running = false;
      this.scanError.emit('engine');
      return;
    }
    this.loop();
  }

  private loop(): void {
    const tick = async (): Promise<void> => {
      if (!this.running || !this.detector) return;
      const video = this.video().nativeElement;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const raw = (await this.detector.detect(video))[0]?.rawValue;
          if (raw && raw !== this.lastValue) {
            const uid = this.parse(raw);
            if (uid) {
              this.lastValue = raw;
              this.scanned.emit(uid);
            }
          }
        } catch {
          // transient decode error — keep scanning
        }
      }
      this.rafId = requestAnimationFrame(() => void tick());
    };
    this.rafId = requestAnimationFrame(() => void tick());
  }

  private stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.lastValue = null;
    this.detector = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private toError(e: unknown): QrScanError {
    if (e instanceof DOMException) {
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') return 'permission-denied';
      if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') return 'no-camera';
    }
    return 'engine';
  }
}
