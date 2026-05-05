// useDevice.ts — Detección de tipo de dispositivo para React Native
import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  isIOS: boolean;
  isAndroid: boolean;
}

function getDeviceType(width: number): DeviceType {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => {
    const { width, height } = Dimensions.get('window');
    const type = getDeviceType(width);
    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      width,
      height,
      isIOS: Platform.OS === 'ios',
      isAndroid: Platform.OS === 'android',
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const type = getDeviceType(window.width);
      setInfo({
        type,
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop',
        width: window.width,
        height: window.height,
        isIOS: Platform.OS === 'ios',
        isAndroid: Platform.OS === 'android',
      });
    });
    return () => subscription.remove();
  }, []);

  return info;
}
