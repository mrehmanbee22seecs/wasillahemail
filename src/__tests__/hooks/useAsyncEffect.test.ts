import { renderHook, waitFor } from '@testing-library/react';
import { useAsyncEffect, useIsMounted } from '../../hooks/useAsyncEffect';

describe('useAsyncEffect', () => {
  it('executes async function on mount', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    
    renderHook(() => useAsyncEffect(mockFn, []));
    
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  it('executes cleanup function on unmount', async () => {
    const cleanup = jest.fn();
    const mockFn = jest.fn().mockResolvedValue(cleanup);
    
    const { unmount } = renderHook(() => useAsyncEffect(mockFn, []));
    
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(cleanup).toHaveBeenCalled();
  });

  it('re-executes when dependencies change', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    let dep = 1;
    
    const { rerender } = renderHook(() => useAsyncEffect(mockFn, [dep]));
    
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    dep = 2;
    rerender();
    
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useIsMounted', () => {
  it('returns true when component is mounted', () => {
    const { result } = renderHook(() => useIsMounted());
    
    expect(result.current()).toBe(true);
  });

  it('returns false after component unmounts', () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    
    expect(result.current()).toBe(true);
    
    unmount();
    
    expect(result.current()).toBe(false);
  });
});
