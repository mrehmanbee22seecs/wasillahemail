import { renderHook, waitFor } from '@testing-library/react';
import { useCachedData } from '../../hooks/useCachedData';
import { memoryCache } from '../../utils/caching';

jest.mock('../../utils/caching', () => ({
  memoryCache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('useCachedData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches data when cache is empty', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);
    (memoryCache.get as jest.Mock).mockReturnValue(null);
    
    const { result } = renderHook(() =>
      useCachedData({
        key: 'test-key',
        fetcher: mockFetcher,
        ttl: 5000,
      })
    );
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockData);
    expect(memoryCache.set).toHaveBeenCalledWith('test-key', mockData, 5000);
  });

  it('returns cached data without fetching', async () => {
    const cachedData = { id: 1, name: 'Cached' };
    const mockFetcher = jest.fn();
    (memoryCache.get as jest.Mock).mockReturnValue(cachedData);
    
    const { result } = renderHook(() =>
      useCachedData({
        key: 'test-key',
        fetcher: mockFetcher,
        ttl: 5000,
      })
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockFetcher).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(cachedData);
  });

  it('handles fetch errors', async () => {
    const mockError = new Error('Fetch failed');
    const mockFetcher = jest.fn().mockRejectedValue(mockError);
    (memoryCache.get as jest.Mock).mockReturnValue(null);
    
    const { result } = renderHook(() =>
      useCachedData({
        key: 'test-key',
        fetcher: mockFetcher,
        ttl: 5000,
      })
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();
  });

  it('refetches data when refetch is called', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);
    (memoryCache.get as jest.Mock).mockReturnValue(null);
    
    const { result } = renderHook(() =>
      useCachedData({
        key: 'test-key',
        fetcher: mockFetcher,
        ttl: 5000,
      })
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    
    result.current.refetch();
    
    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
  });

  it('invalidates cache when invalidate is called', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);
    (memoryCache.get as jest.Mock).mockReturnValue(mockData);
    
    const { result } = renderHook(() =>
      useCachedData({
        key: 'test-key',
        fetcher: mockFetcher,
        ttl: 5000,
      })
    );
    
    result.current.invalidate();
    
    expect(memoryCache.delete).toHaveBeenCalledWith('test-key');
  });

  it('does not fetch when enabled is false', () => {
    const mockFetcher = jest.fn();
    
    renderHook(() =>
      useCachedData({
        key: 'test-key',
        fetcher: mockFetcher,
        ttl: 5000,
        enabled: false,
      })
    );
    
    expect(mockFetcher).not.toHaveBeenCalled();
  });
});
