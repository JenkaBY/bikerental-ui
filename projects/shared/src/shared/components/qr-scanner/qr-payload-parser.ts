import { InjectionToken } from '@angular/core';

export type QrPayloadParser = (raw: string) => string | null;

export const rawUidParser: QrPayloadParser = (raw) => {
  const uid = raw.trim();
  return uid.length > 0 ? uid : null;
};

export const QR_PAYLOAD_PARSER = new InjectionToken<QrPayloadParser>('QR_PAYLOAD_PARSER', {
  providedIn: 'root',
  factory: () => rawUidParser,
});
