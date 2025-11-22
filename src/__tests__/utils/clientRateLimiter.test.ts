import rateLimiter, { withRateLimit, RATE_LIMIT_CONFIGS } from '../../utils/clientRateLimiter';

describe('clientRateLimiter', () => {
  beforeEach(() => {
    // Clear rate limit storage
    rateLimiter.clear();
  });

  describe('checkLimit', () => {
    it('allows requests within limit', () => {
      const result1 = rateLimiter.checkLimit('test-action', { limit: 3, window: 60000 });
      const result2 = rateLimiter.checkLimit('test-action', { limit: 3, window: 60000 });
      const result3 = rateLimiter.checkLimit('test-action', { limit: 3, window: 60000 });
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    it('blocks requests over limit', () => {
      const config = { limit: 2, window: 60000 };
      
      rateLimiter.checkLimit('test-action', config);
      rateLimiter.checkLimit('test-action', config);
      const result = rateLimiter.checkLimit('test-action', config);
      
      expect(result).toBe(false);
    });

    it('resets after time window expires', () => {
      jest.useFakeTimers();
      
      const config = { limit: 1, window: 1000 };
      
      const result1 = rateLimiter.checkLimit('test-action', config);
      expect(result1).toBe(true);
      
      const result2 = rateLimiter.checkLimit('test-action', config);
      expect(result2).toBe(false);
      
      jest.advanceTimersByTime(1001);
      
      const result3 = rateLimiter.checkLimit('test-action', config);
      expect(result3).toBe(true);
      
      jest.useRealTimers();
    });

    it('tracks different actions separately', () => {
      const config = { limit: 1, window: 60000 };
      
      const result1 = rateLimiter.checkLimit('action1', config);
      const result2 = rateLimiter.checkLimit('action2', config);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('withRateLimit', () => {
   it('executes function when under limit', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const limited = withRateLimit(mockFn, 'test-action', { maxRequests: 3, windowMs: 60000 });
      
      const result = await limited();
      
      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('rejects when over limit', async () => {
     const mockFn = jest.fn().mockResolvedValue(undefined);
     const config = { maxRequests: 1, windowMs: 60000 };
      const limited = withRateLimit(mockFn, 'test-action', config);
      
      await limited();
     await expect(limited()).rejects.toThrow('Rate limit exceeded');
     expect(mockFn).toHaveBeenCalledTimes(1);
   });
 });

    it('works with async functions', async () => {
      const mockFn = jest.fn().mockResolvedValue('async result');
      const limited = withRateLimit(mockFn, 'test-action', { limit: 3, window: 60000 });
      
      const result = await limited();
      
      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('async result');
    });
  });

  describe('RATE_LIMIT_CONFIGS', () => {
    it('defines form submit config', () => {
      expect(RATE_LIMIT_CONFIGS.FORM_SUBMIT).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.FORM_SUBMIT.limit).toBe(5);
    });

    it('defines API call config', () => {
      expect(RATE_LIMIT_CONFIGS.API_CALL).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.API_CALL.limit).toBe(20);
    });

    it('defines login attempt config', () => {
      expect(RATE_LIMIT_CONFIGS.LOGIN_ATTEMPT).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.LOGIN_ATTEMPT.limit).toBe(5);
    });
  });
});
