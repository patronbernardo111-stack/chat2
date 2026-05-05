import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Image, Animated, PanResponder, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../theme';

interface PhotoEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (uri: string) => void;
  title?: string;
}

const FILTERS = [
  { id: 'none',       label: 'Original',  style: {} },
  { id: 'warm',       label: 'Cálido',    style: { tintColor: undefined } },
  { id: 'cool',       label: 'Frío',      style: {} },
  { id: 'grayscale',  label: 'B&N',       style: {} },
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  visible, onClose, onSave, title = 'Editar foto',
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(1);
  const [filter, setFilter] = useState('none');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!imageUri) { Alert.alert('Error', 'Selecciona una imagen primero'); return; }
    onSave(imageUri);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: Colors.accent }]}>Guardar</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.preview}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.previewEmpty}>
              <Text style={styles.previewEmptyIcon}>🖼️</Text>
              <Text style={styles.previewEmptyText}>Selecciona una foto</Text>
            </View>
          )}
        </View>

        {/* Filtros */}
        {imageUri && (
          <View style={styles.filtersRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
            <Text style={styles.actionIcon}>🖼️</Text>
            <Text style={styles.actionLabel}>Galería</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>Cámara</Text>
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => setImageUri(null)}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionLabel}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, paddingTop: 56 },
  headerBtn: { padding: Spacing.sm },
  headerBtnText: { fontSize: FontSize.base, color: Colors.white },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: 300, height: 300, borderRadius: 150 },
  previewEmpty: { alignItems: 'center', gap: Spacing.md },
  previewEmptyIcon: { fontSize: 64 },
  previewEmptyText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.base },
  filtersRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  filterChipActive: { backgroundColor: Colors.accent },
  filterText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.semibold },
  filterTextActive: { color: Colors.white },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, paddingBottom: 48, paddingTop: Spacing.lg },
  actionBtn: { alignItems: 'center', gap: Spacing.xs },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium },
});
