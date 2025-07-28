import { useEffect } from 'react';

/**
 * Hook voor keyboard focus management en skip links
 * Plaats <a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a> bovenaan je layout
 */
export function useSkipToContent() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.target instanceof HTMLElement && e.target.id === 'skip-to-content') {
        const main = document.getElementById('main-content');
        if (main) main.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

/**
 * Example: <div id="main-content" tabIndex={-1} />
 */
