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
   const runIdRef = useRef(0);
 
   useEffect(() => {
     isMountedRef.current = true;
     const runId = ++runIdRef.current;
     let cleanup: void | (() => void);
 
     const executeEffect = async () => {
       try {
         const maybeCleanup = await effect();
         // Only accept cleanup from the latest run
         if (isMountedRef.current && runId === runIdRef.current) {
           cleanup = maybeCleanup;
         }
       } catch (error) {

         if (isMountedRef.current && runId === runIdRef.current) {
           console.error('Error in async effect:', error);
         }
       }
     };
 
     executeEffect();
 
     return () => {
       isMountedRef.current = false;

       // Only run cleanup from the latest effect
       if (runId === runIdRef.current && typeof cleanup === 'function') {
         cleanup();
       }
     };
   }, [...deps, effect]);
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
