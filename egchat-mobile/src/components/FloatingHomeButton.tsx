/**
 * FloatingHomeButton — Botón flotante draggable idéntico al de la versión web.
 * - Se puede arrastrar a cualquier posición de la pantalla
 * - Al tocar (sin arrastrar) navega a la tab de mensajería (home)
 * - Gradiente verde-azul igual que la web
 * - Icono de casa SVG idéntico al web
 */
import React, { useRef, useState } from 'react';
import {
  Animated, PanResponder, TouchableOpacity,
  StyleSheet, Dimensions, View,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import Svg, { Path, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW, height: SH } = Dimensions.get('window');

// Posición inicial: esquina inferior derecha (igual que la web)
const INIT_X = SW - 70;
const INIT_Y = SH - 200;
const BTN_SIZE = 46;

export const FloatingHomeButton = () => {
  const pathname = usePathname();

  // Ocultar en la tab de mensajería (home) — igual que la web
  const isHome = pathname === '/(tabs)/mensajeria' || pathname === '/';
  if (isHome) return null;

  return <DraggableButton />;
};

// Componente interno separado para que el hook de PanResponder
// no se llame condicionalmente
const DraggableButton = () => {
  const pan = useRef(new Animated.ValueXY({ x: INIT_X, y: INIT_Y })).current;
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: INIT_X, y: INIT_Y });
  const currentPos = useRef({ x: INIT_X, y: INIT_Y });

  // Sincronizar posición actual al mover
  pan.addListener(v => { currentPos.current = v; });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,

      onPanResponderGrant: () => {
        isDragging.current = false;
        // Fijar el offset desde la posición actual
        pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gs) => {
        isDragging.current = Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6;
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gs);
      },

      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();

        // Clamp dentro de la pantalla
        const rawX = currentPos.current.x;
        const rawY = currentPos.current.y;
        const clampedX = Math.max(8, Math.min(SW - BTN_SIZE - 8, rawX));
        const clampedY = Math.max(60, Math.min(SH - BTN_SIZE - 80, rawY));

        // Snap suave al borde más cercano (izquierda o derecha)
        const snapX = rawX + BTN_SIZE / 2 < SW / 2 ? 8 : SW - BTN_SIZE - 8;

        Animated.spring(pan, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          tension: 120,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const handlePress = () => {
    if (!isDragging.current) {
      router.push('/(tabs)/mensajeria' as any);
    }
  };

  return (
    <Animated.View
      style={[styles.container, { left: pan.x, top: pan.y }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={styles.touchable}
      >
        <LinearGradient
          colors={['rgba(16,185,129,0.92)', 'rgba(59,130,246,0.92)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Icono casa — idéntico al SVG de la web */}
          <Svg
            width={18} height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Polyline points="9 22 9 12 15 12 15 22" />
          </Svg>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: BTN_SIZE,
    height: BTN_SIZE,
    zIndex: 9999,
    // Sombra igual que la web: verde + azul
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
  },
  touchable: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
