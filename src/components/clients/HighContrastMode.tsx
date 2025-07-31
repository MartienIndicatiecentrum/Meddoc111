import React from 'react';

/**
 * Utility component om high contrast mode te activeren (WCAG 2.1 AA)
 * Voegt een klasse toe aan body en gebruikt aangepaste Tailwind kleuren
 */
export const enableHighContrast = () => {
  document.body.classList.add('high-contrast');
};
export const disableHighContrast = () => {
  document.body.classList.remove('high-contrast');
};

export const HighContrastToggle: React.FC = () => {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    if (enabled) {
      enableHighContrast();
    } else {
      disableHighContrast();
    }
    return () => disableHighContrast();
  }, [enabled]);
  return (
    <button
      className={`btn btn-xs ${enabled ? 'btn-primary' : 'btn-outline'}`}
      onClick={() => setEnabled(e => !e)}
      aria-pressed={enabled}
      aria-label='Schakel hoog contrast in/uit'
    >
      Hoog contrast
    </button>
  );
};
