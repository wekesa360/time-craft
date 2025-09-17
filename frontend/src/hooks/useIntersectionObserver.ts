/**
 * Intersection Observer Hook
 * For lazy loading and visibility detection
 */

import { useEffect, useState, RefObject } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
  skip?: boolean;
}

interface IntersectionObserverResult {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = false,
    skip = false
  }: UseIntersectionObserverProps = {}
): IntersectionObserverResult => {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    
    if (!element || skip || typeof IntersectionObserver === 'undefined') {
      return;
    }

    let hasTriggered = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          hasTriggered = true;
        } else if (!triggerOnce || !hasTriggered) {
          setIsIntersecting(false);
        }
      },
      {
        threshold,
        root,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin, triggerOnce, skip]);

  return { isIntersecting, entry };
};