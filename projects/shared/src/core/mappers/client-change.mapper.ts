import type { ClientChangeResponse, FieldChangeResponse } from '@api-models';
import type { ClientChange, ClientFieldChange } from '../models/client-change.model';

export class ClientChangeMapper {
  static fromResponse(r: ClientChangeResponse): ClientChange {
    return {
      id: r.id,
      kind: r.kind,
      changedAt: new Date(r.changedAt),
      changedBy: r.changedBy ?? null,
      reason: r.reason || null,
      changes: (r.changes ?? []).map(ClientChangeMapper.fieldFromResponse),
    };
  }

  private static fieldFromResponse(r: FieldChangeResponse): ClientFieldChange {
    return {
      field: r.field,
      previousValue: r.previousValue ?? null,
      newValue: r.newValue ?? null,
    };
  }
}
