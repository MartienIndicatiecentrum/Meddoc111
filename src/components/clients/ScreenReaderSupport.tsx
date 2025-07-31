import { useEffect } from 'react';

/**
 * Announce a message for screen readers (ARIA live region)
 */
export function useAriaAnnounce(message: string) {
  useEffect(() => {
    if (!message) {
      return;
    }
    const region = document.getElementById('aria-live-region');
    if (region) {
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }, [message]);
}

/**
 * Place this once in your app root:
 * <div id="aria-live-region" aria-live="polite" className="sr-only" />
 */
