import { useCallback, useState } from 'react';

interface UseCarousel {
  index: number;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
}

// Index state for a wrap-around carousel of `count` slides.
export function useCarousel(count: number): UseCarousel {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  return { index, next, prev, goTo };
}
