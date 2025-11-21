/**
 * Common type definitions used across the application
 * Eliminates 'any' types and provides type safety
 */

// Generic API response types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

// Firebase document types
export interface FirestoreDocument {
  id: string;
  createdAt: Date | FirebaseFirestore.Timestamp;
  updatedAt: Date | FirebaseFirestore.Timestamp;
}

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

// Form and validation types
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormError[];
}

// Generic callback types
export type AsyncCallback<T = void> = () => Promise<T>;
export type ErrorHandler = (error: Error) => void;
export type SuccessHandler<T = void> = (data: T) => void;

// Data fetching types
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// Storage types
export interface StorageItem<T = unknown> {
  key: string;
  value: T;
  expiresAt?: number;
}

// Event types
export interface CustomEvent<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
}

// Generic utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// Enum-like types for better type safety
export const LoadingState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type LoadingStateType = (typeof LoadingState)[keyof typeof LoadingState];

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusType = (typeof HttpStatus)[keyof typeof HttpStatus];

// Cache types
export interface CacheOptions {
  ttl?: number;
  key: string;
  tags?: string[];
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface LoadingProps {
  loading: boolean;
  error?: Error | null;
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export type ErrorBoundaryFallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};
