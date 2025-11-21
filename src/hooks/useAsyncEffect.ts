/**
 * useAsyncEffect Hook
 * Properly handles async operations in useEffect with cleanup
 */

import { useEffect, useRef, DependencyList, EffectCallback } from 'react';

type AsyncEffectCallback = () => Promise<void | (() => void)>;

/**
 * Custom hook to handle async operations in useEffect properly
 * Prevents memory leaks and race conditions
 */
export function useAsyncEffect(
  effect: AsyncEffectCallback,
  deps: DependencyList
): void {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let cleanup: void | (() => void);

    const executeEffect = async () => {
      try {
        cleanup = await effect();
      } catch (error) {
        if (isMountedRef.current) {
          console.error('Error in async effect:', error);
        }
      }
    };

    executeEffect();

    return () => {
      isMountedRef.current = false;
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
}

/**
 * Check if component is still mounted
 * Used within async functions to prevent state updates after unmount
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return () => isMountedRef.current;
}

export default useAsyncEffect;
