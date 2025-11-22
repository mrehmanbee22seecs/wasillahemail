/**
 * API Type Definitions
 * Shared types for API endpoints and middleware
 */

// Base response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface ApiUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'volunteer' | 'ngo' | 'admin';
  admin: boolean;
}

// Project types
export interface ApiProject {
  id: string;
  title: string;
  description: string;
  ngoId: string;
  location: string;
  startDate: Date;
  endDate: Date;
  volunteersNeeded: number;
  volunteersRegistered: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Event types
export interface ApiEvent {
  id: string;
  title: string;
  description: string;
  ngoId: string;
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  volunteersNeeded: number;
  volunteersRegistered: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// NGO types
export interface ApiNGO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  description: string;
  website?: string;
  registrationNumber?: string;
  focusAreas: string[];
  ownerId: string;
  verified: boolean;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Webhook types
export interface ApiWebhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  description: string;
  secret: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  response?: {
    status: number;
    body: string;
  };
  error?: string;
  createdAt: Date;
}

// Analytics types
export interface PlatformStats {
  totalProjects: number;
  totalEvents: number;
  totalNGOs: number;
  totalVolunteers: number;
  activeProjects: number;
  activeEvents: number;
  verifiedNGOs: number;
}

export interface ProjectAnalytics {
  projectId: string;
  views: number;
  registrations: number;
  completions: number;
  rating?: number;
  feedback: string[];
}

export interface EventAnalytics {
  eventId: string;
  views: number;
  registrations: number;
  attendance: number;
  rating?: number;
  feedback: string[];
}

export interface UserAnalytics {
  userId: string;
  projectsParticipated: number;
  eventsAttended: number;
  hoursVolunteered: number;
  impact: number;
}

// Query parameter types
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface ProjectFilters {
  status?: string | string[];
  category?: string;
  location?: string;
  ngoId?: string;
  tags?: string[];
}

export interface EventFilters {
  status?: string | string[];
  category?: string;
  location?: string;
  ngoId?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface NGOFilters {
  status?: string;
  verified?: boolean;
  location?: string;
  focusAreas?: string[];
}

// Request body types
export interface CreateProjectRequest {
  title: string;
  description: string;
  ngoId: string;
  location: string;
  startDate: Date;
  endDate: Date;
  volunteersNeeded: number;
  category: string;
  tags?: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
}

export interface CreateEventRequest {
  title: string;
  description: string;
  ngoId: string;
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  volunteersNeeded: number;
  category: string;
  tags?: string[];
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
}

export interface CreateNGORequest {
  name: string;
  email: string;
  phone?: string;
  location: string;
  description: string;
  website?: string;
  registrationNumber?: string;
  focusAreas: string[];
}

export interface UpdateNGORequest extends Partial<CreateNGORequest> {}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
  description?: string;
}

export interface UpdateWebhookRequest extends Partial<CreateWebhookRequest> {
  active?: boolean;
}

// Middleware types
export interface AuthenticatedRequest extends Request {
  user: ApiUser;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export const ApiErrorCodes = {
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  VALIDATION_ERROR: 'validation_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INTERNAL_ERROR: 'internal_error',
} as const;

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}
