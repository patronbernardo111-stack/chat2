// CameraModal.tsx — Cámara nativa para React Native con expo-camera
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface CameraModalProps {
  visible: boolean;
  chatId: string;
  onClose: () => void;
  onPhotoTaken: (uri: string, chatId: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  visible, chatId, onClose, onPhotoTaken,
}) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
      });
      if (photo?.uri) {
        onPhotoTaken(photo.uri, chatId);
      }
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto');
    } finally {
      setCapturing(false);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoTaken(result.assets[0].uri, chatId);
    }
  };

  if (!visible) return null;

  // Sin permisos
  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Acceso a la cámara</Text>
          <Text style={styles.permissionSub}>
            EGCHAT necesita acceso a la cámara para tomar fotos
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
            <Text style={styles.btnPrimaryText}>Permitir acceso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGallery} onPress={handleGallery}>
            <Text style={styles.btnGalleryText}>Elegir de la galería</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
            <Text style={styles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cámara</Text>
          <TouchableOpacity
            onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>🔄</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Visor */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          {/* Guía de encuadre */}
          <View style={styles.guide}>
            {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
              <View key={c} style={[
                styles.corner,
                c.startsWith('t') ? { top: 0 } : { bottom: 0 },
                c.endsWith('l') ? { left: 0 } : { right: 0 },
              ]} />
            ))}
          </View>
        </CameraView>

        {/* Controles */}
        <SafeAreaView style={styles.controls}>
          {/* Flash */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
          >
            <Text style={styles.controlBtnText}>{flash === 'on' ? '⚡' : '🔦'}</Text>
          </TouchableOpacity>

          {/* Disparador */}
          <TouchableOpacity
            style={[styles.shutter, capturing && styles.shutterCapturing]}
            onPress={handleCapture}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>

          {/* Galería */}
          <TouchableOpacity style={styles.controlBtn} onPress={handleGallery}>
            <Text style={styles.controlBtnText}>🖼️</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1, backgroundColor: '#000', alignItems: 'center',
    justifyContent: 'center', padding: 32, gap: 16,
  },
  permissionIcon: { fontSize: 64 },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  permissionSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 20, color: '#fff' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  camera: { flex: 1 },
  guide: {
    position: 'absolute', top: '15%', left: '10%', right: '10%', bottom: '15%',
  },
  corner: {
    position: 'absolute', width: 24, height: 24,
    borderColor: 'rgba(255,255,255,0.8)', borderWidth: 0,
  },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 20, backgroundColor: 'rgba(0,0,0,0.75)',
  },
  controlBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnText: { fontSize: 22 },
  shutter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterCapturing: { borderColor: '#00c8a0' },
  shutterInner: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff',
  },
  btnPrimary: {
    backgroundColor: '#00c8a0', borderRadius: 12, padding: 14,
    alignItems: 'center', width: '100%',
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnGallery: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
    alignItems: 'center', width: '100%',
  },
  btnGalleryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  btnCancel: { padding: 12, alignItems: 'center' },
  btnCancelText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
});

export default CameraModal;
