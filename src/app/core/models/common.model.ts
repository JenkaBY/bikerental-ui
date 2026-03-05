export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  properties?: Record<string, unknown>;
}

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PageRequest {
  size?: number;
  page?: number;
  sortBy?: string;
}

export interface Page<T> {
  items: T[];
  totalItems: number;
  pageRequest?: PageRequest;
}
