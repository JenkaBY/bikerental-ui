import type { PageRequest } from '@api-models';

export interface Page<T> {
  items: T[];
  totalItems: number;
  pageRequest?: PageRequest;
}
