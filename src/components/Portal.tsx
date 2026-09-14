import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

/**
 * Renders modal dialogs and overlays directly into document.body.
 * This guarantees that overlays with `fixed inset-0` and `backdrop-blur-*`
 * escape any parent CSS transforms, overflow constraints, or flex containers,
 * blurring 100% of the entire web application viewport (header, sidebar, and content).
 */
export const Portal: React.FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};
