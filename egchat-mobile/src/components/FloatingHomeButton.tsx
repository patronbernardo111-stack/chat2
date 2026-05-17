/**
 * FloatingHomeButton — Botón flotante draggable idéntico al de la versión web.
 * - Draggable a cualquier posición, snap al borde más cercano al soltar
 * - Toque sin arrastrar → navega a mensajería (home)
 * - Sin fondo blanco: gradiente directo sobre Animated.View circular
 */
import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Dimensions, Pressable } from 'react-native';
import { router, usePathname } from 'expo-router';
import Svg, { Path, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW, height: SH } = Dimensions.get('window');
const INIT_X = SW - 70;
const INIT_Y = SH - 200;
const BTN = 46;

export const FloatingHomeButton = () => {
  const pathname = usePathname();
  // Ocultar en mensajería (home) — igual que la web
  if (pathname === '/(tabs)/mensajeria' || pathname === '/') return null;
  return <DraggableButton />;
};

const DraggableButton = () => {
  const pan = useRef(new Animated.ValueXY({ x: INIT_X, y: INIT_Y })).current;
  const isDragging = useRef(false);
  const currentPos = useRef({ x: INIT_X, y: INIT_Y });

  pan.addListener(v => { currentPos.current = v; });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,

      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gs) => {
        isDragging.current = Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6;
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_, gs);
      },

      onPanResponderRelease: () => {
        pan.flattenOffset();
        const rawX = currentPos.current.x;
        const rawY = currentPos.current.y;
        // Snap al borde más cercano
        const snapX = rawX + BTN / 2 < SW / 2 ? 8 : SW - BTN - 8;
        const clampY = Math.max(60, Math.min(SH - BTN - 80, rawY));
        Animated.spring(pan, {
          toValue: { x: snapX, y: clampY },
          useNativeDriver: false,
          tension: 120,
          friction: 8,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[st.container, { left: pan.x, top: pan.y }]}
      {...panResponder.panHandlers}
    >
      {/* LinearGradient directamente como contenedor circular — sin fondo blanco */}
      <LinearGradient
        colors={['rgba(16,185,129,0.95)', 'rgba(59,130,246,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={st.gradient}
      >
        <Pressable
          onPress={() => { if (!isDragging.current) router.replace('/(tabs)/mensajeria' as any); }}
          style={st.pressable}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: BTN / 2 }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
            stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Polyline points="9 22 9 12 15 12 15 22" />
          </Svg>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
};

const st = StyleSheet.create({
  container: {
    position: 'absolute',
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    zIndex: 9999,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  gradient: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
