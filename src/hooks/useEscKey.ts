import { useEffect, useRef } from 'react';

export function useEscKey(onEsc: () => void, enabled: boolean = true) {
  const cbRef = useRef(onEsc);
  cbRef.current = onEsc;

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cbRef.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [enabled]);
}
