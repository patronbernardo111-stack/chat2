/**
 * useSwipeNavigation.ts
 * Hook para navegación con gestos swipe horizontal entre tabs,
 * igual que las apps nativas de Android.
 *
 * Uso:
 *   const { handlers } = useSwipeNavigation({
 *     tabs: ['home', 'Mensajería', 'monedero', 'servicios', 'ajustes'],
 *     currentTab: currentView,
 *     onNavigate: setCurrentView,
 *   });
 *   // Aplica {...handlers} al contenedor principal
 */

import { useRef, useCallback } from 'react';

interface SwipeNavigationOptions {
  /** Lista ordenada de tabs en el mismo orden que el bottom nav */
  tabs: string[];
  /** Tab actualmente visible */
  currentTab: string;
  /** Callback para cambiar de tab */
  onNavigate: (tab: string) => void;
  /**
   * Distancia mínima en px para considerar un swipe válido.
   * Default: 60px
   */
  threshold?: number;
  /**
   * Velocidad mínima en px/ms para considerar un swipe rápido válido
   * aunque no alcance el threshold de distancia.
   * Default: 0.3
   */
  velocityThreshold?: number;
  /**
   * Ratio máximo vertical/horizontal para ignorar scrolls verticales.
   * Default: 0.6 (si el movimiento vertical supera el 60% del horizontal, se ignora)
   */
  verticalRatio?: number;
  /** Si true, deshabilita el swipe (ej: cuando hay un chat abierto) */
  disabled?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipeNavigation({
  tabs,
  currentTab,
  onNavigate,
  threshold = 60,
  velocityThreshold = 0.3,
  verticalRatio = 0.6,
  disabled = false,
}: SwipeNavigationOptions): { handlers: SwipeHandlers } {

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
  }, [disabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX.current);
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // Si el movimiento es predominantemente horizontal, marcar como swipe
    // y prevenir el scroll vertical del contenedor
    if (deltaX > 10 && deltaX > deltaY) {
      isSwiping.current = true;
    }
  }, [disabled]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !isSwiping.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    const deltaTime = Date.now() - touchStartTime.current;
    const absX = Math.abs(deltaX);

    // Ignorar si el movimiento vertical es demasiado grande (scroll)
    if (deltaY > absX * verticalRatio) return;

    const velocity = absX / deltaTime; // px/ms
    const isValidSwipe = absX >= threshold || velocity >= velocityThreshold;
    if (!isValidSwipe) return;

    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex === -1) return;

    if (deltaX < 0) {
      // Swipe izquierda → siguiente tab
      const nextIndex = currentIndex + 1;
      if (nextIndex < tabs.length) {
        onNavigate(tabs[nextIndex]);
      }
    } else {
      // Swipe derecha → tab anterior
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        onNavigate(tabs[prevIndex]);
      }
    }

    isSwiping.current = false;
  }, [disabled, tabs, currentTab, onNavigate, threshold, velocityThreshold, verticalRatio]);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
