import type { SetTimeRequest } from '@api-models';
import type { ServerTime } from '@ui-models';

export class TimeTravelMapper {
  static fromSseMessage(raw: string): ServerTime {
    const parsed = JSON.parse(raw) as { instant: string; fixed: boolean };
    return {
      instant: new Date(parsed.instant),
      fixed: parsed.fixed,
    };
  }

  static toSetRequest(date: Date): SetTimeRequest {
    return { instant: date.toISOString() };
  }
}
