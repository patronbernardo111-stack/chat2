import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Colors, Typography, Spacing, BorderRadius,
  Shadow, FontSize, FontWeight,
} from '../../src/theme';
import { EGButton, EGInput, EGErrorMessage } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import {
  isBiometricAvailable, isBiometricLoginEnabled,
  authenticateWithBiometrics, getBiometricCredentials,
  saveBiometricCredentials, getBiometricType,
} from '../../src/biometrics';
import { authAPI } from '../../src/api';

// Países igual que la web
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
  String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))
  );

export default function LoginScreen() {
  const [countryCode, setCountryCode] = useState('+240');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const { login, isLoading, error, clearError } = useAuth();

  // Animación del logo (spin igual que la web)
  const spinAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  }, []);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const selectedCountry = COUNTRIES.find(c => c.phone === countryCode) || COUNTRIES[0];
  const fullPhone = countryCode + phone.replace(/\s/g, '');

  const doLogin = () => login(fullPhone, password);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header con logo (igual que la web) ── */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Animated.Image
                source={require('../../assets/icon.png')}
                style={[styles.logoImg, { transform: [{ rotate: spin }] }]}
                resizeMode="contain"
              />
            </View>

            {/* Banderas de países */}
            <View style={styles.flagsRow}>
              {['GQ', 'CM', 'GA', 'NG', 'ES', 'FR', 'GB', 'US'].map(code => (
                <Text key={code} style={styles.flag}>{getFlag(code)}</Text>
              ))}
            </View>
          </View>

          {/* ── Formulario ── */}
          <View style={styles.formArea}>
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>Introduce tu teléfono y contraseña</Text>

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
                      onPress={() => {
                        setCountryCode(c.phone);
                        setShowCountryPicker(false);
                      }}
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
                />
              </View>
            </View>

            {/* Contraseña */}
            <EGInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              showPasswordToggle
              onSubmitEditing={doLogin}
              returnKeyType="done"
            />

            {/* Error */}
            {error ? <EGErrorMessage text={error} /> : null}

            {/* Botón entrar */}
            <EGButton
              title={isLoading ? 'Entrando...' : 'Entrar'}
              onPress={doLogin}
              loading={isLoading}
              style={styles.loginBtn}
            />

            {/* Olvidé contraseña */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password' as any)}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Crear cuenta */}
            <EGButton
              title="Crear cuenta nueva"
              onPress={() => router.push('/(auth)/register' as any)}
              variant="outline"
            />

            {/* Volver */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>← Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing['3xl'],
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  logoImg: {
    width: 60,
    height: 60,
  },
  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  flag: {
    fontSize: 18,
    lineHeight: 22,
  },

  // Form
  formArea: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
  },
  title: {
    ...Typography.headerTitle,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Country selector
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.fieldLabel,
    color: Colors.textTertiary,
    marginBottom: 5,
  },
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
  countryFlag: {
    fontSize: 18,
  },
  countryName: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  countryChevron: {
    fontSize: 18,
    color: Colors.textTertiary,
  },
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
  countryOptionText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  countryPhone: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },

  // Phone input
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
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
  phonePrefixText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  phoneInputContainer: {
    flex: 1,
    marginBottom: 0,
  },

  // Buttons
  loginBtn: {
    marginBottom: Spacing.md,
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  forgotText: {
    color: Colors.brand,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  backText: {
    color: Colors.textTertiary,
    fontSize: FontSize.base,
  },
});
