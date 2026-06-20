import { Injectable } from '@angular/core';
import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill';

const QR_FORMAT = 'qr_code';

export interface QrDetector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}

interface NativeBarcodeDetector {
  new (options?: { formats?: string[] }): QrDetector;
  getSupportedFormats?(): Promise<string[]>;
}

@Injectable({ providedIn: 'root' })
export class BarcodeScannerService {
  private wasmPrepared = false;

  async createDetector(): Promise<QrDetector> {
    const native = (globalThis as { BarcodeDetector?: NativeBarcodeDetector }).BarcodeDetector;
    if (native) {
      try {
        const supported = (await native.getSupportedFormats?.()) ?? [QR_FORMAT];
        if (supported.includes(QR_FORMAT)) {
          return new native({ formats: [QR_FORMAT] });
        }
      } catch {
        // fall through to the bundled WebAssembly engine
      }
    }
    this.prepareWasm();
    return new BarcodeDetector({ formats: [QR_FORMAT] });
  }

  private prepareWasm(): void {
    if (this.wasmPrepared) return;
    this.wasmPrepared = true;
    prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) =>
          path.endsWith('.wasm') ? `zxing/${path}` : prefix + path,
      },
    });
  }
}
