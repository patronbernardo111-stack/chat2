// AvatarCropModal.tsx — Recorte de avatar para React Native con expo-image-manipulator
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  SafeAreaView, Image, PanResponder, Dimensions, Alert,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_W } = Dimensions.get('window');
const SIZE = Math.min(SCREEN_W - 48, 300);

interface AvatarCropModalProps {
  visible: boolean;
  imageUri: string;
  onSave: (croppedUri: string) => void;
  onClose: () => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  visible, imageUri, onSave, onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastOffset = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);
  const lastDist = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastOffset.current = { ...offset };
      },
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          // Pinch zoom
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (lastDist.current > 0) {
            const delta = dist / lastDist.current;
            setScale(s => Math.min(3, Math.max(0.5, s * delta)));
          }
          lastDist.current = dist;
        } else {
          lastDist.current = 0;
          setOffset({
            x: lastOffset.current.x + gs.dx,
            y: lastOffset.current.y + gs.dy,
          });
        }
      },
      onPanResponderRelease: () => {
        lastDist.current = 0;
      },
    })
  ).current;

  const handleSave = async () => {
    try {
      // Comprimir y redimensionar a 300x300
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );
      onSave(result.uri);
    } catch {
      Alert.alert('Error', 'No se pudo procesar la imagen');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelBtn}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Ajustar foto</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Arrastra para posicionar · Pellizca para zoom</Text>

          {/* Preview circular */}
          <View style={styles.cropArea} {...panResponder.panHandlers}>
            <View style={styles.circleClip}>
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.image,
                  {
                    transform: [
                      { translateX: offset.x },
                      { translateY: offset.y },
                      { scale },
                    ],
                  },
                ]}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Zoom slider */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderIcon}>🔍</Text>
            <View style={styles.sliderTrack}>
              <TouchableOpacity
                style={[styles.sliderFill, { width: `${((scale - 0.5) / 2.5) * 100}%` }]}
                onPress={() => {}}
              />
            </View>
            <View style={styles.sliderBtns}>
              <TouchableOpacity onPress={() => setScale(s => Math.max(0.5, s - 0.1))} style={styles.sliderBtn}>
                <Text style={styles.sliderBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScale(s => Math.min(3, s + 0.1))} style={styles.sliderBtn}>
                <Text style={styles.sliderBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
  container: { flex: 1, alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 16, paddingVertical: 12,
  },
  cancelBtn: { fontSize: 15, color: '#fff' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  saveBtn: { backgroundColor: '#00c8a0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 24 },
  cropArea: {
    width: SIZE + 40, height: SIZE + 40,
    alignItems: 'center', justifyContent: 'center',
  },
  circleClip: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2,
    overflow: 'hidden', borderWidth: 3, borderColor: '#00c8a0',
  },
  image: { width: SIZE, height: SIZE },
  sliderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 24, paddingHorizontal: 24, width: '100%',
  },
  sliderIcon: { fontSize: 16 },
  sliderTrack: {
    flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, overflow: 'hidden',
  },
  sliderFill: { height: '100%', backgroundColor: '#00c8a0', borderRadius: 2 },
  sliderBtns: { flexDirection: 'row', gap: 8 },
  sliderBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  sliderBtnText: { fontSize: 18, color: '#fff', fontWeight: '700' },
});

export default AvatarCropModal;
