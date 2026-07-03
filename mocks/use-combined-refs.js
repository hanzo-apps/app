// Mock for use-combined-refs hook
import { useRef, useCallback } from 'react';

export const useCombinedRefs = (...refs) => {
  const targetRef = useRef();

  const combinedRef = useCallback((node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    });
    targetRef.current = node;
  }, refs);

  return combinedRef;
};

export default useCombinedRefs;