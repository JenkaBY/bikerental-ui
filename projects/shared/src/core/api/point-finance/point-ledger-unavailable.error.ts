export type PointLedgerEndpoint = 'point-positions' | 'point-results' | 'point-movements';

export class PointLedgerUnavailableError extends Error {
  constructor(readonly endpoint: PointLedgerEndpoint) {
    super(`${endpoint} is not available`);
    this.name = 'PointLedgerUnavailableError';
  }
}
