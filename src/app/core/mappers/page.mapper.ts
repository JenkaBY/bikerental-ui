import { Page } from '../models';
import { PageRequest } from '@api-models';

interface ApiPage<R> {
  items?: R[];
  totalItems?: number;
  pageRequest?: PageRequest;
}

export class PageMapper {
  static fromResponse<R, D>(response: ApiPage<R>, mapItem: (item: R) => D): Page<D> {
    return {
      items: (response.items ?? []).map(mapItem),
      totalItems: response.totalItems ?? 0,
      pageRequest: response.pageRequest,
    };
  }
}
