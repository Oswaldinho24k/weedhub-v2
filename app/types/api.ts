export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface LoaderData<T> {
  data: T;
  user?: {
    _id: string;
    displayName: string;
    avatar?: string;
    role: string;
  } | null;
}
