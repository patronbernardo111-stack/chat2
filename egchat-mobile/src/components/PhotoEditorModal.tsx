// PhotoEditorModal.tsx — Editor de fotos para React Native
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Modal, SafeAreaView, Image, FlatList,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

interface PhotoEditorModalProps {
  visible: boolean;
  photoUri: string;
  chatId: string;
  onClose: () => void;
  onSend: (chatId: string, caption: string, editedUri: string) => void;
}

type Tool = 'filters' | 'adjust' | 'rotate' | 'text';

interface Filter {
  id: string;
  label: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

const FILTERS: Filter[] = [
  { id: 'none', label: 'Original' },
  { id: 'bw', label: 'B&N', saturation: 0 },
  { id: 'warm', label: 'Cálido', brightness: 1.1, saturation: 1.3 },
  { id: 'cool', label: 'Frío', brightness: 0.95, saturation: 0.8 },
  { id: 'vivid', label: 'Vívido', contrast: 1.2, saturation: 1.8 },
  { id: 'fade', label: 'Fade', brightness: 1.05, contrast: 0.85, saturation: 0.7 },
  { id: 'drama', label: 'Drama', contrast: 1.4, brightness: 0.9 },
];

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  visible, photoUri, chatId, onClose, onSend,
}) => {
  const [tool, setTool] = useState<Tool>('filters');
  const [filter, setFilter] = useState('none');
  const [rotation, setRotation] = useState(0);
  const [caption, setCaption] = useState('');
  const [overlayText, setOverlayText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSend = async () => {
    try {
      setProcessing(true);
      const actions: ImageManipulator.Action[] = [];

      if (rotation !== 0) {
        actions.push({ rotate: rotation });
      }

      const result = await ImageManipulator.manipulateAsync(
        photoUri,
        actions,
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      onSend(chatId, caption, result.uri);
    } catch {
      onSend(chatId, caption, photoUri);
    } finally {
      setProcessing(false);
    }
  };

  const TOOLS: { id: Tool; label: string; icon: string }[] = [
    { id: 'filters', label: 'Filtros', icon: '🎨' },
    { id: 'adjust', label: 'Ajustar', icon: '⚙️' },
    { id: 'rotate', label: 'Rotar', icon: '🔄' },
    { id: 'text', label: 'Texto', icon: '✏️' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar foto</Text>
          <TouchableOpacity
            style={[styles.sendBtn, processing && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={processing}
          >
            <Text style={styles.sendBtnText}>{processing ? '...' : 'Enviar'}</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Preview */}
        <View style={styles.preview}>
          <Image
            source={{ uri: photoUri }}
            style={[
              styles.previewImage,
              rotation !== 0 && { transform: [{ rotate: `${rotation}deg` }] },
            ]}
            resizeMode="contain"
          />
          {overlayText ? (
            <View style={styles.overlayTextWrap}>
              <Text style={styles.overlayText}>{overlayText}</Text>
            </View>
          ) : null}
        </View>

        {/* Panel herramientas */}
        <View style={styles.panel}>

          {/* Filtros */}
          {tool === 'filters' && (
            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 12, gap: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterItem, filter === item.id && styles.filterItemActive]}
                  onPress={() => setFilter(item.id)}
                >
                  <Image source={{ uri: photoUri }} style={styles.filterThumb} resizeMode="cover" />
                  <Text style={[styles.filterLabel, filter === item.id && styles.filterLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Rotar */}
          {tool === 'rotate' && (
            <View style={styles.rotatePanel}>
              {[
                { label: '↺ -90°', action: () => setRotation(r => (r - 90 + 360) % 360) },
                { label: '↻ +90°', action: () => setRotation(r => (r + 90) % 360) },
                { label: '⟳ Reset', action: () => setRotation(0) },
              ].map(b => (
                <TouchableOpacity key={b.label} style={styles.rotateBtn} onPress={b.action}>
                  <Text style={styles.rotateBtnText}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Texto */}
          {tool === 'text' && (
            <View style={styles.textPanel}>
              {showTextInput ? (
                <View style={styles.textInputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={textInput}
                    onChangeText={setTextInput}
                    placeholder="Escribe el texto..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.textOkBtn}
                    onPress={() => { setOverlayText(textInput); setShowTextInput(false); }}
                  >
                    <Text style={styles.textOkBtnText}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.textCancelBtn}
                    onPress={() => { setShowTextInput(false); setTextInput(''); }}
                  >
                    <Text style={styles.textCancelBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.textBtns}>
                  <TouchableOpacity
                    style={styles.addTextBtn}
                    onPress={() => { setTextInput(overlayText); setShowTextInput(true); }}
                  >
                    <Text style={styles.addTextBtnText}>
                      {overlayText ? '✏️ Editar texto' : '+ Añadir texto'}
                    </Text>
                  </TouchableOpacity>
                  {overlayText ? (
                    <TouchableOpacity
                      style={styles.removeTextBtn}
                      onPress={() => setOverlayText('')}
                    >
                      <Text style={styles.removeTextBtnText}>Quitar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          )}

          {/* Barra de herramientas */}
          <View style={styles.toolbar}>
            {TOOLS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.toolBtn, tool === t.id && styles.toolBtnActive]}
                onPress={() => setTool(t.id)}
              >
                <Text style={styles.toolIcon}>{t.icon}</Text>
                <Text style={[styles.toolLabel, tool === t.id && styles.toolLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Caption */}
          <SafeAreaView style={styles.captionRow}>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Añade un pie de foto..."
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <TouchableOpacity style={styles.sendFab} onPress={handleSend} disabled={processing}>
              <Text style={styles.sendFabText}>➤</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.6)',
  },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 20, color: '#fff' },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  sendBtn: { backgroundColor: '#00c8a0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  sendBtnDisabled: { backgroundColor: '#555' },
  sendBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  preview: {
    flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  overlayTextWrap: {
    position: 'absolute', bottom: '12%', left: 0, right: 0, alignItems: 'center',
  },
  overlayText: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  panel: { backgroundColor: 'rgba(0,0,0,0.85)', flexShrink: 0 },
  filterItem: { alignItems: 'center', gap: 4 },
  filterItemActive: {},
  filterThumb: { width: 52, height: 52, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  filterLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  filterLabelActive: { color: '#00c8a0', fontWeight: '700' },
  rotatePanel: { flexDirection: 'row', gap: 10, padding: 12, flexWrap: 'wrap' },
  rotateBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  rotateBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  textPanel: { padding: 12 },
  textInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  textInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10,
    padding: 10, fontSize: 14, color: '#fff',
  },
  textOkBtn: { backgroundColor: '#00c8a0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  textOkBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  textCancelBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  textCancelBtnText: { fontSize: 13, color: '#fff' },
  textBtns: { flexDirection: 'row', gap: 10 },
  addTextBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  addTextBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  removeTextBtn: {
    backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  removeTextBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  toolbar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  toolBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  toolBtnActive: {},
  toolIcon: { fontSize: 18 },
  toolLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  toolLabelActive: { color: '#00c8a0', fontWeight: '700' },
  captionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  captionInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#fff',
  },
  sendFab: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#00c8a0',
    alignItems: 'center', justifyContent: 'center',
  },
  sendFabText: { fontSize: 18, color: '#fff' },
});

export default PhotoEditorModal;
