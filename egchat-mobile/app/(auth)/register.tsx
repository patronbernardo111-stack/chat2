import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../../src/api';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { EGButton, EGInput, EGErrorMessage } from '../../src/components/ui';

const COUNTRIES = [
  { code: 'GQ', name: 'Guinea Ecuatorial', phone: '+240' },
  { code: 'CM', name: 'Camerún', phone: '+237' },
  { code: 'GA', name: 'Gabón', phone: '+241' },
  { code: 'NG', name: 'Nigeria', phone: '+234' },
  { code: 'ES', name: 'España', phone: '+34' },
  { code: 'FR', name: 'Francia', phone: '+33' },
  { code: 'GB', name: 'Reino Unido', phone: '+44' },
  { code: 'US', name: 'Estados Unidos', phone: '+1' },
];

const getFlag = (code: string) =>
  String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));

// Barra de progreso — igual que la web
const ProgressBar = ({ step }: { step: number }) => (
  <View style={styles.progressBar}>
    {[1, 2, 3].map(i => (
      <View
        key={i}
        style={[styles.progressSegment, { backgroundColor: i <= step ? Colors.accent : Colors.border }]}
      />
    ))}
  </View>
);

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [countryCode, setCountryCode] = useState('+240');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const selectedCountry = COUNTRIES.find(c => c.phone === countryCode) || COUNTRIES[0];
  const fullPhone = countryCode + phone.replace(/\s/g, '');

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const goNext = async () => {
    setError('');
    if (step === 1) {
      if (!name.trim()) { setError('Escribe tu nombre completo'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!phone.trim()) { setError('Introduce tu número de teléfono'); return; }
      if (phone.replace(/\s/g, '').length < 6) { setError('Número de teléfono inválido'); return; }
      // Verificar si el teléfono ya existe
      try {
        const { exists } = await authAPI.checkPhone(fullPhone);
        if (exists) { setError('Este número ya está registrado. Usa "Ya tengo cuenta".'); return; }
      } catch {}
      setStep(3);
    } else if (step === 3) {
      if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
      if (password !== password2) { setError('Las contraseñas no coinciden'); return; }
      await doRegister();
    }
  };

  const doRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await authAPI.register({
        full_name: name.trim(),
        phone: fullPhone,
        password,
        avatar_url: avatar || undefined,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('ya está registrado') || msg.includes('409')) {
        setError('Este número ya está registrado.');
      } else if (msg.includes('fetch') || msg.includes('network')) {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        setError(msg || 'Error al registrarse. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    if (step === 1) router.back();
    else setStep(s => s - 1);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Atrás</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.stepLabel}>Paso {step} de 3</Text>
            <ProgressBar step={step} />
          </View>

          <View style={styles.formArea}>
            {/* ── Paso 1: Nombre + Avatar ── */}
            {step === 1 && (
              <>
                <EGInput
                  label="Nombre Completo"
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={goNext}
                />

                {/* Avatar picker — igual que la web */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Foto de Perfil <Text style={styles.optional}>(opcional)</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={pickAvatar}
                    style={[styles.avatarPicker, avatar ? styles.avatarPickerFilled : null]}
                    activeOpacity={0.8}
                  >
                    {avatar ? (
                      <>
                        <Image source={{ uri: avatar }} style={styles.avatarPreview} />
                        <View style={styles.avatarBadge}>
                          <Text style={styles.avatarBadgeText}>✓</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={styles.avatarIcon}>📷</Text>
                        <Text style={styles.avatarTitle}>Subir foto de perfil</Text>
                        <Text style={styles.avatarSub}>Toca para seleccionar</Text>
                        <Text style={styles.avatarHint}>Puedes añadirla después</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {avatar && (
                    <View style={styles.avatarActions}>
                      <TouchableOpacity onPress={pickAvatar} style={styles.avatarActionBtn}>
                        <Text style={styles.avatarActionText}>📷 Cambiar foto</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setAvatar('')} style={styles.avatarRemoveBtn}>
                        <Text style={styles.avatarRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ── Paso 2: País + Teléfono ── */}
            {step === 2 && (
              <>
                {/* Selector de país */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>País</Text>
                  <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setShowCountryPicker(p => !p)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.countryFlag}>{getFlag(selectedCountry.code)}</Text>
                    <Text style={styles.countryName}>{selectedCountry.name}:</Text>
                    <Text style={styles.countryChevron}>›</Text>
                  </TouchableOpacity>
                  {showCountryPicker && (
                    <View style={styles.countryDropdown}>
                      {COUNTRIES.map(c => (
                        <TouchableOpacity
                          key={c.phone}
                          style={styles.countryOption}
                          onPress={() => { setCountryCode(c.phone); setShowCountryPicker(false); }}
                        >
                          <Text style={styles.countryFlag}>{getFlag(c.code)}</Text>
                          <Text style={styles.countryOptionText}>{c.name}</Text>
                          <Text style={styles.countryPhone}>{c.phone}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Teléfono */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Teléfono</Text>
                  <View style={styles.phoneRow}>
                    <View style={styles.phonePrefix}>
                      <Text style={styles.phonePrefixText}>{countryCode}</Text>
                    </View>
                    <EGInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="222 XXX XXX"
                      keyboardType="phone-pad"
                      containerStyle={styles.phoneInputContainer}
                      returnKeyType="next"
                    />
                  </View>
                </View>
              </>
            )}

            {/* ── Paso 3: Contraseña ── */}
            {step === 3 && (
              <>
                <EGInput
                  label="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  showPasswordToggle
                  placeholder="Mínimo 6 caracteres"
                  returnKeyType="next"
                />
                <EGInput
                  label="Confirmar Contraseña"
                  value={password2}
                  onChangeText={setPassword2}
                  secureTextEntry
                  placeholder="Repite la contraseña"
                  error={password2 && password !== password2 ? 'Las contraseñas no coinciden' : undefined}
                  returnKeyType="done"
                  onSubmitEditing={goNext}
                />
              </>
            )}

            {/* Error */}
            {error ? <EGErrorMessage text={error} /> : null}

            {/* Botón continuar */}
            <EGButton
              title={
                step === 3
                  ? (loading ? 'Registrando...' : 'Registrarme')
                  : (!name.trim() && step === 1 ? 'Escribe tu nombre primero' : 'Continuar →')
              }
              onPress={goNext}
              loading={loading}
              disabled={step === 1 && !name.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { flexGrow: 1, paddingBottom: Spacing['3xl'] },

  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  title: { ...Typography.headerTitle, textAlign: 'center', marginBottom: 4 },
  stepLabel: { ...Typography.subtitle, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },
  progressBar: { flexDirection: 'row', gap: 4 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },

  formArea: { flex: 1, paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md },

  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.fieldLabel, color: Colors.textTertiary, marginBottom: 5 },
  optional: { color: Colors.textTertiary, fontWeight: FontWeight.regular, textTransform: 'none' },

  // Avatar picker
  avatarPicker: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 3,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPickerFilled: {
    borderColor: Colors.accent,
    borderStyle: 'solid',
  },
  avatarPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  avatarBadgeText: { color: Colors.white, fontSize: 14 },
  avatarIcon: { fontSize: 48, marginBottom: 8 },
  avatarTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  avatarSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },
  avatarHint: { fontSize: 11, color: Colors.textTertiary, marginTop: 6, fontWeight: FontWeight.medium },
  avatarActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  avatarActionBtn: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  avatarActionText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  avatarRemoveBtn: {
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRemoveText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.errorText },

  // Country selector
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.inputPaddingV,
    paddingHorizontal: Spacing.inputPaddingH,
    minHeight: 46,
    gap: Spacing.sm,
  },
  countryFlag: { fontSize: 18 },
  countryName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  countryChevron: { fontSize: 18, color: Colors.textTertiary },
  countryDropdown: {
    marginTop: 4,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
    zIndex: 100,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  countryOptionText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  countryPhone: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: FontWeight.medium },

  // Phone
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start' },
  phonePrefix: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  phoneInputContainer: { flex: 1, marginBottom: 0 },
});
