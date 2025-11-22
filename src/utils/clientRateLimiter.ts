/**
 * Client-side rate limiter to prevent spam and abuse
 * Tracks requests by action key and enforces limits
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class ClientRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private defaultConfig: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  };

  /**
   * Check if action is rate limited
   * @param key - Unique identifier for the action (e.g., 'submit-form', 'api-call')
   * @param config - Optional custom configuration
   * @returns true if allowed, false if rate limited
   */
  public checkLimit(key: string, config?: Partial<RateLimitConfig>): boolean {
    const { maxRequests, windowMs } = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const entry = this.limits.get(key);

    // First request or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    // Within window, check count
    if (entry.count < maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  public getRemaining(key: string, config?: Partial<RateLimitConfig>): number {
    const { maxRequests } = { ...this.defaultConfig, ...config };
    const entry = this.limits.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until reset (in ms)
   */
  public getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Reset rate limit for a specific key
   */
  public reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  public clearAll(): void {
    this.limits.clear();
  }

  /**
   * Clean up expired entries (call periodically)
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new ClientRateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

export default rateLimiter;

// Predefined configurations for common actions
export const RATE_LIMIT_CONFIGS = {
  FORM_SUBMIT: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  API_CALL: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  LOGIN_ATTEMPT: { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
  COMMENT_POST: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  FILE_UPLOAD: { maxRequests: 3, windowMs: 60000 }, // 3 per minute
  SEARCH: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
};

/**
 * Higher-order function to wrap async functions with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  config?: Partial<RateLimitConfig>
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!rateLimiter.checkLimit(key, config)) {
      const resetTime = rateLimiter.getResetTime(key);
      const seconds = Math.ceil(resetTime / 1000);
      throw new Error(
        `Rate limit exceeded. Please wait ${seconds} seconds before trying again.`
      );
    }

    return fn(...args);
  }) as T;
}
