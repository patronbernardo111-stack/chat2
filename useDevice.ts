// useDevice.ts — Detección de tipo de dispositivo para layout responsivo
import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

// Breakpoints
// mobile:  < 768px
// tablet:  768px – 1023px
// desktop: >= 1024px

function getDeviceType(width: number): DeviceType {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const type = getDeviceType(w);
    return { type, isMobile: type === 'mobile', isTablet: type === 'tablet', isDesktop: type === 'desktop', width: w, height: h };
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const type = getDeviceType(w);
      setInfo({ type, isMobile: type === 'mobile', isTablet: type === 'tablet', isDesktop: type === 'desktop', width: w, height: h });
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return info;
}
