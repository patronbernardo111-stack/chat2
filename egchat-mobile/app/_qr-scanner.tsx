import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Linking, Vibration, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { chatAPI, contactsAPI } from '../src/api';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../src/theme';

const { width: W } = Dimensions.get('window');
const FRAME = W * 0.65;

// ── Animación de línea de escaneo ─────────────────────────────────
const ScanLine = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.scanLine,
        {
          transform: [{
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, FRAME - 4],
            }),
          }],
        },
      ]}
    />
  );
};

// ── Esquinas del frame ────────────────────────────────────────────
const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const isTop = pos.startsWith('t');
  const isLeft = pos.endsWith('l');
  return (
    <View style={[
      styles.corner,
      isTop ? { top: 0 } : { bottom: 0 },
      isLeft ? { left: 0 } : { right: 0 },
      isTop && isLeft && { borderTopWidth: 3, borderLeftWidth: 3 },
      isTop && !isLeft && { borderTopWidth: 3, borderRightWidth: 3 },
      !isTop && isLeft && { borderBottomWidth: 3, borderLeftWidth: 3 },
      !isTop && !isLeft && { borderBottomWidth: 3, borderRightWidth: 3 },
    ]} />
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastData, setLastData] = useState('');

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || processing || data === lastData) return;
    setScanned(true);
    setLastData(data);
    setProcessing(true);
    Vibration.vibrate(100);

    try {
      // Intentar parsear como QR de contacto EGCHAT
      let parsed: any = null;
      try { parsed = JSON.parse(data); } catch {}

      if (parsed?.type === 'contact' && parsed?.app === 'EGCHAT' && parsed?.user) {
        // QR de contacto EGCHAT — añadir y abrir chat
        const { id, phone, name } = parsed.user;
        Alert.alert(
          '👤 Contacto EGCHAT',
          `¿Añadir a ${name || phone} como contacto?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => { setScanned(false); setProcessing(false); } },
            {
              text: 'Añadir y chatear',
              onPress: async () => {
                try {
                  await contactsAPI.add(id, phone, name);
                  const chat = await chatAPI.createPrivate(id, phone);
                  router.replace(`/chat/${chat.id}` as any);
                } catch (e: any) {
                  Alert.alert('Error', e.message || 'No se pudo añadir el contacto');
                  setScanned(false);
                } finally { setProcessing(false); }
              },
            },
          ]
        );
      } else if (data.startsWith('http://') || data.startsWith('https://')) {
        // URL
        Alert.alert(
          '🔗 Enlace detectado',
          data.length > 60 ? data.slice(0, 60) + '...' : data,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => { setScanned(false); setProcessing(false); } },
            { text: 'Copiar', onPress: async () => { await Clipboard.setStringAsync(data); setScanned(false); setProcessing(false); } },
            { text: 'Abrir', onPress: async () => { await Linking.openURL(data); setScanned(false); setProcessing(false); } },
          ]
        );
      } else {
        // Texto genérico
        Alert.alert(
          '📋 QR Escaneado',
          data.length > 120 ? data.slice(0, 120) + '...' : data,
          [
            { text: 'Cerrar', style: 'cancel', onPress: () => { setScanned(false); setProcessing(false); } },
            { text: 'Copiar', onPress: async () => { await Clipboard.setStringAsync(data); setScanned(false); setProcessing(false); } },
          ]
        );
      }
    } catch {
      setScanned(false);
      setProcessing(false);
    }
  };

  // Sin permiso aún
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Verificando permisos...</Text>
      </View>
    );
  }

  // Permiso denegado
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Cámara requerida</Text>
        <Text style={styles.permText}>Necesitamos acceso a la cámara para escanear códigos QR</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Conceder permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay oscuro con hueco */}
      <View style={styles.overlay}>
        {/* Top */}
        <View style={styles.overlayTop} />
        {/* Middle row */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          {/* Frame transparente */}
          <View style={styles.frame}>
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />
            {!scanned && <ScanLine />}
            {scanned && (
              <View style={styles.scannedCheck}>
                <Text style={styles.scannedCheckText}>✓</Text>
              </View>
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>
        {/* Bottom */}
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Escanear QR</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Instrucción */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>
          {scanned ? '✅ Procesando...' : 'Apunta al código QR de EGCHAT'}
        </Text>
        {scanned && (
          <TouchableOpacity onPress={() => { setScanned(false); setProcessing(false); }} style={styles.rescanBtn}>
            <Text style={styles.rescanText}>Escanear otro</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.62)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#0d1117', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  overlayTop: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddle: { flexDirection: 'row', height: FRAME },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },

  // Frame
  frame: {
    width: FRAME, height: FRAME,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24, height: 24,
    borderColor: Colors.accent,
  },

  // Scan line
  scanLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 2,
    backgroundColor: Colors.accent,
    opacity: 0.8,
  },

  // Scanned check
  scannedCheck: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,200,160,0.15)',
  },
  scannedCheckText: { fontSize: 64, color: Colors.accent },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: FontWeight.bold },
  title: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  // Hint
  hint: {
    position: 'absolute',
    bottom: 80, left: 0, right: 0,
    alignItems: 'center', gap: Spacing.md,
  },
  hintText: {
    color: '#fff', fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  rescanBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  rescanText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.base },

  // Permission screen
  permIcon: { fontSize: 64, marginBottom: Spacing.lg },
  permTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#fff', marginBottom: Spacing.sm },
  permText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: Spacing.xl },
  permBtn: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  permBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
  backBtn: { paddingVertical: Spacing.sm },
  backBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.base },
});
