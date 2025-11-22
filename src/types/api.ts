/**
 * API Type Definitions
 * TypeScript types for REST API requests and responses
 */

// ============================================================================
// API Configuration Types
// ============================================================================

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retries: number;
  retryDelay: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
  timestamp: Date;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface ApiCredentials {
  apiKey: string;
  apiSecret?: string;
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  params?: Record<string, any>;
  data?: T;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
  timestamp: Date;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterParams {
  search?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  categories?: string[];
}

// ============================================================================
// Resource Types
// ============================================================================

// Projects
export interface ProjectApiParams {
  id?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  isVisible?: boolean;
  submittedBy?: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  endDate?: string;
  requirements: string[];
  contactInfo: Record<string, any>;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: string;
  isVisible?: boolean;
}

// Events
export interface EventApiParams {
  id?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  isVisible?: boolean;
  projectId?: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  eventType: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity?: number;
  projectId?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: string;
  isVisible?: boolean;
}

// NGOs
export interface NgoApiParams {
  id?: string;
  isVerified?: boolean;
  registrationStatus?: string;
}

export interface CreateNgoRequest {
  organizationName: string;
  description: string;
  registrationNumber: string;
  contactInfo: Record<string, any>;
  address: Record<string, any>;
}

export interface UpdateNgoRequest extends Partial<CreateNgoRequest> {
  isVerified?: boolean;
  registrationStatus?: string;
}

// Users
export interface UserApiParams {
  id?: string;
  role?: 'volunteer' | 'ngo' | 'admin';
  isActive?: boolean;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  role: string;
  profileData?: Record<string, any>;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  isActive?: boolean;
  isAdmin?: boolean;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsParams {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface AnalyticsData {
  metric: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  breakdown?: Record<string, number>;
}

export interface PlatformStats {
  totalUsers: number;
  totalProjects: number;
  totalEvents: number;
  totalNgos: number;
  activeProjects: number;
  completedProjects: number;
  upcomingEvents: number;
  totalVolunteers: number;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookConfig {
  id?: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  secret?: string;
}

export type WebhookEvent =
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.approved'
  | 'project.rejected'
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'event.approved'
  | 'event.rejected'
  | 'application.submitted'
  | 'application.approved'
  | 'application.rejected'
  | 'registration.submitted'
  | 'registration.approved'
  | 'registration.rejected'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'donation.received'
  | 'subscription.created'
  | 'subscription.updated';

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attemptCount: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  error?: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: Date;
  data: any;
  signature: string;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminAction {
  action: 'approve' | 'reject' | 'ban' | 'unban' | 'verify' | 'feature';
  resourceType: 'project' | 'event' | 'user' | 'ngo';
  resourceId: string;
  reason?: string;
}

export interface ModerationQueue {
  projects: number;
  events: number;
  users: number;
  reports: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastCheck: Date;
  services: {
    firestore: 'operational' | 'degraded' | 'down';
    auth: 'operational' | 'degraded' | 'down';
    storage: 'operational' | 'degraded' | 'down';
    functions: 'operational' | 'degraded' | 'down';
  };
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// ============================================================================
// Batch Operations
// ============================================================================

export interface BatchRequest<T = any> {
  operations: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    data?: T;
  }>;
}

export interface BatchResponse<T = any> {
  results: Array<{
    success: boolean;
    data?: T;
    error?: ApiError;
  }>;
}

// ============================================================================
// Export All
// ============================================================================

export type {
  ApiConfig,
  ApiError,
  ApiCredentials,
  AuthToken,
  ApiRequest,
  ApiResponse,
  ResponseMeta,
  PaginationParams,
  PaginatedResponse,
  FilterParams,
};
