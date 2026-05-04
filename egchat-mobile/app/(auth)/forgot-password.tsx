import React, { useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authAPI } from '../../src/api';
import { useAuth } from '../../src/hooks/useAuth';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight,
} from '../../src/theme';
import { EGButton, EGInput, EGErrorMessage } from '../../src/components/ui';

const COUNTRIES = [
  { code: 'GQ', name: 'Guinea Ecuatorial', phone: '+240' },
  { code: 'CM', name: 'Camerún', phone: '+237' },
  { code: 'GA', name: 'Gabón', phone: '+241' },
  { code: 'ES', name: 'España', phone: '+34' },
  { code: 'FR', name: 'Francia', phone: '+33' },
];
const getFlag = (code: string) =>
  String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));

type RecoverStep = 1 | 2 | 3;

export default function ForgotPasswordScreen() {
  const [recoverStep, setRecoverStep] = useState<RecoverStep>(1);
  const [countryCode, setCountryCode] = useState('+240');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const { sendVerification, verifyCode: doVerifyCode, resetPassword: doResetPassword } = useAuth();

  const fullPhone = countryCode + phone.replace(/\s/g, '');
  const selectedCountry = COUNTRIES.find(c => c.phone === countryCode) || COUNTRIES[0];

  const sendCode = async () => {
    if (!phone.trim()) { setError('Introduce tu número de teléfono'); return; }
    setLoading(true); setError('');
    const ok = await sendVerification(fullPhone);
    setLoading(false);
    if (ok) setRecoverStep(2);
    else setError('Error al enviar el código');
  };

  const verifyCode = async () => {
    if (code.length < 4) { setError('Introduce el código completo'); return; }
    setLoading(true); setError('');
    const verified = await doVerifyCode(fullPhone, code);
    setLoading(false);
    if (verified) setRecoverStep(3);
    else setError('Código incorrecto. Inténtalo de nuevo.');
  };

  const savePassword = async () => {
    if (newPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPass !== newPass2) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true); setError('');
    const ok = await doResetPassword(fullPhone, code, newPass);
    setLoading(false);
    if (ok) setDone(true);
    else setError('Error al cambiar la contraseña');
  };
    try {
      const { verified } = await authAPI.verifyCode(fullPhone, code);
      if (verified) setRecoverStep(3);
      else setError('Código incorrecto. Inténtalo de nuevo.');
    } catch (e: any) {
      setError(e.message || 'Código inválido');
    } finally { setLoading(false); }
  };

  const savePassword = async () => {
    if (newPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPass !== newPass2) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.resetPassword(fullPhone, code, newPass);
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Error al cambiar la contraseña');
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneIcon}>✅</Text>
          <Text style={styles.doneTitle}>¡Contraseña cambiada!</Text>
          <Text style={styles.doneSub}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
          <EGButton
            title="Ir a iniciar sesión"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.formArea}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Volver al login</Text>
            </TouchableOpacity>

            {/* Paso 1 — Teléfono */}
            {recoverStep === 1 && (
              <>
                <Text style={styles.title}>Recuperar cuenta</Text>
                <Text style={styles.subtitle}>Introduce tu número y te enviaremos un código</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>País</Text>
                  <View style={styles.countrySelector}>
                    <Text style={styles.countryFlag}>{getFlag(selectedCountry.code)}</Text>
                    <Text style={styles.countryName}>{selectedCountry.name}:</Text>
                  </View>
                </View>

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

                {error ? <EGErrorMessage text={error} /> : null}
                <EGButton
                  title={loading ? 'Enviando...' : 'Enviar código SMS'}
                  onPress={sendCode}
                  loading={loading}
                  disabled={!phone.trim()}
                />
              </>
            )}

            {/* Paso 2 — Código */}
            {recoverStep === 2 && (
              <>
                <Text style={styles.title}>Introduce el código</Text>
                <Text style={styles.subtitle}>
                  Enviamos un código a <Text style={styles.phoneHighlight}>{fullPhone}</Text>
                </Text>

                <EGInput
                  label="Código de verificación"
                  value={code}
                  onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                />

                {error ? <EGErrorMessage text={error} /> : null}
                <EGButton
                  title={loading ? 'Verificando...' : 'Verificar código'}
                  onPress={verifyCode}
                  loading={loading}
                  disabled={code.length < 4}
                  style={styles.btnMargin}
                />
                <TouchableOpacity onPress={sendCode} style={styles.resendBtn}>
                  <Text style={styles.resendText}>
                    {loading ? 'Enviando...' : 'Reenviar código'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Paso 3 — Nueva contraseña */}
            {recoverStep === 3 && (
              <>
                <Text style={styles.title}>Nueva contraseña</Text>
                <Text style={styles.subtitle}>Crea una contraseña segura para tu cuenta</Text>

                <EGInput
                  label="Nueva contraseña"
                  value={newPass}
                  onChangeText={setNewPass}
                  showPasswordToggle
                  placeholder="Mínimo 6 caracteres"
                />
                <EGInput
                  label="Confirmar contraseña"
                  value={newPass2}
                  onChangeText={setNewPass2}
                  secureTextEntry
                  placeholder="Repite la contraseña"
                  error={newPass2 && newPass !== newPass2 ? 'Las contraseñas no coinciden' : undefined}
                />

                {error ? <EGErrorMessage text={error} /> : null}
                <EGButton
                  title={loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                  onPress={savePassword}
                  loading={loading}
                  disabled={newPass.length < 6 || newPass !== newPass2}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { flexGrow: 1 },
  formArea: { flex: 1, padding: Spacing.screenPadding },
  backBtn: { alignSelf: 'flex-start', padding: Spacing.sm, marginBottom: Spacing.md },
  backText: { color: Colors.textTertiary, fontSize: FontSize.base },
  title: { ...Typography.headerTitle, textAlign: 'center', marginBottom: 6 },
  subtitle: { ...Typography.subtitle, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  phoneHighlight: { fontWeight: FontWeight.bold, color: Colors.textPrimary },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.fieldLabel, color: Colors.textTertiary, marginBottom: 5 },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.inputPaddingH,
    minHeight: 46,
    gap: Spacing.sm,
  },
  countryFlag: { fontSize: 18 },
  countryName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
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
  btnMargin: { marginBottom: Spacing.md },
  resendBtn: { alignItems: 'center', padding: Spacing.sm },
  resendText: { color: Colors.brand, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding },
  doneIcon: { fontSize: 56, marginBottom: Spacing.lg },
  doneTitle: { ...Typography.headerTitle, marginBottom: Spacing.sm, textAlign: 'center' },
  doneSub: { ...Typography.subtitle, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
});
