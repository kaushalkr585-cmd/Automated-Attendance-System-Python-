import { useState, useEffect } from 'react';

const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };

export function useBreakpoint() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    width,
    isMobile:  width < BREAKPOINTS.md,          // < 768px
    isTablet:  width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,  // 768-1023px
    isDesktop: width >= BREAKPOINTS.lg,          // >= 1024px
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
  };
}
