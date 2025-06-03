export type ID = string;

export type Timestamp = Date;

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type SearchParams = {
  query?: string;
  filters?: Record<string, any>;
} & PaginationParams;

export type CreateEntityInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateEntityInput<T> = Partial<
  Omit<T, 'id' | 'createdAt' | 'updatedAt'>
>;

export type EntityWithTimestamps = {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Result<T, E = Error> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
