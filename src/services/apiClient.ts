/**
 * API Client
 * Main HTTP client for REST API communication with Firebase Functions
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { auth } from '../config/firebase';
import type {
  ApiConfig,
  ApiRequest,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
  RateLimitInfo,
} from '../types/api';
import {
  buildURL,
  parseApiError,
  retryWithBackoff,
  formatPaginationParams,
  formatFilterParams,
  mergeParams,
  isRateLimited,
  getRetryAfter,
} from '../utils/apiHelpers';

/**
 * Default API configuration
 */
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://us-central1-your-project.cloudfunctions.net/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  retries: 3,
  retryDelay: 1000,
};

/**
 * API Client Class
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private config: ApiConfig;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor: Add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle errors and rate limits
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Extract rate limit info from headers
        if (response.headers['x-ratelimit-limit']) {
          this.rateLimitInfo = {
            limit: parseInt(response.headers['x-ratelimit-limit'], 10),
            remaining: parseInt(response.headers['x-ratelimit-remaining'], 10),
            reset: new Date(parseInt(response.headers['x-ratelimit-reset'], 10) * 1000),
          };
        }
        return response;
      },
      async (error) => {
        // Handle rate limiting
        if (isRateLimited(error)) {
          const retryAfter = getRetryAfter(error);
          if (retryAfter) {
            this.rateLimitInfo = {
              ...this.rateLimitInfo!,
              retryAfter,
            };
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await retryWithBackoff(
        () => this.axiosInstance.request<ApiResponse<T>>(config),
        this.config.retries,
        this.config.retryDelay
      );

      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url: endpoint,
      params,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url: endpoint,
      data,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url: endpoint,
      data,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url: endpoint,
      data,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url: endpoint,
    });
  }

  /**
   * GET request with pagination
   */
  async getPaginated<T = any>(
    endpoint: string,
    pagination?: PaginationParams,
    filters?: FilterParams
  ): Promise<PaginatedResponse<T>> {
    const params = mergeParams(
      formatPaginationParams(pagination || {}),
      formatFilterParams(filters || {})
    );

    const response = await this.get<PaginatedResponse<T>>(endpoint, params);
    return response.data;
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
    this.axiosInstance.defaults.baseURL = this.config.baseURL;
    this.axiosInstance.defaults.timeout = this.config.timeout;
    this.axiosInstance.defaults.headers = this.config.headers as any;
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Projects
  projects: {
    list: '/projects',
    get: (id: string) => `/projects/${id}`,
    create: '/projects',
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    approve: (id: string) => `/projects/${id}/approve`,
    reject: (id: string) => `/projects/${id}/reject`,
  },

  // Events
  events: {
    list: '/events',
    get: (id: string) => `/events/${id}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
    approve: (id: string) => `/events/${id}/approve`,
    reject: (id: string) => `/events/${id}/reject`,
  },

  // NGOs
  ngos: {
    list: '/ngos',
    get: (id: string) => `/ngos/${id}`,
    create: '/ngos',
    update: (id: string) => `/ngos/${id}`,
    delete: (id: string) => `/ngos/${id}`,
    verify: (id: string) => `/ngos/${id}/verify`,
  },

  // Users
  users: {
    list: '/users',
    get: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    profile: '/users/me',
  },

  // Analytics
  analytics: {
    platform: '/analytics/platform',
    projects: '/analytics/projects',
    events: '/analytics/events',
    users: '/analytics/users',
    custom: '/analytics/custom',
  },

  // Webhooks
  webhooks: {
    list: '/webhooks',
    get: (id: string) => `/webhooks/${id}`,
    create: '/webhooks',
    update: (id: string) => `/webhooks/${id}`,
    delete: (id: string) => `/webhooks/${id}`,
    deliveries: (id: string) => `/webhooks/${id}/deliveries`,
    test: (id: string) => `/webhooks/${id}/test`,
  },

  // Admin
  admin: {
    stats: '/admin/stats',
    health: '/admin/health',
    moderation: '/admin/moderation',
    bulk: '/admin/bulk',
  },
};

/**
 * Resource-specific API methods
 */

// Projects API
export const projectsApi = {
  list: (pagination?: PaginationParams, filters?: FilterParams) =>
    apiClient.getPaginated(API_ENDPOINTS.projects.list, pagination, filters),

  get: (id: string) =>
    apiClient.get(API_ENDPOINTS.projects.get(id)),

  create: (data: any) =>
    apiClient.post(API_ENDPOINTS.projects.create, data),

  update: (id: string, data: any) =>
    apiClient.patch(API_ENDPOINTS.projects.update(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.projects.delete(id)),

  approve: (id: string, reason?: string) =>
    apiClient.post(API_ENDPOINTS.projects.approve(id), { reason }),

  reject: (id: string, reason: string) =>
    apiClient.post(API_ENDPOINTS.projects.reject(id), { reason }),
};

// Events API
export const eventsApi = {
  list: (pagination?: PaginationParams, filters?: FilterParams) =>
    apiClient.getPaginated(API_ENDPOINTS.events.list, pagination, filters),

  get: (id: string) =>
    apiClient.get(API_ENDPOINTS.events.get(id)),

  create: (data: any) =>
    apiClient.post(API_ENDPOINTS.events.create, data),

  update: (id: string, data: any) =>
    apiClient.patch(API_ENDPOINTS.events.update(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.events.delete(id)),

  approve: (id: string, reason?: string) =>
    apiClient.post(API_ENDPOINTS.events.approve(id), { reason }),

  reject: (id: string, reason: string) =>
    apiClient.post(API_ENDPOINTS.events.reject(id), { reason }),
};

// NGOs API
export const ngosApi = {
  list: (pagination?: PaginationParams, filters?: FilterParams) =>
    apiClient.getPaginated(API_ENDPOINTS.ngos.list, pagination, filters),

  get: (id: string) =>
    apiClient.get(API_ENDPOINTS.ngos.get(id)),

  create: (data: any) =>
    apiClient.post(API_ENDPOINTS.ngos.create, data),

  update: (id: string, data: any) =>
    apiClient.patch(API_ENDPOINTS.ngos.update(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.ngos.delete(id)),

  verify: (id: string) =>
    apiClient.post(API_ENDPOINTS.ngos.verify(id)),
};

// Users API
export const usersApi = {
  list: (pagination?: PaginationParams, filters?: FilterParams) =>
    apiClient.getPaginated(API_ENDPOINTS.users.list, pagination, filters),

  get: (id: string) =>
    apiClient.get(API_ENDPOINTS.users.get(id)),

  getCurrentUser: () =>
    apiClient.get(API_ENDPOINTS.users.profile),

  update: (id: string, data: any) =>
    apiClient.patch(API_ENDPOINTS.users.update(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.users.delete(id)),
};

// Analytics API
export const analyticsApi = {
  getPlatformStats: (params?: any) =>
    apiClient.get(API_ENDPOINTS.analytics.platform, params),

  getProjectAnalytics: (params?: any) =>
    apiClient.get(API_ENDPOINTS.analytics.projects, params),

  getEventAnalytics: (params?: any) =>
    apiClient.get(API_ENDPOINTS.analytics.events, params),

  getUserAnalytics: (params?: any) =>
    apiClient.get(API_ENDPOINTS.analytics.users, params),

  getCustomAnalytics: (metric: string, params?: any) =>
    apiClient.get(`${API_ENDPOINTS.analytics.custom}/${metric}`, params),
};

// Webhooks API
export const webhooksApi = {
  list: () =>
    apiClient.get(API_ENDPOINTS.webhooks.list),

  get: (id: string) =>
    apiClient.get(API_ENDPOINTS.webhooks.get(id)),

  create: (data: any) =>
    apiClient.post(API_ENDPOINTS.webhooks.create, data),

  update: (id: string, data: any) =>
    apiClient.patch(API_ENDPOINTS.webhooks.update(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.webhooks.delete(id)),

  getDeliveries: (id: string, pagination?: PaginationParams) =>
    apiClient.getPaginated(API_ENDPOINTS.webhooks.deliveries(id), pagination),

  test: (id: string) =>
    apiClient.post(API_ENDPOINTS.webhooks.test(id)),
};

// Admin API
export const adminApi = {
  getStats: () =>
    apiClient.get(API_ENDPOINTS.admin.stats),

  getHealth: () =>
    apiClient.get(API_ENDPOINTS.admin.health),

  getModerationQueue: () =>
    apiClient.get(API_ENDPOINTS.admin.moderation),

  bulkOperation: (operation: any) =>
    apiClient.post(API_ENDPOINTS.admin.bulk, operation),
};

export default apiClient;
