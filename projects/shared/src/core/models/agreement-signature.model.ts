export interface SignatureCreated {
  readonly signatureId: number;
  readonly signedAt: Date;
}

export interface RentalSignatureSummary {
  readonly signatureId: number;
  readonly templateId: number;
  readonly templateVersionNumber: number;
  readonly signedAt: Date;
}
