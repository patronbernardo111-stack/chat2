import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Linking, Clipboard, Vibration, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../src/theme';

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Animación de la línea de escaneo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannedData(data);
    Vibration.vibrate(200);
    processQR(data);
  };

  const processQR = (data: string) => {
    // QR de contacto EGCHAT
    if (data.includes('"app":"EGCHAT"') || data.includes('egchat')) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'contact' && parsed.user) {
          Alert.alert(
            '👤 Contacto EGCHAT',
            `${parsed.user.name}\n${parsed.user.phone}`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => setScanned(false) },
              {
                text: 'Añadir contacto',
                onPress: () => {
                  router.push('/contacts' as any);
                },
              },
            ]
          );
          return;
        }
      } catch {}
    }

    // URL
    if (data.startsWith('http://') || data.startsWith('https://')) {
      Alert.alert('🔗 URL detectada', data.slice(0, 60) + (data.length > 60 ? '...' : ''), [
        { text: 'Cancelar', style: 'cancel', onPress: () => setScanned(false) },
        { text: 'Copiar', onPress: () => { Clipboard.setString(data); setScanned(false); } },
        { text: 'Abrir', onPress: () => { Linking.openURL(data); setScanned(false); } },
      ]);
      return;
    }

    // Texto genérico
    Alert.alert('📋 QR Escaneado', data.slice(0, 100) + (data.length > 100 ? '...' : ''), [
      { text: 'Cerrar', style: 'cancel', onPress: () => setScanned(false) },
      { text: 'Copiar', onPress: () => { Clipboard.setString(data); setScanned(false); } },
    ]);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Permiso de cámara</Text>
        <Text style={styles.permSub}>Necesitamos acceso a la cámara para escanear QR</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Conceder permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay oscuro */}
      <View style={styles.overlay}>
        {/* Top */}
        <View style={styles.overlayTop} />

        {/* Middle row */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />

          {/* Ventana de escaneo */}
          <View style={styles.scanWindow}>
            {/* Esquinas */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Línea de escaneo animada */}
            {!scanned && (
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
              />
            )}

            {/* Éxito */}
            {scanned && (
              <View style={styles.successOverlay}>
                <Text style={styles.successIcon}>✅</Text>
              </View>
            )}
          </View>

          <View style={styles.overlaySide} />
        </View>

        {/* Bottom */}
        <View style={styles.overlayBottom}>
          <Text style={styles.hint}>
            {scanned ? 'QR detectado' : 'Apunta al código QR'}
          </Text>

          {scanned && (
            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={() => { setScanned(false); setScannedData(''); }}
            >
              <Text style={styles.scanAgainText}>Escanear otro</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Escanear QR</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>
    </View>
  );
}

const WINDOW = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  // Header
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: FontWeight.bold },
  title: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  // Overlay
  overlay: { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: WINDOW },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: Spacing.xl, gap: Spacing.md },

  // Scan window
  scanWindow: {
    width: WINDOW,
    height: WINDOW,
    position: 'relative',
    overflow: 'hidden',
  },

  // Corners
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.accent,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  // Scan line
  scanLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 2,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Success
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,193,96,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: { fontSize: 56 },

  // Hint
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.base, textAlign: 'center' },
  scanAgainBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
  },
  scanAgainText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.semibold },

  // Permission
  permIcon: { fontSize: 56, marginBottom: Spacing.lg },
  permTitle: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  permSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.base, textAlign: 'center', marginBottom: Spacing.xl },
  permBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  permBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  cancelBtn: { padding: Spacing.md },
  cancelText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.base },
  msg: { color: '#fff', fontSize: FontSize.base },
});
